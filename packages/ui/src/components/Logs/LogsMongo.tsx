import { useEffect, useState } from "react";

import Table from "components/Table";
import { LogsSelectNodes } from "components/Logs/LogsSelectNodes";
import { useLogsQuery, useNodesQuery, ILogsQuery, IParsedLog } from "types";

import { Alert, AlertTitle, LinearProgress } from "@mui/material";

interface LogWithId extends IParsedLog {
  id: string;
}

export default function LogsMongo() {
  const [nodeIds, setNodeIds] = useState<string[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedRow, setSelectedRow] = useState<LogWithId>(undefined);

  const { data: nodesData, error: nodesError, loading: nodesLoading } = useNodesQuery();
  const {
    data: logsData,
    error: logsError,
    fetchMore,
    refetch,
  } = useLogsQuery({
    variables: { input: { nodeIds: nodeIds, page: 1, limit: rowsPerPage } },
    onCompleted: () => setLogsLoading(false),
    onError: () => setLogsLoading(false),
  });

  const filterOptions = {
    filters: ["All", "OK", "Error"],
    filterFunctions: {
      OK: ({ conditions }) => conditions === "HEALTHY",
      Error: ({ status }) => status === "ERROR",
    } as any,
  };
  const columnsOrder = ["name", "status", "conditions", "timestamp"];

  useEffect(() => {
    if (nodeIds?.length) {
      setLogsLoading(true);
      refetch();
    }
  }, [nodeIds, refetch]);

  const onPageChange = (page: number) => {
    if (logsData.logs?.hasNextPage) {
      setLogsLoading(true);
      fetchMore({
        variables: {
          input: {
            nodeIds,
            page: page + 1,
            limit: rowsPerPage,
          },
        },
      });
    }
  };

  const parseLogsForTable = (logs: ILogsQuery["logs"]["docs"]): LogWithId[] => {
    return logs.map(({ message, timestamp }, i) => {
      const parsedMessage = JSON.parse(message);
      const stamp = new Date(Number(timestamp)).toISOString();
      return {
        id: `${stamp}_${i}`,
        timestamp: stamp,
        ...parsedMessage,
      };
    });
  };

  let parsedRows = parseLogsForTable(logsData?.logs.docs || []);

  if (nodesLoading) return <LinearProgress />;
  if (nodesError || logsError)
    return (
      <>
        <Alert severity="error">
          <AlertTitle>{"Error fetching data: "}</AlertTitle>
          {(nodesError || logsError).message}
        </Alert>
      </>
    );

  return (
    <>
      <LogsSelectNodes
        nodes={nodesData.nodes}
        nodeIds={nodeIds}
        setNodeIds={setNodeIds}
      />
      <Table<LogWithId>
        type="Log"
        paginate
        searchable
        expandable
        loading={logsLoading}
        serverLoading
        serverHasNextPage={logsData.logs.hasNextPage}
        expandKey="health"
        filterOptions={filterOptions}
        columnsOrder={columnsOrder}
        rows={parsedRows}
        selectedRow={selectedRow?.id}
        onSelectRow={setSelectedRow}
        onPageChange={onPageChange}
        onRowsPerPageChange={setRowsPerPage}
      />
    </>
  );
}
