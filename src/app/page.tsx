/* eslint-disable @next/next/no-img-element */
import SearchBar from "../app/components/SearchBar";

const exampleQuestions = [
  "What is our average contract value?",
  "Does an organization's repository size or count correlate to recurring revenue?",
  "How can I understand feature usage by customer segment?",
  "What is our customer LTV?",
  "Establish a company standard method of sentiment scoring our customer reviews.",
];

export default async function Home() {
  return (
    <main className="flex justify-start flex-col h-screen bg-blue">
      <div className="flex justify-center content-center items-center">
        <SearchBar exampleQuestions={exampleQuestions} />
      </div>
    </main>
  );
}
