import { NextApiRequest, NextApiResponse } from "next";
import {
  createSnowflakeConnection,
  executeSnowflakeQuery,
  fetchSnowflakeData,
} from "@/lib/snowflakeClient";
import pg from "pg";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const format = require("pg-format");
  const table = req.query.table as string;
  const type = req.query.type;
  const query = req.query.query as string;
  const schema = req.query.schema as string;
  const database = req.query.database as string;
  const client = "SNOWFLAKE_INVENTORY";
  const snowflakeClient = await createSnowflakeConnection();
  const { Pool } = pg;

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL + "?sslmode=require",
  });

  switch (type) {
    // fetch all the tables in the snowflake repo and put them in a postgres database for quick lookup
    case "fetchAll":
      const snowflakeData = await fetchSnowflakeData(snowflakeClient);
      try {
        const resultArray: any = [];
        const createTableQuery = format(
          "CREATE TABLE IF NOT EXISTS  %I ( Database varchar(255), Schema varchar(255), TableName varchar(255), PRIMARY KEY(Database, Schema, TableName));",
          client
        );
        await pool.query(createTableQuery);

        snowflakeData.forEach(async (element: any) => {
          const queryString = format(
            "INSERT INTO %I(Database, Schema, TableName) VALUES (%L, %L, %L) ON CONFLICT DO NOTHING;",
            client,
            element.databaseName,
            element.schemaName,
            element.tableName
          );
          const result = await pool.query(queryString);
          resultArray.push(result);
        });

        return res.status(200).json({ resultArray });
      } catch (error) {
        return res.status(500).json({ error });
      }

    // fetch 10 sample rows from table
    case "fetchTable":
      try {
        let queryResult;
        let result: { [key: string]: string[] } = {};
        const fullTableName = `${database}.${schema}.${table}`;
        const initialQuery = `SELECT TOP 10 * FROM ${fullTableName}`;
        queryResult = await executeSnowflakeQuery(
          snowflakeClient,
          initialQuery
        );
        if (queryResult.message)
          return res.status(404).json("table not found: " + fullTableName);
        if (!queryResult.length)
          return res.status(404).json("table empty: " + fullTableName);
        result = queryResult;
        return res.status(200).json({ result });
      } catch (error) {
        return res.status(500).json({ error });
      }
    default:
      try {
        const queryResult = await executeSnowflakeQuery(
          snowflakeClient,
          query || `SELECT TOP 10 * FROM ${table}`
        );
        return res.status(200).json({ queryResult });
      } catch (error) {
        return res.status(500).json({ error });
      }
  }
}
