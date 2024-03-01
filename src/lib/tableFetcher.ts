// @ts-ignore
export const tableFetcher = (...args) =>
  // @ts-ignore
  fetch(...args).then((res) => {
    if (res.status !== 200) {
      const mockdata = require("../mockData/table.json");
      return mockdata;
    }
    return res.json();
  });
