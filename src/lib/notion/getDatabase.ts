import { Worker } from "bullmq";
import IORedis from "ioredis";
import { Client } from "@notionhq/client";
import { initializeQueue, removeJob } from "../queue/queue";
import pg, { QueryResult } from "pg";
import { Reference, createEmbedder } from "../embeddings";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

interface NotionPageWithTables extends PageObjectResponse {
  tables: string[];
}

// traverse all of the children of a notion block
// check each block's string content to see if it contains a snowflake table name conttained in the variable 'tableTable'

export const getPageList = async (block: any) => {
  const pages = [];
  if (block.results) {
    for (let i = 0; i < block.results.length; i++) {
      const page = block.results[i];
      if (page.object === "page") {
        // get the block
        pages.push({
          page: page.properties.Page.title[0].plain_text,
          id: page.id,
          tables: [],
        });
      }
    }
  }
  return pages;
};

// take a page, it's children, and a list of all of the tables that are mentioned on that page
// loop through the children of the page. if they have text content, generate embeddings from that text, and send it to pinecone as a reference
const generateEmbeddingsForPage = async (
  page: NotionPageWithTables,
  children: PageObjectResponse[]
) => {
  const embeddingArray = [] as Reference[];
  children.forEach((child: any) => {
    const type = child.type;
    const content = child[type];
    if (content.rich_text) {
      for (let i = 0; i < content.rich_text.length; i++) {
        const plainText = content.rich_text[i].plain_text;
        const embedding = {
          message: plainText,
          tables: page.tables,
          type: "notion",
          source: "notion",
        };
        embeddingArray.push(embedding);
      }
    }
  });
  const embedder = createEmbedder();
  const result = await embedder.generateEmbeddings(embeddingArray, "notion");
  return result;
};

export const getDatabase = async (databaseId: string) => {
  const redisURL = process.env.VALQUERYQUEUE_URL || "";
  const notion = new Client({
    auth: process.env.NOTION_SECRET,
  });

  // queue
  const rateLimitQueue = await initializeQueue("rate-limit");

  // worker
  const worker = new Worker(
    "rate-limit",
    async (job) => {
      const notion = new Client({
        auth: process.env.NOTION_SECRET,
      });
      // collect a flat array of all of the children of the page
      const children = await recursiveChildTraverser(
        job.data.page,
        job.data.children,
        notion
      );
      // check the children for tables
      const pageWithChildrenAndTables = await checkPageChildrenForTables(
        job.data.page,
        children,
        job.data.tableTable
      );
      // if there are tables, generate embeddings for the page
      if (pageWithChildrenAndTables.tables.length > 0) {
        await generateEmbeddingsForPage(pageWithChildrenAndTables, children);
      }
    },
    {
      connection: new IORedis(redisURL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        tls: {},
      }),
      limiter: {
        max: 1,
        duration: 1000,
      },
    }
  );

  worker.on("completed", async (job) => {
    console.log(`Job completed for ${job.id}`);
    await removeJob(job);
  });
  worker.on("failed", async (job, err) => {
    console.error(`${job?.id} has failed with ${err.message}`);
    await removeJob(job);
  });
  let result,
    tableTable: QueryResult,
    filteredTableTable: SnowflakeInventoryEntry[];
  const databaseContents = await notion.databases.query({
    database_id: databaseId || "32ae5a49c3f644c2baaa8fe1bfbca7949",
  });
  const { Pool } = pg;
  const sqlClient = new Pool({
    connectionString: process.env.POSTGRES_URL + "?sslmode=require",
  });

  try {
    tableTable = await sqlClient.query(`SELECT * FROM "SNOWFLAKE_INVENTORY"`);
    filteredTableTable = tableTable.rows.filter((row: any) => {
      return (
        row.database.toUpperCase() !== "SNOWFLAKE" &&
        row.schema.toUpperCase() !== "INFORMATION_SCHEMA"
      );
    });
  } catch (error) {
    console.error("fetching table db failed failed: ", error);
    result = error;
    return result;
  }
  // get all of the pages in the database
  const pageList = await getPageList(databaseContents);

  let children = [] as any[];
  // feed each of the pages into the queue
  pageList.forEach((page) => {
    rateLimitQueue.add("rate-limit", {
      page: page,
      children: children,
      client: notion,
      tableTable: filteredTableTable,
    });
  });

  return "we didn't fall over";
};

export const checkPageChildrenForTables = async (
  page: NotionPageWithTables,
  children: PageObjectResponse[],
  tableTable: SnowflakeInventoryEntry[]
) => {
  if (children?.length > 0) {
    children.forEach((child: any) => {
      const addedTables: string[] = [];
      const type = child.type;
      const content = child[type];
      if (content.rich_text) {
        for (let i = 0; i < content.rich_text.length; i++) {
          const currentText = content.rich_text[i];
          const hasCode = currentText.annotations.code;
          if (hasCode) {
            const text = currentText.plain_text;
            for (let j = 0; j < tableTable.length; j++) {
              const currentTable = tableTable[j];
              const kidsTable =
                currentTable.tablename &&
                typeof currentTable.tablename === "string"
                  ? currentTable.tablename.toLowerCase()
                  : null;
              const bigTable =
                currentTable.tablename &&
                typeof currentTable.tablename === "string"
                  ? currentTable.tablename.toUpperCase()
                  : null;
              if (
                bigTable &&
                kidsTable &&
                (text.includes(kidsTable) || text.includes(bigTable))
              ) {
                checkPageChildrenForTables;
                const fullTableName =
                  currentTable.database +
                  "." +
                  currentTable.schema.toLowerCase() +
                  "." +
                  currentTable.tablename.toLowerCase();
                if (!addedTables.includes(fullTableName)) {
                  page.tables.push(fullTableName);
                  addedTables.push(fullTableName);
                }
              }
            }
          }
        }
      }
    });
  }
  return page;
};

export const recursiveChildTraverser = async (
  page: PageObjectResponse,
  contentArray: PageObjectResponse[] = [],
  client: Client
) => {
  // if not a valid page, return array
  if (!page.id) return contentArray;
  let pageBlock: any;

  try {
    // get the page block
    pageBlock = await client.blocks.retrieve({
      block_id: page.id || "",
    });
  } catch (error) {
    console.log("🚀 ~ file: getDatabase.ts:191 ~ error:", error);
    return contentArray;
  }

  // if there's no page block, return array
  if (!pageBlock) return contentArray;

  // add the page block to the content array
  contentArray.push(pageBlock);

  // if the page block has children, get the children
  if (pageBlock?.has_children) {
    let children;

    try {
      children = await client.blocks.children.list({
        block_id: pageBlock.id,
      });
    } catch (error) {
      console.log("🚀 ~ file: getDatabase.ts:286 ~ error:", error);
      return contentArray;
    }

    // if the children have results, call recursiveChildTraverser on each child
    if (children?.results?.length > 0) {
      // Collect the results of each recursive call
      const childrenResults = await Promise.all(
        children.results.map((child: any) =>
          child.has_children
            ? recursiveChildTraverser(child, [], client)
            : child
        )
      );

      // Flatten the results array and add it to the content array
      const flattenedResults = childrenResults.flat();
      contentArray.push(...flattenedResults);
    }
    return contentArray;
  } else {
    return contentArray;
  }
};
