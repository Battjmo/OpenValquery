// given a database name in the format env_var('SNOWFLAKE_PROD_DATABASE'), extract the name of the database and return it
export const databaseNameExtractor = (envVarName: string): string => {
  const regex = /env_var\('(.*)'\)/;
  const match = regex.exec(envVarName);
  if (match === null) {
    throw new Error(
      `Could not extract database name from ${envVarName}. Please check the format of the database name.`
    );
  }
  return match[1];
};
