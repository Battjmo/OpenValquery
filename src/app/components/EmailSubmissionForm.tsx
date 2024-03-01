"use client";
import { FormEvent, useState } from "react";

export const EmailSubmissionForm = () => {
  const [hasBeenSent, setHasBeenSent] = useState(false);

  const emailSender = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const formObject = JSON.stringify(Object.fromEntries(formData.entries()));
    console.log(
      "🚀 ~ file: EmailSubmissionForm.tsx:16 ~ emailSender ~ formObject:",
      formObject
    );
    const results = await fetch("api/sendEmail", {
      method: "POST",
      body: formObject,
    });
    console.log("🚀 ~ emailSender ~ results:", results);
    if (results.status === 200) setHasBeenSent(true);

    return false;
  };

  return (
    <div
      id="sendit"
      className="relative flex flex-col min-w-0 break-words w-full shadow-lg rounded-lg bg-blueGray-200"
    >
      {hasBeenSent ? (
        <div className="text-center mt-6">
          <h4 className="text-2xl font-semibold">
            Thank you for your message!
          </h4>
          <p className="leading-relaxed mt-1 mb-4 text-black">
            We will get back to you in 24 hours.
          </p>
        </div>
      ) : (
        <form
          className="flex-auto p-5 lg:p-10"
          id="formy"
          onSubmit={emailSender}
        >
          <h4 className="text-2xl font-semibold">Want to work with us?</h4>
          <p className="leading-relaxed mt-1 mb-4 text-blueGray-500">
            Complete this form and we will get back to you in 24 hours.
          </p>
          <div className="relative w-full mb-3 mt-8">
            <label
              className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
              htmlFor="name"
            >
              Full Name
            </label>
            <input
              type="text"
              className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              placeholder="Full Name"
              name="name"
            />
          </div>

          <div className="relative w-full mb-3">
            <label
              className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <input
              type="email"
              className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              placeholder="Email"
              name="email"
            />
          </div>

          <div className="relative w-full mb-3">
            <label
              className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
              htmlFor="message"
            >
              Message
            </label>
            <textarea
              rows={4}
              cols={80}
              className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full"
              placeholder="Type a message..."
              name="message"
            />
          </div>
          <div className="text-center mt-6">
            <button
              className="bg-blueGray-800 text-white active:bg-blueGray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
              type="submit"
            >
              Send Message
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
