import { NextApiRequest, NextApiResponse } from "next";
import {
  connectToGithub,
  fetchCommits,
  fetchGithubZip,
} from "@/lib/gitHubInterface";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const repo = req.query.repo as string;
  const type = req.query.type as string;
  const octokit = await connectToGithub();
  switch (type) {
    case "commits":
      const commits = await fetchCommits(octokit, repo);
      return res.status(200).json(commits);
    case "repositoryArchive":
      const archive = await fetchGithubZip(octokit, repo);
      return res.status(200).json(archive);
    default:
      return res.status(400).json({ error: "type is required" });
  }
}
