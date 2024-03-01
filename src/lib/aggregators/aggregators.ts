// @ts-nocheck

import { ScoredPineconeRecord } from "@pinecone-database/pinecone";

export interface AggregatedResult {
  table: string;
  count: number;
  references: ScoredPineconeRecord[];
}

// takes in a large number of references, counts the number of references to each result attached to them and returns a list of results with a count of the number and types of references associated with each

export const referenceAggregator = (
  references: ScoredPineconeRecord[],
  resultCount = 1
) => {
  const results = {} as AggregatedResults;
  references.forEach((element) => {
    const tables = element?.metadata?.tables;
    const addedArray: Array<string> = [];
    if (tables) {
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        if (table.includes("deprecated")) continue;
        if (results[table] && !addedArray.includes(table)) {
          results[table].count += 1;
          results[table].references.push(element);
          addedArray.push(table);
        } else {
          results[table] = {
            count: 1,
            references: [element],
          };
        }
      }
    }
  });

  let sortedResults = Object.entries(results)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, resultCount);

  sortedResults = sortedResults.map((result) => {
    return {
      table: result[0],
      count: result[1].count,
      references: result[1].references,
    } as AggregatedResult;
  }) as AggregatedResult[];

  const resultsToLog = sortedResults.map((result) => {
    return {
      table: result.table,
      count: result.count,
      references: result.references.map((reference) => {
        const metadata = reference.metadata;
        return JSON.stringify({
          id: reference.id,
          message:
            metadata?.comment || metadata?.commit || metadata?.textContent,
          source: metadata?.source,
          tables: metadata?.tables,
          type: metadata?.type,
        });
      }),
    };
  });
  console.log(
    "🚀 ~ file: aggregators.js:48 ~ resultsToLog ~ resultsToLog:",
    resultsToLog
  );

  return sortedResults;
};
