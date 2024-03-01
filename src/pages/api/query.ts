// @ts-nocheck

import OpenAI from "openai";
import { NextApiRequest, NextApiResponse } from "next";
import { queryVectors } from "../../lib/queryVectors";
import {
  AggregatedResult,
  referenceAggregator,
} from "../../lib/aggregators/aggregators";

import {
  createSnowflakeConnection,
  executeSnowflakeQuery,
} from "@/lib/snowflakeClient";
import { ChatCompletionMessageParam } from "openai/resources";

export const config = {
  maxDuration: 30,
};

interface FinalResults {
  messages: ChatCompletionMessageParam[];
  aggregatedResults: AggregatedResult[];
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const query = req.query.query as string;
  const topK = req?.query?.topK as string;
  const topKInt = parseInt(topK);

  let customerInfo: CustomerInfo | null = null;

  const references = await queryVectors(query, topKInt, customerInfo);
  // parse all of the object references and log them

  const aggregatedResults = referenceAggregator(references);
  // @ts-ignore
  let tableName = aggregatedResults[0].table;
  let tableNameParts = tableName.split(".");
  let database = tableNameParts[0];
  let schema = tableNameParts[1];
  let table = tableNameParts[2];
  const maxTokens = parseInt(process.env.EXPLAIN_MAX_TOKENS) || 256;

  // fetch the table associated with the result
  const snowflakeConnection = await createSnowflakeConnection();
  const referenceTable = await executeSnowflakeQuery(
    snowflakeConnection,
    `SELECT TOP 10 * FROM ${tableName}`
  );

  const stringifiedTable = JSON.stringify(referenceTable);

  // set up the llm
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `There is a table in a Snowflake data warehouse called ${table}. 
      It is located in the schema ${schema}, which is in the database ${database}. 
      These are the first 10 rows of it, in JSON format: ${stringifiedTable}. 
      Assume that you can have access to the rest of the rows if you need to, you do not need to ask for them.
      I am a data analyst who is trying to answer this question: "${query}".
      In addition to the table above, you have access to a tool that you can ask questions of.
      It has access to all of the coversations and other contextual data the user's team while working.
      It will take your quesitons and execute a vector search over the conversations and other contextual data and return the most relevant tables.
      You will be asked to return follow-up questions, which will be used with this tool. They should be analytics questions, not questions about the tool itself,
      or the snowflake database. You can ask as many follow-up questions as you need to, but you will be limited to ${maxTokens} tokens for each follow-up question.`,
    },
  ];

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const chatParams = {
    model: "gpt-3.5-turbo-1106",
    messages,
    temperature: 1,
    max_tokens: maxTokens,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  };

  messages.push({
    role: "user",
    content: `If you think that the tables from the system prompts are not the right tables to answer the question,
     or do not contain enough information to answer the question fully, formulate a follow-up question that you can ask your vector search tool
     that you think will return the correct table. DO NOT return a SQL query,
     the question must be plain English. If you think that the original table was enough to answer the question, just say "No follow-up question"
     Do not respond with anything other than a one-sentence question, or "No follow-up question".`,
  });

  const finalResults = await askFollowUpQuestion(
    messages,
    openai,
    customerInfo,
    aggregatedResults,
    snowflakeConnection
  );
  const finalMessages = finalResults.messages;
  finalMessages.push({
    role: "user",
    content: `Explain how I can use all of the tables you have information about to answer the following question: ${query}. Your response is limited to ${maxTokens} tokens.`,
  });
  // actual final prompt

  if (finalMessages) {
    chatParams.messages = finalMessages.map((message) => ({
      role: message.role || "",
      content: message.content || "",
    })) as ChatCompletionMessageParam[];
  }

  const finalResponse = await openai.chat.completions.create(chatParams);
  const finalResponseText = finalResponse?.choices[0]?.message?.content;

  // feed the table and the question to the llm, ask if it has any follow-up questions

  return references
    ? res.status(200).json({ finalResponseText, aggregatedResults })
    : res.status(500);
}

// recursively ask chatGPT if it has followup questions and use them to get more tables from Valquery until it has no more followup questions
const askFollowUpQuestion = async (
  messages: ChatCompletionMessageParam[],
  openai: OpenAI,
  customerInfo: CustomerInfo | null,
  aggregatedResults: AggregatedResult[],
  snowflakeConnection: Connection
): Promise<FinalResults> => {
  const chatParams = {
    model: "gpt-3.5-turbo-1106",
    messages,
    temperature: 1,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  };
  // ask the question
  const followUpResponse = await openai.chat.completions.create(chatParams);
  // get the response
  const followUpMessage = followUpResponse?.choices[0]?.message;
  // add the response to the chat array
  messages.push(followUpMessage);
  // if the response has no follow-up questions, return the aggregated results and the messages
  if (followUpMessage?.content?.includes("No follow-up question")) {
    return { messages, aggregatedResults };
  }
  // if not, ask Valquery the follow-up question
  const followUpQuestion = followUpMessage?.content;
  const followUpReferences = await queryVectors(
    followUpQuestion || "",
    100,
    customerInfo
  );
  // aggregate the results and add them to the result array
  const followUpAggregatedResults = referenceAggregator(followUpReferences, 3);

  for (let i = 0; i < followUpAggregatedResults.length; i++) {
    let includeTable = true;
    const result = followUpAggregatedResults[i];
    for (let j = 0; j < aggregatedResults.length; j++) {
      const existingResult = aggregatedResults[j];
      // @ts-ignore
      if (result.table === existingResult.table) {
        includeTable = false;
        // remove this entry from the followUpAggregatedResults
        followUpAggregatedResults.splice(i, 1);
        break;
      }
    }
    if (includeTable) {
      // @ts-ignore
      const followUpTableName = result.table;
      const splitTableName = followUpTableName.split(".");
      const database = splitTableName[0];
      const schema = splitTableName[1];
      const table = splitTableName[2];
      // get new table from Snowflake
      const followUpTable = await executeSnowflakeQuery(
        snowflakeConnection,
        `SELECT TOP 10 * FROM ${followUpTableName}`
      );
      if (followUpTable.length === 10) {
        messages.push({
          role: "user",
          content: `Now you also have access to a table called ${table}, in addition to all the tables you already have available.
     It is located in the schema ${schema}, which is in the database ${database}. These are the first 10 rows of it, in JSON format: ${JSON.stringify(
            followUpTable
          )}. 
    Assume that you can have access to the rest of the rows if you need to without having to ask for them.`,
        });
        // tell the LLM to use the new table
      } else {
        console.log("could not find table: " + followUpTableName);
        followUpAggregatedResults.splice(i, 1);
        includeTable = false;
      }
      if (includeTable) {
        aggregatedResults.push(result);
      }
    }
  }

  // recurse
  return askFollowUpQuestion(
    messages,
    openai,
    customerInfo,
    aggregatedResults,
    snowflakeConnection
  );
};

export default handler;
