interface GithubDirectoryResponse {
  name: string;
  type: string;
}

interface ResponseObject extends Object {
  author: {
    name: string;
    email: string;
    date: string;
  };
  message: string;
  html_url: string;
  tables?: string[];
  source?: string;
}

interface SQLComment extends Reference {}

interface GitLabCommitsAPIResponse extends Object {
  data: ProcessedGitCommit[];
}

interface GitLabCommitsAPIResponse extends Object {
  data: ProcessedGitCommit[];
}

interface SourceList {
  source: number;
}

interface SnowflakeTableResultEntry {
  COLUMN_NAME: string;
  DATA_TYPE: string;
}

interface SearchBarProps {
  exampleQuestions: string[];
}

interface DBAndSchema {
  database: string;
  schema: string;
}

type Column = {
  COLUMN_NAME: string;
  DATA_TYPE: string;
};

interface ToolTipText {
  text: string;
  left: string;
  top: string;
  width?: string;
}

interface ToolTipTexts {
  toolTipTexts: ToolTipText[];
}
interface ValqueryUser {
  name: string;
  email: string;
  id: string;
  isCredentialsUser?: boolean;
  valqueryUser?: boolean;
}

interface SnowflakeInventoryEntry {
  database: string;
  schema: string;
  tablename: string;
}

interface CustomerInfo {
  index_name: string;
  pinecone_api_key: string;
  pinecone_environment: string;
  snowflake_account: string;
  snowflake_username: string;
  snowflake_password: string;
}
