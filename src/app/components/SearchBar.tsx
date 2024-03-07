"use client";

import { useState, useRef, useEffect, MouseEventHandler } from "react";
import AnswerList from "./AnswerList";
import TextInput from "./TextInput";
import clickHandler from "@/lib/SubmitForm";
import { Tutorial } from "./Tutorial";
import { Tooltip } from "./Tooltip";
import { AggregatedResult } from "@/lib/aggregators/aggregators";

interface FinalResponse {
  finalResponseText: string;
  aggregatedResults: AggregatedResult[];
}

const SearchBar = ({ exampleQuestions }: SearchBarProps) => {
  const [answers, setAnswers] = useState<AggregatedResult[] | null>(null);
  const [finalResponse, setFinalResponse] = useState<FinalResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchBarActive, setIsSearchBarActive] = useState(false);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [question, setQuestion] = useState("");
  useEffect(() => {
    if (finalResponse?.finalResponseText) {
      setAnswers(finalResponse?.aggregatedResults || null);
      setExplanation(finalResponse?.finalResponseText?.toString() || "");
    }
  }, [finalResponse]);

  const textInputRef = useRef<HTMLInputElement>(null);

  const dropdown = useRef<HTMLElement>(null);

  useEffect(() => {
    // only add the event listener when the dropdown is opened
    if (!isSearchBarActive) return;
    function handleClick(event: Event) {
      if (
        dropdown.current &&
        !dropdown.current.contains(event.target as Node)
      ) {
        setIsSearchBarActive(false);
      }
    }
    window.addEventListener("click", handleClick);
    // clean up
    return () => window.removeEventListener("click", handleClick);
  }, [isSearchBarActive]);
  const activeSearchbar: MouseEventHandler<HTMLLabelElement> = (event) => {
    event.stopPropagation();
    setIsSearchBarActive(true);
  };

  const searchSubmitter = clickHandler(
    `api/query?topK=100&query=`,
    textInputRef,
    "GET",
    setFinalResponse,
    setIsLoading,
    setExplanation,
    setShowSearchBar,
    setAnswers
  );
  return (
    <div className="h-full w-full flex justify-center items-center flex-col text-blue ">
      {isTutorialActive && (
        <Tutorial
          tutorialHandler={setIsTutorialActive}
          tutorialActive={isTutorialActive}
        />
      )}{" "}
      {showSearchBar ? (
        <section className="bg-slate rounded h-60 2xl:h-80 w-full md:px-20 answer">
          <div className="bg-logo-tile bg-repeat-round box-border w-full h-full flex items-center justify-center flex-col">
            <form
              onSubmit={searchSubmitter}
              className="block justify-center w-full md:w-8/12 flex-col"
              action={""}
            >
              <div className="flex w-full justify-between">
                <h2 className="text-2xl pb-10 text-center md:text-left">
                  Find What You Need
                </h2>
                <button
                  onClick={() => setIsTutorialActive(true)}
                  type="button"
                  className={`text-white border-black border-2 bg-blue rounded invisible xl:visible lg:w-3/12 h-16 md:h-12 ${
                    isTutorialActive ? "invisible" : ""
                  }`}
                >
                  New to Valquery?
                </button>
              </div>
              <div className="w-full flex flex-col md:flex-row">
                <TextInput
                  placeholder="Enter Your Query"
                  stateToggler={activeSearchbar}
                  required={true}
                  ref={textInputRef}
                  questionSetter={setQuestion}
                />
                <button
                  className="bg-blue text-white rounded border-black border-2 lg:w-2/12 mt-7 h-16 md:h-auto md:mt-0"
                  type="submit"
                  disabled={isLoading}
                >
                  Assemble
                </button>
              </div>
              <div
                className={`inline-flex absolute  pl-24 ${
                  isSearchBarActive ? "" : "invisible"
                } bg-white items-start md:w-[49.35%] z-50 border-t`}
                ref={dropdown as React.RefObject<HTMLDivElement>}
              >
                <div className={`flex flex-col items-start text-black w-11/12`}>
                  <span className="text-blue">Search Suggestions</span>
                  {exampleQuestions &&
                    exampleQuestions.map((question: string) => (
                      <button
                        key={question}
                        className="text-left"
                        onClick={() => {
                          if (textInputRef.current)
                            textInputRef.current.value = question;
                          setQuestion(question);
                          setIsSearchBarActive(false);
                        }}
                      >
                        {question}
                      </button>
                    ))}
                </div>
              </div>
            </form>
          </div>
        </section>
      ) : (
        !isLoading && (
          <button
            className="bg-white text-blue rounded-sm  p-2 w-3/12 mt-10 answer border-black border-2"
            onClick={() => setShowSearchBar(true)}
          >
            <span>Ask Another Question</span>
          </button>
        )
      )}
      <section className="w-full flex justify-center flex-col items-center bg-blue">
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-3 h-20 w-20 text-white mt-20"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {explanation && (
          <Tooltip
            text={explanation}
            width="50vw"
            marginTop="mt-10"
            textAlign="text-center"
          />
        )}

        {answers && <AnswerList answers={answers} question={question} />}
      </section>
    </div>
  );
};

export default SearchBar;
