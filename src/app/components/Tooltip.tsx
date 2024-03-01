// a typescript component that renders a tooltip with the the text from the props

interface ToolTipProps {
  width?: string;
  height?: string;
  prevButton?: JSX.Element | null;
  nextButton?: JSX.Element | null;
  currentTooltip?: number;
  currentTooltipIndex?: number;
  text?: string;
  textsize?: string;
  scroller?: boolean;
  top?: string;
  left?: string;
  bottom?: string;
  pos?: string;
  closeButton?: JSX.Element | null;
  minWidth?: string;
  tableName?: string;
  marginTop?: string;
  textAlign?: string;
}
export const Tooltip = (props: ToolTipProps) => {
  let text = "",
    top = "",
    left = "",
    bottom = "",
    width = "",
    minWidth = "";
  const { pos, textAlign } = props || "";

  const tooltipTexts = [
    {
      text: "Click on the search bar to start searching for data. We've provided some suggestions, but feel free to ask anything.",
      left: "left-[35rem] 2xl:left-[55rem]",
      top: "top-[3rem] 2xl:top-[5rem]",
      width: "25vw",
    },
    {
      text: "Valquery leverages your development artifacts (tickets, PR comments, the code itself) to find relevant content. See why these tables are getting surfaced at a glance by checking how many references come from which sources.",
      left: "left-[1rem] 2xl:left-[16rem]",
      top: "top-[29rem] 2xl:top-[31rem]",
    },
    {
      text: "Explore sample data safely; see real sample content only when you have access to the underlying table.",
      left: "left-[5rem] 2xl:left-[6rem]",
      top: "top-[16rem] 2xl:top-[16rem]",
      width: "22vw",
    },
    {
      text: "Valquery can generate a text explanation of how the surfaced content is relevant to your prompt, and what to do next to accomplish your described objective or answer your research question. This is also an opportunity to surface company or team policy when relevant to your project.",
      left: "left-[61rem] 2xl:left-[109rem]",
      top: "top-[14rem] 2xl:top-[12rem]",
      width: "384px",
    },
  ];
  if (tooltipTexts && typeof props.currentTooltipIndex === "number") {
    text = tooltipTexts[props.currentTooltipIndex].text;
    top = tooltipTexts[props.currentTooltipIndex].top;
    left = tooltipTexts[props.currentTooltipIndex].left;
    width = tooltipTexts[props.currentTooltipIndex].width || "";
  } else {
    text = props.text || "";
    left = props.left || "";
    bottom = props.bottom || "";
    width = props.width || "";
    minWidth = props.minWidth || "";
  }

  const { nextButton, prevButton } = props;
  const buttonsEnabled = prevButton || nextButton;
  const currentTooltipIndex = props.currentTooltipIndex || 0;

  return (
    <div className="relative group">
      <div
        className={`${pos} flex flex-col z-40 bg-white text-black border-black border-2 border-dashed p-3 answer ${left} ${top} ${bottom} ${
          props.textsize
        } rounded-md w-[15rem] ${props.marginTop || ""} ${textAlign} ${
          text && props.scroller
            ? "max-h-52 overflow-y-auto overflow-x-hidden"
            : ""
        }`}
        style={{ width, minWidth }}
      >
        {props.closeButton}
        <span>
          {text ? (
            text
          ) : (
            <div>
              <span className="invisible">{props.tableName || ""}</span>
              <svg
                className="animate-spin h-20 w-20 text-black mx-auto my-0"
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
              <span className="invisible">{props.tableName || ""}</span>
            </div>
          )}
        </span>
        {buttonsEnabled && (
          <div className="flex justify-around py-4">
            {prevButton && (
              <div className={currentTooltipIndex > 0 ? "" : "invisible"}>
                {prevButton}
              </div>
            )}
            {nextButton && (
              <div
                className={`${
                  currentTooltipIndex < tooltipTexts.length - 1
                    ? ""
                    : "invisible"
                }`}
              >
                {nextButton}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
