import { App } from "octokit";
import { processRepositoryArchive } from "./gitLabInterface";
import { findDBAndSchema } from "./gitLabInterface";
import { initializeQueue } from "./queue/queue";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { removeJob } from "./queue/queue";
import { Octokit } from "octokit";
import { ProcessedGitCommit } from "./embeddings";
import { createEmbedder } from "./embeddings";

export const connectToGithub = async () => {
  const installationID = parseInt(process.env.GITHUB_INSTALLATION_ID);
  const octokit = new App({
    privateKey: process.env["GITHUB_PRIVATE_KEY"],
    appId: process.env.GITHUB_APP_ID,
  });

  const octokitInstallation = await octokit.getInstallationOctokit(
    installationID
  );

  return octokitInstallation;
};

// get github repository zip file, unzip, parse for comments and generate embeddings from them
export const fetchGithubZip = async (octokit: Octokit, repo: string = "") => {
  const zip = await octokit.request("GET /repos/{owner}/{repo}/zipball/", {
    owner: process.env.GITHUB_OWNER,
    repo: repo,
  });
  const zipFile = zip.data;
  const zipFileBuffer = Buffer.from(zipFile, "base64");
  const comments = await processRepositoryArchive(zipFileBuffer, "github");
  return comments;
};

// get the contents of a file
export const fetchGithubFileContents = async (
  octokit: Octokit,
  repo: string = "",
  path: string = ""
) => {
  const file = await octokit.request(
    "GET /repos/{owner}/{repo}/contents/{path}",
    {
      owner: process.env.GITHUB_OWNER || "",
      repo,
      path,
    }
  );
  // something's goofy in Octokit's types
  // @ts-ignore
  const fileContent = file?.data?.content;
  return atob(fileContent);
};

// fetc commits, parse out the commit messages
export const fetchCommits = async (octokit: Octokit, repo: string = "") => {
  const redisURL = process.env.VALQUERYQUEUE_URL || "";
  const projectYML = await fetchGithubFileContents(
    octokit,
    repo,
    process.env.DBT_YML_PATH || ""
  );

  const rateLimitQueue = await initializeQueue("rate-limit");
  const worker = new Worker(
    "rate-limit",
    async (job) => {
      const commits = job.data.commits;
      const repo = job.data.repo;

      let messages = commits.map((commit: any) => {
        const responseObject = <ProcessedGitCommit>{};
        responseObject["message"] = commit.commit.message;
        responseObject["author"] = commit.commit.author;
        responseObject["html_url"] = commit.html_url;
        responseObject["sha"] = commit.sha;
        responseObject["source"] = "GitHub";

        return responseObject;
      });

      messages.forEach(async (commit: ProcessedGitCommit) => {
        await processGitHubCommit(octokit, commit, repo, projectYML);
      });
    },
    {
      connection: new IORedis(redisURL, {
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        tls: {},
      }),
      limiter: {
        max: 1,
        duration: 72000,
      },
    }
  );
  worker.on("completed", async (job) => {
    console.log(`Job completed for ${job.id}`);
    await removeJob(job);
  });
  worker.on("failed", async (job, err) => {
    console.error(`${job?.id} has failed with ${err.message}`);
    await removeJob(job);
  });

  worker.on("error", (err) => {
    console.log(err);
  });

  const iterator = octokit.paginate.iterator(
    "GET /repos/{owner}/{repo}/commits",
    {
      owner: process.env.GITHUB_OWNER || "",
      repo: repo,
      per_page: 100,
    }
  );

  for await (const { data: commits } of iterator) {
    console.log(commits.length);
    rateLimitQueue.add("rate-limit", { commits, repo });
  }

  return { message: "initialized github commit processing" };
};

export const processGitHubCommit = async (
  octokit: Octokit,
  commit: ProcessedGitCommit,
  repo: string = "",
  projectYML: string
) => {
  const fullCommit = await octokit.request(
    "GET /repos/{owner}/{repo}/commits/{ref}",
    {
      owner: process.env.GITHUB_OWNER || "",
      repo: repo,
      ref: commit.sha,
    }
  );

  const tables: Array<string> = [];

  if (!fullCommit?.data?.files?.length) return false;
  for (let i = 0; i < fullCommit.data.files?.length; i++) {
    const file = fullCommit.data.files[i];
    if (file.filename.includes(".sql")) {
      const schema = await findDBAndSchema(file, projectYML);
      if (schema) {
        const model = file?.filename?.split("/")?.at(-1)?.slice(0, -4);
        const dbAndSchema = schema.database + "." + schema.schema;
        const modelAndSchema = dbAndSchema + "." + model;
        tables.push(modelAndSchema);
      }
    }
  }

  if (!tables.length) return false;
  if (tables.length) commit["tables"] = tables;

  const embedder = createEmbedder();
  const result = await embedder.generateEmbeddings([commit], "commit");
  return result;
};
