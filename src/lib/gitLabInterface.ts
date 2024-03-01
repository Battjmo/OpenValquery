import { getGitLabClient } from "./gitLabClient";
import fs from "node:fs/promises";
import { sliceIntoChunks } from "./utils";
import YAML from "yaml";
import { databaseNameExtractor } from "./dbtParsing/databaseNameExtractor";
import {
  EmbedderInterface,
  ProcessedGitCommit,
  Reference,
  createEmbedder,
} from "../lib/embeddings";
import {
  Camelize,
  CommitDiffSchema,
  CommitSchema,
  Gitlab,
  OffsetPagination,
  RepositoryFileExpandedSchema,
} from "@gitbeaker/rest";

export const getGitLabFile = async (
  path: string,
  repo: number,
  ref = "main"
) => {
  const gitLabClient = await getGitLabClient();
  if (gitLabClient) {
    const file = await gitLabClient.RepositoryFiles.show(repo, path, ref);
    const decodedFile = atob(file.content);
    return decodedFile;
  }
};

export const getGitLabCommits = async (
  repo: number,
  path: string,
  ref: string
) => {
  let commits: unknown[] = [];
  let page: number | null | undefined = 1;
  const gitLabClient = await getGitLabClient();
  const embedder = createEmbedder();
  while (page) {
    const pageCommits = await getGitLabPage(
      repo,
      path,
      ref,
      page,
      gitLabClient
    );
    const processedCommits = await processGitLabCommits(
      pageCommits,
      repo,
      ref,
      gitLabClient,
      embedder
    );
    commits = commits.concat(processedCommits);
    const nextPage = pageCommits?.paginationInfo.next;
    page = nextPage;
  }
  return commits;
};

export const getGitLabPage = async (
  repo: number,
  path = "",
  ref = "main",
  page = 1,
  gitLabClient: InstanceType<typeof Gitlab>
) => {
  if (gitLabClient) {
    const commits = await gitLabClient.Commits.all(repo, {
      refName: ref,
      path: path,
      perPage: 20,
      showExpanded: true,
      page: page,
    });
    return commits;
  }
};

export const processGitLabCommits = async (
  commits:
    | {
        paginationInfo: OffsetPagination;
        data: (CommitSchema | Camelize<CommitSchema>)[];
      }
    | undefined,
  repo: number,
  ref: string,
  gitLabClient: InstanceType<typeof Gitlab>,
  embedder: EmbedderInterface
) => {
  const gitLabYMLPath = process.env.DBT_YML_PATH || "";
  const projectYML = await getGitLabFile(gitLabYMLPath, repo, ref);
  let formattedCommits = commits?.data.map((commit) => {
    const responseObject = <ProcessedGitCommit>{};
    const author = {
      name: commit.author_name as string,
      email: commit.author_email as string,
      date: commit.authored_date as string,
    };
    responseObject["message"] = commit.message;
    responseObject["author"] = author;
    responseObject["html_url"] = commit.web_url as string;
    responseObject["type"] = "commit";
    responseObject["source"] = "GitLab";
    return responseObject;
  });
  if (formattedCommits && projectYML && gitLabClient) {
    formattedCommits = await Promise.all(
      formattedCommits.map(async (commit) => {
        const tables = await getGitLabCommitModels(
          commit,
          repo,
          gitLabClient,
          projectYML
        );
        if (tables) commit["tables"] = tables;
        return commit;
      })
    );
  }

  formattedCommits = formattedCommits?.filter((commit) => {
    return commit?.tables.length > 0;
  });

  const result = await embedder.generateEmbeddings(
    formattedCommits || [],
    "commit"
  );
  return result;
};

export const getGitLabCommitModels = async (
  commit: ProcessedGitCommit,
  repo: number,
  gitLabClient: InstanceType<typeof Gitlab>,
  projectYML: string
) => {
  if (gitLabClient) {
    const files = await gitLabClient.Commits.showDiff(repo, commit.id);
    const models: string[] = [];
    files.forEach(async (file) => {
      if (file.new_path && typeof file.new_path === "string") {
        let tableName = file?.new_path?.split("/").at(-1);
        const isTable = tableName?.includes(".sql");
        if (isTable) {
          tableName =
            (await findRealTableName(file)) || tableName?.slice(0, -4);
          const DBAndSchema = await findDBAndSchema(file, projectYML);
          if (!DBAndSchema) return;
          tableName = `${DBAndSchema.database}.${DBAndSchema.schema}.${tableName}`;
          models.push(tableName);
        }
      }
    });
    return models;
  }
};

