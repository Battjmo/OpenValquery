const clickHandler = (
  route: string,
  ref: React.RefObject<HTMLInputElement>,
  method: string,
  setter: Function,
  loadingHandler: Function = () => {},
  setter2?: Function,
  setter3?: Function,
  setter4?: Function
) => {
  return async function (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setter("");
    if (setter2) setter2("");
    if (setter3) setter3(false);
    if (setter4) setter4(false);
    loadingHandler(true);
    const value = ref?.current?.value || "";
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
