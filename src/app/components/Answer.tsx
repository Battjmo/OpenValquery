import IconBar from "./IconBar";
import Table from "./Table";
import useSWR from "swr";
import { tableFetcher } from "@/lib/tableFetcher";
import { DiscussButton } from "./DiscussButton";
import Image from "next/image";
import { answerFetcher } from "@/lib/answerFetcher";
import { ScoredPineconeRecord } from "@pinecone-database/pinecone";

interface AnswerProps {
  answer: Answer;
  clickHandler: (e: React.MouseEvent<HTMLButtonElement>) => void;
  id: string;
  active: boolean;
  activeDiscussion: boolean;
  discussionSetter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  question: string;
}

export interface Answer {
  metadata?: any;
  id?: string;
  score?: number;
  references: ScoredPineconeRecord[];
  table: string;
}

const Answer = (props: AnswerProps) => {
  const answer: Answer = props.answer;
  const clickHandler = props.clickHandler;
  const activeDiscussion = props.activeDiscussion;
  const discussionSetter = props.discussionSetter;
  const question = props.question;
  const key = props.id;
  const active = props.active;
  const table = answer?.table as string;
  const rotation = active ? " rotate-180" : "";
  const schema = table.split(".")[1];
  const tableName = table.split(".")[2];
  const database = table.split(".")[0];
  const { data, isLoading } = useSWR(
    `/api/snowflake?type=fetchTable&table=${tableName}&schema=${schema}&database=${database}`,
    tableFetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const { data: initialAnswer } = useSWR(
    activeDiscussion
      ? `/api/DiscussButton?tableName=${tableName}&schema=${schema}&database=${database}&table=${JSON.stringify(
          data?.result
        )}&question=${question || ""}`
      : null,
    answerFetcher,
    {
      revalidateOnFocus: false,
    }
  );
  const messages = initialAnswer?.messages || [];

  const text = initialAnswer?.response?.choices[0].message.content || "";

  // add initial response to the message history
  if (initialAnswer?.messages?.length > 0) {
    if (text) {
      messages.push({
        role: "assistant",
        content: text,
      });
    }
  }

  return (
    <section
      className={`flex bg-white text-blue rounded answer border-black border-2`}
    >
      <button
        className={
          "bg-[url('/caret-down.svg')] w-6 h-6 bg-center block bg-no-repeat mt-4" +
          rotation
        }
        onClick={clickHandler}
        id={key}
        data-table={table}
        title={`${active ? "Close sample data" : "Hide sample data"}`}
      ></button>
      <div className="flex flex-col w-full pr-6">
        {table && (
          <div className="flex justify-between pt-2 items-center">
            <div>
              <p>DATABASE: {database}</p>
              <p> SCHEMA: {schema}</p>
              <p>TABLE: {tableName}</p>
            </div>
            <button className="bg-blue rounded-md text-white p-2 hidden">
              References
            </button>
            {isLoading && (
              <Image
                src="/flatLoading.gif"
                width={50}
                height={50}
                alt="loading"
                className="mr-4"
              />
            )}
            {data && discussionSetter && (
              <DiscussButton
                fullTableName={table}
                discussionSetter={discussionSetter || null}
                table={data.result}
                activeDiscussion={props.activeDiscussion}
                text={text || ""}
              />
            )}
          </div>
        )}
        <div className="flex-col items-center justify-center">
          <h4 className="w-full text-center border-b-2 border-blue mb-1 border-dotted">
            References
          </h4>
          <IconBar references={answer.references} />
        </div>
        {data && <Table active={active} content={data.result} />}
      </div>
    </section>
  );
};

export default Answer;
