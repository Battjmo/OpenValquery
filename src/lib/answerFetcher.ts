// @ts-ignore
export const answerFetcher = (...args) =>
  // @ts-ignore
  fetch(...args).then((res) => {
    if (res.status !== 200) {
      const errorResponse = { message: "no answer" };
      return errorResponse;
    }
    return res.json();
  });
