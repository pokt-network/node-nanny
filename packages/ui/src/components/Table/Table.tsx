import {
  ChangeEvent,
  Dispatch,
  MouseEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import {
  Table as MUITable,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  Typography,
  Chip,
  Collapse,
  Box,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import { s } from "utils";
import Paper from "components/Paper";
import Title from "components/Title";
import TableHead from "./TableHead";
import TableFilter from "./TableFilter";

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (a[orderBy] === null) return -1;
  if (b[orderBy] === null) return 1;
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

export type Order = "asc" | "desc";

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key,
): (a: { [key in Key]: any }, b: { [key in Key]: any }) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export function getSortedColumns(row: any, header: boolean, columnsOrder: string[]) {
  if (columnsOrder?.length) {
    return columnsOrder.map((field) =>
      header
        ? Object.keys(row).find((key) => key === field)
        : Object.entries(row).find(([key]) => key === field),
    );
  } else {
    return header ? Object.keys(row) : Object.entries(row);
  }
}

const CellContents = ({ cell }): JSX.Element => {
  if (Array.isArray(cell)) {
    return <>{cell.join(", ")}</>;
  } else if (typeof cell === "boolean") {
    return cell ? <CheckIcon color="success" /> : <CloseIcon color="error" />;
  } else if (cell === null) {
    return <>{"--"}</>;
  } else {
    return <>{String(cell)}</>;
  }
};

interface TableProps<T> {
  rows: T[];
  height?: number;
  searchable?: boolean;
  paginate?: boolean;
  expandable?: boolean;
  loading?: boolean;
  serverLoading?: boolean;
  serverHasNextPage?: boolean;
  expandKey?: keyof T;
  numPerPage?: number;
  selectedRow?: string;
  type?: string;
  columnsOrder?: string[];
  filterOptions?: FilterOptions;
  onSelectRow?: Dispatch<SetStateAction<any>>;
  onPageChange?: Dispatch<number>;
  onRowsPerPageChange?: Dispatch<number>;
  mapDisplay?: (args: any) => any;
}

interface FilterOptions {
  filters: string[];
  filterFunctions: { [filter: string]: (args: any) => boolean };
}

export const Table = <T extends unknown>({
  rows,
  height,
  searchable,
  paginate,
  expandable,
  loading,
  serverLoading,
  serverHasNextPage,
  expandKey,
  numPerPage,
  selectedRow,
  type,
  columnsOrder,
  filterOptions,
  onSelectRow,
  onPageChange,
  onRowsPerPageChange,
  mapDisplay,
}: TableProps<T>) => {
  type RowWithId = T & {
    id: string;
  };

  const [allRows, setAllRows] = useState<RowWithId[]>([]);
  const [currRows, setCurrRows] = useState(allRows);
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(
    paginate ? numPerPage || 25 : rows.length,
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState<string>("All");
  const [isApiCall, setIsApiCall] = useState(false);

  const handleRequestSort = (_event: MouseEvent<unknown>, property: any) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    // if we dont have data for the next page then trigger api
    if (serverLoading && serverHasNextPage && newPage >= allRows.length / rowsPerPage) {
      onPageChange?.(newPage);
    }
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange?.(parseInt(event.target.value, 10));
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const { filters, filterFunctions } = filterOptions || {};
  const filterEnabled = Boolean(filterOptions && filters && filterFunctions);

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  useEffect(() => {
    const rowsWithId: RowWithId[] = rows.map((row, index) => {
      if (!(row as any).id) {
        (row as any).id = `${index}`;
      }
      return row as T & { id: string };
    });
    setAllRows(rowsWithId);
  }, [rows]);

  useEffect(() => {
    if (allRows.length > 0) {
      if (currRows.length === 0) {
        setCurrRows(allRows);
      }
      // if we arent loading and the whole page is empty rows reset page to zero
      if (!loading && emptyRows > 0 && emptyRows >= rowsPerPage) {
        setPage(0);
      }
    }
  }, [currRows, allRows, page, rowsPerPage, emptyRows, loading]);

  useEffect(() => {
    let rows = allRows;
    if (mapDisplay) {
      rows = rows.map(mapDisplay);
    }
    if (searchable && searchTerm !== "") {
      console.log("searchFilter");
      rows = rows.filter((row) =>
        Object.values(row)
          .join()
          .toLowerCase()
          .trim()
          .includes(searchTerm.toLowerCase().trim()),
      );
    }
    if (filterEnabled && filter && filter !== "All") {
      console.log("filterFilter");
      rows = rows.filter(filterFunctions[filter]);
    }
    setCurrRows(rows);
  }, [
    searchable,
    searchTerm,
    allRows,
    filterEnabled,
    filterFunctions,
    filter,
    mapDisplay,
  ]);

  const getHeaderText = (): string => {
    const filterString = !filterEnabled || filter === "All" ? "" : filter;
    const searchString = searchTerm ? `"${searchTerm}"` : "";
    return `${
      currRows.length !== 0 ? currRows.length : ""
    } ${searchString} ${filterString} ${type}${s(rows.length)}`;
  };

  const handleOnSelect = (row) => {
    if (selectedRow === row.id) {
      onSelectRow?.(null);
    } else {
      onSelectRow?.(allRows.find((r) => r.id === row.id));
    }
  };

  return (
    <Paper>
      {type && <Title>{getHeaderText()}</Title>}
      <TableFilter
        filters={filters}
        filter={filter}
        setFilter={setFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchEnabled={true}
        filterEnabled={true}
      />
      <TableContainer sx={{ maxHeight: height || "none" }}>
        <MUITable stickyHeader aria-labelledby="tableTitle" size="small">
          <TableHead
            rows={rows}
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
            columnsOrder={columnsOrder}
            expandable={expandable}
          />
          <TableBody>
            {!loading &&
              currRows
                .sort(getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  return (
                    <>
                      <TableRow
                        key={String(row.id) ?? index}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                          cursor: `${onSelectRow ? "pointer" : "default"}`,
                        }}
                        hover={!!onSelectRow}
                        selected={selectedRow === String(row.id)}
                      >
                        {expandable && (
                          <TableCell
                            sx={{
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {typeof (row as any).status === "string" && (
                              <Chip
                                sx={{
                                  height: "10px",
                                  width: "10px",
                                  marginTop: 2,
                                  marginBottom: 2,
                                  marginRight: 1,
                                  top: "-1px",
                                  position: "relative",
                                }}
                                color={
                                  ({ OK: "success", ERROR: "error" }[
                                    (row as any).status
                                  ] as any) || ("default" as any)
                                }
                              />
                            )}
                            {row[expandKey] && (
                              <IconButton
                                aria-label="expand row"
                                size="small"
                                onClick={() => handleOnSelect(row)}
                              >
                                {selectedRow === String(row.id) ? (
                                  <KeyboardArrowUpIcon />
                                ) : (
                                  <KeyboardArrowDownIcon />
                                )}
                              </IconButton>
                            )}
                          </TableCell>
                        )}
                        {getSortedColumns(row, false, columnsOrder)
                          .filter(([key]) => key !== "id" && key !== "__typename")
                          .map(([key, value], i) => {
                            return (
                              <TableCell
                                key={`${value as any}-${i}`}
                                align={!i ? "left" : "right"}
                                onClick={() => handleOnSelect(row)}
                              >
                                <CellContents cell={value} />
                              </TableCell>
                            );
                          })}
                      </TableRow>
                      {expandable && row[expandKey] && (
                        <TableRow>
                          <TableCell
                            style={{ paddingBottom: 0, paddingTop: 0 }}
                            colSpan={6}
                          >
                            <Collapse
                              in={selectedRow === String(row.id)}
                              timeout="auto"
                              unmountOnExit
                            >
                              <Box sx={{ margin: 1 }}>
                                <Typography
                                  gutterBottom
                                  component="div"
                                  style={{ fontSize: 10 }}
                                >
                                  <div
                                    style={{ whiteSpace: "pre-wrap", maxWidth: "90%" }}
                                  >
                                    {JSON.stringify(row[expandKey], null, 2)}
                                  </div>
                                </Typography>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
            {emptyRows > 0 && (
              <TableRow
                style={{
                  height: 33 * emptyRows,
                }}
              >
                <TableCell colSpan={6} />
              </TableRow>
            )}
            {loading && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  overflow: "hidden",
                  marginTop: 8,
                }}
              >
                <CircularProgress />
              </div>
            )}
          </TableBody>
        </MUITable>
      </TableContainer>
      {paginate && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={
            allRows.length / rowsPerPage - 1 === page &&
            serverLoading &&
            serverHasNextPage
              ? -1
              : currRows.length
          }
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  );
};

export default Table;
