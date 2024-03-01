"use client";

import TextInput from "@/app/components/TextInput";
import clickHandler from "@/lib/SubmitForm";
import { useState } from "react";

export default function UploadPage({}) {
  const [response, setResponse] = useState(null);

  const uploadSubmitter = clickHandler(
    "api/getGitHubCommits?repo=",
    "POST",
    setResponse
  );

  return (
    <div className="h-full w-full flex items-center flex-col mt-10">
      <section className="bg-slate-300 items-center rounded h-80 w-3/4 flex justify-center flex-col">
        <h2 className="text-2xl pb-10">Upload</h2>
        <form
          onSubmit={uploadSubmitter}
          className="flex justify-between w-11/12 h-10"
          action={""}
        >
          <TextInput placeholder={"Repo to Upload"} />
          <button className="bg-pink-300 rounded w-1/3" type="submit">
            SUBMIT
          </button>
        </form>
      </section>
      {response && <p>{response}</p>}
    </div>
  );
}
