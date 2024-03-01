// button that will use the user's question and the answer's table to prompt the LLM to explain why the table is a good answer to the user's question
import { Tooltip } from "./Tooltip";

interface DiscussButtonProps {
  table: string;
  fullTableName: string;
  discussionSetter: (e: React.MouseEvent<HTMLButtonElement>) => void;
  activeDiscussion: boolean;
  text: string;
}
export const DiscussButton = (props: DiscussButtonProps) => {
  const { fullTableName, activeDiscussion, discussionSetter, text } = props;
  const tableName = fullTableName.split(".")[2];

  return (
    <section>
      <div className="flex flex-col justify-center content-center">
        <button
          className="bg-blue rounded-sm text-white p-2 w-20 border-black border-2"
          onClick={discussionSetter}
          id={fullTableName}
        >
          <span>{activeDiscussion ? "Close" : "Explain"}</span>
        </button>
      </div>
      {activeDiscussion && (
        <Tooltip
          text={text}
          scroller={true}
          textsize="text-xs"
          top="0"
          left="left-[5rem]"
          width="fit-content"
          minWidth="15rem"
          pos="absolute"
          bottom="bottom-0"
          tableName={tableName}
        />
      )}
    </section>
  );
};
