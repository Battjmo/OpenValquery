# Valquery

The Generation-Assisted Retrieval (GAR) tool for analytics teams.

It currently consumes [dbt](https://www.getdbt.com/) (GitLab or GitHub) and [Notion](https://www.notion.so/) databases, search each for natural language references to data resources in Snowflake. In dbt repos these References can come from:

- Code comments
- Commit messages

In Notion it can be anything in a document.

When it finds them, it saves the Reference in a vector database with the table name(s) saved in metadata, along with other useful information.

When the end user has a question, they can use the Next.js application to ask it. The question is used to vector search against all of those References, which are aggregated down in the most relevant data resources, or Results. We then get some sample data from Snowflake for each of these and, along with the original question, feed them into an LLM. If the LLM thinks the information provided is enough to answer the question, we return the Results along with an explanation. If not, the LLM formulates a follow-up question which goes back into Valquery, and this continues until we have found enough data to answer the question. The LLM can also explain how to use an individual result to answer the question.

## GAR?

Valquery is first a foremost a search tool. It provides LLM-generated explanations of the results it provides, but ultimately the LLM is working searvice of search, rather than the other way around. Thus, not RAG, but GAR.

## Getting Started

### Prereqs

Reference sources (you'll need at least one of these):

- GitHub
- GitLab
- Notion

Result source:

- Snowflake

Vector DB:

- [Pinecone](https://www.pinecone.io/)

LLM:

- OpenAI GPT-3.5-Turbo
  Moving it to [OpenRouter](https://openrouter.ai/) is high on the todo list so people can use whatever model they want easily.

It's written using GPT-3.5-Turbo for LLM support.

### Instructions

1. Spin up the site somewhere, locally works fine.
2. Copy `.env.template`, rename it, and fill it up with your credentials.
3. Run intake utilities on both of those.
4. Use the intake endpoints to populate the pinecone database:
   - getGitHub
   - getGitLab
   - getNotion
   - Refer to the [Postman collection](https://www.postman.com/lively-satellite-585730/workspace/openvalquery/collection/31616958-1199057e-d1c7-4c6b-8ba4-b6f0f1ad509f?action=share&creator=31616958) for the API Documentation
5. Run the app and do some querying! I removed all of the auth from the SaaS version, but might add it back in to make it easier for people to host. As it is I would either run it locally or on an environment that's already behind auth.
