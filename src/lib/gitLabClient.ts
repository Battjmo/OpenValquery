// a function that gets a file from a gitlab repo
import { Gitlab } from "@gitbeaker/rest";

let gitLabClient: InstanceType<typeof Gitlab> | null = null;

export const getGitLabClient = async () => {
  if (gitLabClient) {
    return gitLabClient;
  } else {
    gitLabClient = new Gitlab({
      token: process.env.GITLAB_TOKEN,
    });
  }
  return gitLabClient;
};
