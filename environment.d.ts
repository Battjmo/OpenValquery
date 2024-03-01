declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GITHUB_PRIVATE_KEY: string;
      GITHUB_INSTALLATION_ID: string;
      GITHUB_APP_ID: string;
      PINECONE_API_KEY: string;
      PINECONE_ENVIRONMENT: string;
      PINECONE_INDEX_NAME: string;
      GITLAB_TOKEN: string;
      GITHUB_SECRET: string;
      EXPLAIN_MAX_TOKENS: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
