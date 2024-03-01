import Image from "next/image";
import { ScoredPineconeRecord } from "@pinecone-database/pinecone";

interface IconBarProps {
  references: ScoredPineconeRecord[];
}

const IconBar = (props: IconBarProps) => {
  const references = props.references;
  const sourceList: Record<string, number> = {};

  // loop through references, counting how many there are from each source
  // then display the amount of each source
  references.forEach((reference) => {
    const source = reference?.metadata?.source;
    if (typeof source === "string") {
      if (!sourceList[source]) {
        sourceList[source] = 1;
      } else {
        sourceList[source] += 1;
      }
    }
  });
  return (
    <div className="flex w-full pb-2 justify-center">
      {sourceList["gitlab"] && (
        <div className="mx-2">
          <Image
            src={`/sourceIcons/gitlab.svg`}
            alt="Gitlab Icon"
            title="GitLab References"
            width={20}
            height={20}
            className="inline mr-2"
          />
          <sub className="text-blue">{sourceList["gitlab"]}</sub>
        </div>
      )}
      {sourceList["github"] && (
        <div className="mx-2">
          <Image
            src={`/sourceIcons/github.svg`}
            alt="GitHub Icon"
            title={"GitHub References"}
            width={20}
            height={20}
            className="inline mr-2"
          />
          <sub className="text-blue">{sourceList["github"]}</sub>
        </div>
      )}
      {sourceList["notion"] && (
        <div className="mx-2">
          <Image
            src={`/sourceIcons/Notion_App_Logo.png`}
            alt="Notion Icon"
            title={"Notion References"}
            width={20}
            height={20}
            className="inline mr-2"
          />
          <sub className="text-blue">{sourceList["notion"]}</sub>
        </div>
      )}
    </div>
  );
};

export default IconBar;
