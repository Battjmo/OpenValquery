import { NextApiRequest, NextApiResponse } from "next";

import { getDatabase } from "@/lib/notion/getDatabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.query.type) {
    case "database":
      const database = await getDatabase(req?.query?.blockId as string);
      return res.status(200).json(database);
    default:
      return res.status(200).json({ message: "No type specified" });
  }
}
