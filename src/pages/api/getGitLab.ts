/*
function to fetch all commits from a gitlab repo and proces them into embeddings
1. fetch first page of commits from gitlab
2.1 for each commit in the page..
2.2 get the diff
3.1 for each file (new_path) in the diff...
3.2 get the file
3.3 check to see if it is model (.sql && !sources.yml)
3.3 decode the file contents
3.4 parse the contents looking for...
4.1 mentions of models
*/

import { NextApiRequest, NextApiResponse } from "next";
import { getGitLabCommits, getGitLabComments } from "@/lib/gitLabInterface";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let gitLabResponse: any;
  const getType = req.query.type as string;
  const path = req.query.path as string;
  const repo = req.query.repo as string;
  const ref = req.query.ref as string;
  const repoNum = parseInt(repo);
  switch (getType) {
    case "commits":
      gitLabResponse = await getGitLabCommits(repoNum, path, ref);
      break;
    case "sqlDirectories":
      gitLabResponse = await getGitLabComments(repoNum, path);
      break;
    default:
      return res.status(404).json({ error: "no type provided" });
  }
  return res.status(200).json(gitLabResponse);
}