// identify if there is an alias in the sql config and use it if yes
export const findRealTableName = async (
  file: CommitDiffSchema | Camelize<CommitDiffSchema>
) => {
  const fileContent = file?.data?.toString();
  if (fileContent === undefined) return null;
  const sqlAliasRegex = /alias=\s*['"](.*)['"]/g;
  const sqlAliasMatch = sqlAliasRegex.exec(fileContent);
  if (sqlAliasMatch) {
    return sqlAliasMatch[1];
  }
  return null;
};

// determine if there is a schema in the sql config and use it if yes
export const findSchemaInConfig = async (
  file: CommitDiffSchema | Camelize<CommitDiffSchema>
) => {
  const fileContent =
    file?.data?.toString() || file?.diff?.toString() || file?.patch?.toString();
  if (fileContent === undefined) return null;
  const sqlSchemaRegex = /"schema":\s*['"](.*)['"]/g;
  const sqlSchemaMatch = sqlSchemaRegex.exec(fileContent);
  if (sqlSchemaMatch) {
    return sqlSchemaMatch[1];
  }
  return null;
};

// determine if there is a schema in the sql config and use it if yes
export const findDBInConfig = async (
  file: RepositoryFileExpandedSchema | Camelize<RepositoryFileExpandedSchema>
) => {
  const fileContent = file?.data?.toString() || (file.diff as string);
  const sqlDatabaseRegex = /"database":\s*['"](.*)['"]/g;
  const sqlDatabaseMatch = sqlDatabaseRegex.exec(fileContent);
  if (sqlDatabaseMatch) {
    return sqlDatabaseMatch[1];
  }
  return null;
};
// find the schemas of a sql file, either in the config or the yml file
// TODO FIGURE OUT IF I NEED THE ALIAS IN HERE INSTEAD OF THE PATH
export const findDBAndSchema = async (
  file: any,
  projectYML: any,
  alias = ""
) => {
  let result = {} as DBAndSchema;
  // find the schema in the sql file
  let schema = await findSchemaInConfig(file);
  if (schema) result.schema = schema;
  let database = await findDBInConfig(file);
  if (database) result.database = database;
  if (schema && database) return result;
  // find the schema in the yml file
  const filePath = file.path || file.new_path || file.filename;
  result = await findDBAndSchemaInYML(filePath, projectYML, result);
  if (!result.schema) return null;
  if (result.database) result.database = databaseNameExtractor(result.database);
  return result;
};

// traverse the parsed project yml file to find the schema for a given file
export const findDBAndSchemaInYML = async (
  path: string,
  projectYML: any,
  result: DBAndSchema
) => {
  const yamlcontents =
    typeof projectYML === "string" ? projectYML : projectYML[0].data.toString();
  const skipSchema = result.schema;
  const skipDatabase = result.database;
  let projectYMLContent = YAML.parse(yamlcontents);
  // identify the name so we can filter it out
  const projectYMLName = projectYMLContent.name || "";
  // split the path into an array
  const splitPath = path.split("/");
  if (!splitPath.includes("models")) return result;
  // find the root of the actual dbt project within the repo, if we're starting from above
  // cut out the parts we don't need
  const startOfPathToSchema = splitPath.slice(splitPath.indexOf("models"));
  // find the schema in the yml file
  let i = 0;
  let currentSegment;
  let schema = result.schema || "";
  let database = result.database || "";
  while (i < startOfPathToSchema.length) {
    currentSegment = projectYMLContent[projectYMLName]
      ? projectYMLName
      : startOfPathToSchema[i];
    if (!projectYMLContent[projectYMLName]) i++;
    projectYMLContent = projectYMLContent[currentSegment];
    if (currentSegment) {
      if (!skipSchema) {
        schema = projectYMLContent
          ? projectYMLContent["+schema"] || schema
          : schema;
      }
      if (!skipDatabase) {
        database = projectYMLContent
          ? projectYMLContent["+database"] || database
          : database;
      }
    }
    if (!projectYMLContent) break;
  }
  result = { schema: schema, database: database };
  return result;
};

export const processRepositoryArchive = async (
  buffer: Buffer,
  source = "GitLab"
) => {
  const comments: Reference[] = [];
  var decompresser = require("decompress");
  await decompresser(buffer, "tmp").then(async (files: any) => {
    const sqlFiles = files.filter(
      (file: CommitDiffSchema | Camelize<CommitDiffSchema>) => {
        const filePath = file.path as string;
        return (
          filePath.slice(-4) === ".sql" &&
          filePath.split("/").includes("models")
        );
      }
    );
    const projectYML = files.filter((file: any) => {
      return file.path.includes("dbt_project.yml");
    });
    sqlFiles.forEach(async (file: any) => {
      let fullTableName = "";
      const fileContents = (file.data as string).toString();
      // change to fileContents
      const alias = await findRealTableName(file);
      const tableName =
        alias || (file.path as string)?.split("/")?.pop()?.slice(0, -4);
      let DBAndSchema = await findDBAndSchema(file, projectYML, alias || "");
      if (!DBAndSchema) {
        return;
      }
      fullTableName = DBAndSchema.database
        ? `${DBAndSchema.database}.${DBAndSchema.schema}`
        : DBAndSchema.schema;
      fullTableName += `.${tableName}`;
      const regex = /(--.*)|(((\/\*)+?[\w\W]+?(\*\/)+))/g;
      let match;
      while ((match = regex.exec(fileContents))) {
        let message = match[0].replace(/[\n\r]+/g, " ");
        // remove the comment characters from the message
        message = message.replace(/\/\*/g, "");
        message = message.replace(/\*\//g, "");
        message = message.replace(/--/g, "");
        message = message.trim();
        const comment = {
          message: message,
          tables: [fullTableName],
          newName: !!alias,
          source: source,
        };
        comments.push(comment);
      }
    });
    await fs.rm("tmp", { recursive: true, force: true });
  });
  const embedder = createEmbedder();
  const batches = sliceIntoChunks<Reference>(comments, 20);
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    await embedder.generateEmbeddings(batch, "sql_comment");
  }
  return comments;
};

/* 
function that will recursively traverse a gitlab directory and return a list of all sql files and their comments
needs to capture multiline comments
*/

export const getGitLabComments = async (repo: number, path: string) => {
  const gitLabClient = await getGitLabClient();
  let repositoryArchive;
  if (gitLabClient) {
    repositoryArchive = await gitLabClient.Repositories.showArchive(repo, {
      path: path,
      fileType: "zip",
    });

    const arraybuffer = await repositoryArchive.arrayBuffer();
    const buffer = Buffer.from(arraybuffer);
    const comments = await processRepositoryArchive(buffer, "GitLab");
    return comments;
  }
};
