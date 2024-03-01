import { Index, ScoredPineconeRecord } from "@pinecone-database/pinecone";
import { Pipeline } from "@xenova/transformers";
import { v4 as uuidv4 } from "uuid";
import { sliceIntoChunks } from "./utils";
import { getPineconeClient } from "./pineconeClient";
import { RecordMetadata } from "@pinecone-database/pinecone";

export interface Reference extends Object {
  type?: string;
  message: string;
  tables: string[];
  source?: string;
  metadata?: RecordMetadata;
  html_url?: string;
  sha?: string;
  author?: {
    name: string;
    email: string;
    date: string;
  };
}

export interface ProcessedGitCommit extends Reference {
  author: {
    name: string;
    email: string;
    date: string;
  };
  html_url: string;
  id: string;
  sha: string;
}
export interface EmbedderInterface {
  init(): Promise<void>;
  embedCommit(commit: Reference): Promise<ScoredPineconeRecord>;
  embedSQLComment(comment: Reference): Promise<ScoredPineconeRecord>;
  embedQuery(query: string): Promise<ScoredPineconeRecord>;
  embedDocument(reference: Reference): Promise<ScoredPineconeRecord>;
  generateEmbeddings(input: Reference[], type: string): Promise<unknown>;
  embedBatch(
    references: Reference[],
    batchSize: number,
    type: string,
    onDoneBatch: (embeddings: ScoredPineconeRecord<RecordMetadata>[]) => void
  ): Promise<void | string>; // Add the missing type for the Promise
}
export function createEmbedder(): EmbedderInterface {
  let pipe: Pipeline | null = null;

  async function init(): Promise<void> {
    const { pipeline } = await import("@xenova/transformers");
    pipe = await pipeline("embeddings", "Xenova/all-MiniLM-L6-v2");
  }

  async function embedCommit(commit: Reference): Promise<ScoredPineconeRecord> {
    let name = "",
      email = "",
      date = "",
      html_url = commit.html_url || "";
    const commitText = commit.message;
    const tables = commit.tables || [];
    const source = commit.source || "";
    if (commit.author) {
      name = commit.author.name;
      email = commit.author.email;
      date = commit.author.date;
    }
    const result = pipe && (await pipe(commitText));
    return {
      id: uuidv4(),
      metadata: {
        commit: commitText,
        name,
        email,
        date,
        html_url,
        tables,
        type: "commit",
        source,
      },
      values: Array.from(result.data),
    };
  }

  async function embedSQLComment(
    comment: Reference
  ): Promise<ScoredPineconeRecord> {
    const commentText = comment.message || "";
    const tables = comment.tables || [];
    const source = comment.source || "";
    const result = pipe && (await pipe(commentText));
    return {
      id: uuidv4(),
      metadata: {
        comment: commentText,
        tables,
        type: "sqlComment",
        source: source,
      },
      values: Array.from(result.data),
    };
  }

  async function embedQuery(query: string): Promise<ScoredPineconeRecord> {
    await init();
    const result = pipe && (await pipe(query));
    return {
      id: uuidv4(),
      metadata: {
        query,
      },
      values: Array.from(result.data),
    };
  }

  async function embedDocument(
    reference: Reference
  ): Promise<ScoredPineconeRecord> {
    const result = pipe && (await pipe(reference.message));
    return {
      id: uuidv4(),
      metadata: {
        tables: reference.tables,
        type: "notion",
        source: "notion",
        message: reference.message,
      },
      values: Array.from(result.data),
    };
  }

  async function embedBatch(
    references: Reference[],
    batchSize: number,
    type: string = "",
    onDoneBatch: (embeddings: ScoredPineconeRecord<RecordMetadata>[]) => void
  ): Promise<void | string> {
    const batches = sliceIntoChunks<Reference>(references, batchSize);
    let processor: Function;
    switch (type) {
      case "commit":
        processor = (commit: Reference) => embedCommit(commit);
        break;
      case "sql_comment":
        processor = (comment: Reference) => embedSQLComment(comment);
        break;
      case "notion":
        processor = (reference: Reference) => embedDocument(reference);
        break;
      default:
        return "Invalid type";
    }
    for (const batch of batches) {
      const embeddings = await Promise.all(
        batch.map((reference) => processor(reference))
      );
      onDoneBatch(embeddings);
    }
  }

  async function generateEmbeddings(input: Array<Reference>, type: string) {
    const indexName = process.env.PINECONE_INDEX_NAME;
    let index: Index | null = null;
    const pineconeClient = await getPineconeClient(null);
    const indexList = await pineconeClient.listIndexes();
    if (indexList?.indexes?.length) {
      for (let i = 0; i < indexList?.indexes?.length; i++) {
        if (indexList.indexes[i].name === indexName) {
          index = pineconeClient.Index(indexName);
          break;
        }
      }
    }
    if (!index) {
      try {
        await pineconeClient.createIndex({
          name: indexName,
          dimension: 384,
          spec: {
            serverless: {
              cloud: "aws",
              region: "us-west-2",
            },
          },
        });
        index = index ? index : pineconeClient.Index(indexName);
      } catch (error) {
        console.log(error);
        return error;
      }
    }

    await init();

    try {
      await embedBatch(input, 1, type, async (embeddings) => {
        try {
          await index?.upsert(embeddings);
        } catch (error) {
          console.error(
            "🚀 ~ file: embeddings.ts:110 ~ Embedder ~ awaitembedder.embedBatch ~ error:",
            error
          );
        }
      });
      return `Inserted ${input.length} documents into index ${indexName}`;
    } catch (error) {
      console.error(
        "🚀 ~ file: embeddings.ts:116 ~ Embedder ~ generateEmbeddings= ~ error:",
        error
      );
      return error;
    }
  }

  return {
    init,
    embedCommit,
    embedSQLComment,
    embedQuery,
    embedDocument,
    embedBatch,
    generateEmbeddings,
  };
}
