import Image from "next/image";
import { forwardRef, LegacyRef, MouseEventHandler } from "react";

type TextInputProps = {
  placeholder?: string;
  stateToggler?: MouseEventHandler<HTMLLabelElement>;
  required?: boolean;
  questionSetter?: Function;
};

const TextInput = forwardRef(
  (
    {
      placeholder = "",
      stateToggler,
      required = false,
      questionSetter,
    }: TextInputProps,
    ref: LegacyRef<HTMLInputElement> | undefined
  ) => {
    return (
      <label
        htmlFor="searchBar"
        className="flex bg-white items-center content-center md:w-10/12"
        onClick={stateToggler}
      >
        <Image src="/spear_logo.svg" height={100} width={100} alt={"logo"} />
        <input
          id="searchBar"
          type="text"
          className="w-11/12 text-black rounded border-none"
          placeholder={placeholder}
          required={required}
          onChange={(e) => {
            if (questionSetter) questionSetter(e.target.value);
          }}
          ref={ref as LegacyRef<HTMLInputElement>}
        />
      </label>
    );
  }
);

TextInput.displayName = "TextInput";

export default TextInput;
