import { Connection, SnowflakeError, Statement } from "snowflake-sdk";

export const createSnowflakeConnection = async () => {
  let account, username, password;
  let snowflakeClient = require("snowflake-sdk");
  let connection: Connection;
  const params = {
    account: account || process.env.SNOWFLAKE_ACCOUNT,
    username: username || process.env.SNOWFLAKE_USERNAME,
    password: password || process.env.SNOWFLAKE_PASSWORD,
  };
  connection = snowflakeClient.createConnection(params);

  await connection.connectAsync(
    (err: SnowflakeError | undefined, conn: Connection) => {
      if (err) {
        console.error("Unable to connect: " + err.message);
        return err;
      } else {
        console.log("Successfully connected to Snowflake: " + conn.getId());
      }
    }
  );

  return connection;
};

export const executeSnowflakeQuery = async (
  connection: Connection,
  query: string
) => {
  if (!connection) {
    console.log("No connection found");
    return;
  }
  let resolve: (arg0: any[] | SnowflakeError | undefined) => void;
  let toReturn = new Promise((r) => (resolve = r));
  connection.execute({
    sqlText: query,
    parameters: { MULTI_STATEMENT_COUNT: 0 },
    complete: (
      err: SnowflakeError | undefined,
      stmt: Statement,
      rows: any[] | undefined
    ) => {
      if (err) {
        console.error(
          "Failed to execute statement due to the following error: " +
            err.message
        );
        return resolve(err);
      } else {
        console.log("Successfully executed statement: " + stmt.getSqlText());
        return resolve(rows);
      }
    },
  });
  return toReturn as Promise<any>;
};

// fucntion that will fetch all database names from a snowflake account, loop through them and fetch all the schema and table names for each database
export const fetchSnowflakeData = async (connection: Connection) => {
  const databaseQuery = `SHOW DATABASES`;
  const databaseResult = await executeSnowflakeQuery(connection, databaseQuery);
  const databaseNames = databaseResult.map((row: any) => row.name);
  let DBName = "";
  let schemaAndTableQuery = `SELECT * FROM ${DBName}.INFORMATION_SCHEMA.TABLES`;
  const databaseSchemaTableRows: any = [];
  for (let i = 0; i < databaseNames.length; i++) {
    DBName = databaseNames[i];
    schemaAndTableQuery = `SELECT * FROM ${DBName}.INFORMATION_SCHEMA.TABLES`;
    const schemaResult = await executeSnowflakeQuery(
      connection,
      schemaAndTableQuery
    );
    schemaResult.forEach(
      (element: {
        TABLE_CATALOG: string;
        TABLE_SCHEMA: string;
        TABLE_NAME: string;
      }) => {
        databaseSchemaTableRows.push({
          databaseName: element.TABLE_CATALOG,
          schemaName: element.TABLE_SCHEMA,
          tableName: element.TABLE_NAME,
        });
      }
    );
  }
  return databaseSchemaTableRows;
};

// function that will fetch one table and return the results
export const fetchSnowflakeTable = async (
  connection: Connection,
  database: string,
  schema: string,
  table: string
) => {
  if (!connection) {
  }
  const queryString = `SELECT * FROM ${database}.${schema}.${table} LIMIT 10;`;
  const result = await executeSnowflakeQuery(connection, queryString);
  return result;
};
