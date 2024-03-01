import { createEmbedder } from "./embeddings";
import { getPineconeClient } from "./pineconeClient";

export const queryVectors = async (
  query: string,
  topK = 2,
  customerInfo: CustomerInfo | null
) => {
  const pineconeClient = await getPineconeClient(customerInfo);

  // Insert the embeddings into the index
  const index = pineconeClient.Index(
    customerInfo?.index_name || process.env.PINECONE_INDEX_NAME
  );
  const embedder = createEmbedder();
  // Embed the query
  const queryEmbedding = await embedder.embedQuery(query);

  // Query the index
  const results = await index.query({
    vector: queryEmbedding.values,
    topK,
    includeMetadata: true,
    includeValues: false,
  });

  const result = results?.matches || [];
  return result;
};
