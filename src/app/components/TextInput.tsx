import Image from "next/image";

type TextInputProps = {
  placeholder?: string;
  stateToggler?: () => void;
  required?: boolean;
};

const TextInput = ({
  placeholder = "",
  stateToggler,
  required = false,
}: TextInputProps) => {
  return (
    <label
      htmlFor="searchBar"
      className="flex bg-white items-center content-center md:w-10/12"
      onClick={stateToggler}
    >
      <Image
        src="/spear_logo.svg"
        height={100}
        width={100}
        alt={"logo"}
        className=""
      />
      <input
        id="searchBar"
        type="text"
        className="w-11/12 text-black rounded border-none"
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
};

export default TextInput;
