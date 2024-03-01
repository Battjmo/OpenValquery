import { databaseNameExtractor } from "./databaseNameExtractor";

describe("databaseNameExtractor", () => {
  it("should extract the database name an env var statement", () => {
    const sqlQuery = "env_var('SNOWFLAKE_PROD_DATABASE')";
    const databaseName = databaseNameExtractor(sqlQuery);
    expect(databaseName).toBe("SNOWFLAKE_PROD_DATABASE");
  });
});
