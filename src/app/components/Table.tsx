interface TableProps {
  active: boolean;
  content: Object[];
}

const Table = (props: TableProps) => {
  const active = props.active;
  const content = props.content;
  console.log("🚀 ~ Table ~ content:", content);
  const tableHeaders = Object.keys(content[0]);
  const tableData = Object.values(content);

  return (
    <div className={`grid transition-all duration-1000 ease-in-out `}>
      <div
        className={`block self-center overflow-x-auto whitespace-nowrap w-full overflow-y-hidden`}
      >
        {tableHeaders && (
          <table className={`table-auto border-spacing-9 overflow-hidden`}>
            <thead className="bg-lightGrey text-black">
              <tr>
                {tableHeaders &&
                  tableHeaders.map((header, i) => {
                    return (
                      <th
                        key={`headers_${i}`}
                        className={`transition-all duration-1000 ease-in-out font-bold border-b ${
                          active ? "p-5 text-[14px]" : "p-0 text-[0]/[0] h-0"
                        }`}
                      >
                        {header}
                      </th>
                    );
                  })}
              </tr>
            </thead>

            <tbody className="text-black">
              {tableData &&
                tableData.map((row: Object, i: number) => {
                  const even = (i + 1) % 2 === 0 ? "bg-gray-200" : "bg-white";
                  return (
                    <tr className={even} key={`rows_${i}`}>
                      {Object.keys(row).map((key, k) => {
                        // @ts-ignore
                        const currentEntry = row[key];
                        return (
                          <td
                            key={`cell_${i}_${k}`}
                            className={`transition-all duration-1000 ease-in-out ${
                              active
                                ? "p-5 text-[14px]"
                                : "p-0 text-[0]/[0] h-0"
                            }`}
                          >
                            {`${currentEntry}`}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Table;

/* how to work on this
get mock data from table
make UI around that
*/
