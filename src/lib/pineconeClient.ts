import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient: Pinecone | null = null;

// let pineconeClient: PineconeClient | null = null;
export const getPineconeClient = async (
  customerInfo: CustomerInfo | null
): Promise<Pinecone> => {
  if (pineconeClient) {
    return pineconeClient;
  } else {
    const pineconeParams = customerInfo
      ? {
          apiKey: customerInfo.pinecone_api_key,
          environment: customerInfo.pinecone_environment,
        }
      : {
          apiKey: process.env.PINECONE_API_KEY || "",
        };
    pineconeClient = new Pinecone(pineconeParams);
  }
  return pineconeClient;
};
