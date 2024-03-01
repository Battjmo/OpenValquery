import OpenAI from "openai";
import { NextApiRequest, NextApiResponse } from "next";
import { queryVectors } from "@/lib/queryVectors";
import { referenceAggregator } from "@/lib/aggregators/aggregators";

export const config = {
  maxDuration: 30,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const method = req.method;
  const tableName = req.query.tableName as string;
  const schema = req.query.schema as string;
  const question = req.query.question as string;
  const table = req.query.table as string;
  const database = req.query.database as string;
  const maxTokens = parseInt(process.env.EXPLAIN_MAX_TOKENS) || 256;
  const bodyMessages = req.body ? await JSON.parse(req.body).messages : null;

  // if messages are not included in the request body, initialize them with the basic system message
  const messages = bodyMessages || [
    {
      role: "system",
      content: `There is a table in a Snowflake data warehouse called ${tableName}. It is located in the schema ${schema}, which is in the database ${database}. These are the first 10 rows of it, in JSON format: ${table} Explain how an analyst can use the information that you have about that table to answer the following question to answer the following question: ${question}. Assume that you can have access to the rest of the rows if you need to. Your response should not exceed ${maxTokens} tokens.`,
    },
  ];

  if (bodyMessages) {
    messages.push({
      role: "user",
      content: `If you think that the table from the system prompt is not the right table to answer the question, or does not contain enough information to answer the question fully, formulate a follow-up question that you would ask to get the information that you need and return that question with no explanatory text. If you do not think a follow-up question is necessary, just say "no follow-up question".`,
    });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
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

    const response = await openai.chat.completions.create(chatParams);
    if (method === "POST" && response?.choices[0]?.message?.content) {
      const followUpMessage = response?.choices[0]?.message;
      if (!followUpMessage.content)
        return res.status(400).json({ error: "Invalid Response" });
      if (followUpMessage.content === "No follow-up question") {
        return res.status(200).json({ response, messages });
      }
      messages.push(followUpMessage);
      const references = await queryVectors(followUpMessage.content, 2, null);

      // parse all of the object references and log them
      const aggregatedResults = referenceAggregator(references);
      return res.status(200).json({ response, messages, aggregatedResults });
    }

    return res.status(200).json({ response, messages });
  } catch (error) {
    return res.status(500).json({ error });
  }
}
