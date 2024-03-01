const clickHandler = (
  route: string,
  method: string,
  setter: Function,
  loadingHandler: Function = () => {},
  setter2?: Function,
  setter3?: Function
) => {
  return async function (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setter("");
    if (setter2) setter2("");
    if (setter3) setter3(false);
    loadingHandler(true);
    const searchBar = document.getElementById("searchBar") as HTMLInputElement;
    const value = searchBar?.value;
    route += value;
    const results = await fetch(route, {
      method: `${method}`,
    });
    loadingHandler(false);
    const result = await results.json();

    setter(result);
    return false;
  };
};

export default clickHandler;
