import { SetStateAction, useState } from "react";
import Answer from "./Answer";
import { AggregatedResult } from "@/lib/aggregators/aggregators";

interface AnswerListProps {
  answers: AggregatedResult[] | null;
}
const AnswerList = (props: AnswerListProps) => {
  const answers = props.answers;
  const [activeAnswer, setActiveAnswer] = useState("");
  const [activeDiscussion, setActiveDiscussion] = useState("");

  const onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (e.currentTarget.id === activeAnswer) {
      setActiveAnswer("");
      return false;
    }
    setActiveAnswer((e.target as HTMLButtonElement).id);
  };

  const DiscussionSetter = (e: {
    currentTarget: { id: SetStateAction<string> };
  }) => {
    if (e.currentTarget.id === activeDiscussion) {
      setActiveDiscussion("");
      return false;
    }
    setActiveDiscussion(e.currentTarget.id);
  };

  return (
    <div className="w-full flex justify-center flex-col items-center mt-10">
      <h2 className="text-white w-4/5 text-2xl text-center border-white border-spacing border-b-2 answer">
        Results
      </h2>
      {answers?.map((answer: AggregatedResult) => {
        const id = answer.table;
        return (
          <section
            className="flex flex-col w-3/5 first-of-type:mt-10 mt-3 last:mb-24"
            key={id}
          >
            <Answer
              answer={answer}
              clickHandler={onClick}
              active={activeAnswer === id}
              discussionSetter={DiscussionSetter}
              activeDiscussion={activeDiscussion === id}
              id={id}
            />
          </section>
        );
      })}
    </div>
  );
};

export default AnswerList;
