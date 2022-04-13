import {
  Dispatch,
  MouseEvent,
  SetStateAction,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Collapse,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Table as MUITable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

import { ILogsQuery, IParsedLog } from "types";
import { formatHeaderCell } from "utils";
import SearchBar from "./SearchBar";

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = "asc" | "desc";

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key,
): (a: { [key in Key]: any }, b: { [key in Key]: any }) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

interface EnhancedTableProps {
  rows: any[];
  onRequestSort: (event: MouseEvent<unknown>, property: any) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
  columnsOrder: string[];
}

function EnhancedTableHead({
  rows,
  order,
  orderBy,
  onRequestSort,
  columnsOrder,
}: EnhancedTableProps) {
  const createSortHandler = (property: any) => (event: MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };
  const headCells = rows.length
    ? (getSortedColumns(rows[0], true, columnsOrder) as string[])
        .filter((value) => value !== "id" && value !== "__typename" && value !== "health")
        .map((column) => ({ id: column, label: formatHeaderCell(column) }))
    : [];

  return (
    <TableHead>
      <TableRow>
        <TableCell />
        <TableCell />
        {headCells.map((headCell, i) => (
          <TableCell
            key={headCell.id}
            align={!i ? "left" : "right"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

interface TableProps {
  rows: ILogsQuery["logs"]["docs"];
  loading: boolean;
  loadItems: any;
  height?: number;
  searchable?: boolean;
  selectedRow?: string;
  type?: string;
  filterOptions?: FilterOptions;
  columnsOrder?: string[];
  onSelectRow?: Dispatch<SetStateAction<any>>;
}

interface FilterOptions {
  filters: string[];
  filterFunctions: { [filter: string]: (args: any) => boolean };
}

function getSortedColumns(row: any, header: boolean, columnsOrder: string[]) {
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

export function LogTable({
  rows,
  loading,
  loadItems,
  height,
  searchable,
  selectedRow,
  type,
  columnsOrder,
  filterOptions,
  onSelectRow,
}: TableProps) {
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState<string>("All");

  const parseLogsForTable = (logs: ILogsQuery["logs"]["docs"]): IParsedLog[] => {
    return logs.map(({ message, timestamp }) => {
      const parsedMessage = JSON.parse(message);
      return {
        timestamp: new Date(Number(timestamp)).toISOString(),
        ...parsedMessage,
      };
    });
  };

  const parsedRows = parseLogsForTable(rows || []);

  const handleFiltersSelect = (event) => {
    setFilter(event.target.value);
  };

  /* ----- Sorting ----- */
  const handleRequestSort = (_event: MouseEvent<unknown>, property: any) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  /* ----- Infinite Scroll ----- */
  const tableEl: any = useRef();

  const [distanceBottom, setDistanceBottom] = useState(0);
  const [hasMore] = useState(true);

  const loadMore = useCallback(() => {
    loadItems();
  }, [loadItems]);

  const scrollListener = useCallback(() => {
    let bottom = tableEl.current.scrollHeight - tableEl.current.clientHeight;
    if (!distanceBottom) {
      setDistanceBottom(Math.round((bottom / 100) * 20));
    }
    if (!loading && tableEl.current.scrollTop > bottom - distanceBottom && hasMore) {
      loadMore();
    }
  }, [hasMore, loadMore, loading, distanceBottom]);

  useLayoutEffect(() => {
    const tableRef = tableEl!.current;
    tableRef.addEventListener("scroll", scrollListener);
    return () => {
      tableRef.removeEventListener("scroll", scrollListener);
    };
  }, [scrollListener]);

  /* ----- Row Component ----- */
  interface RowProps {
    row: IParsedLog;
    index: number;
  }

  const Row = ({ row, index }: RowProps) => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <TableRow
          key={`${row.timestamp}-${index}`}
          sx={{
            "&:last-child td, &:last-child th": { border: 0 },
            cursor: `${onSelectRow ? "pointer" : "default"}`,
          }}
          hover={!!onSelectRow}
          selected={selectedRow === String(row.timestamp)}
        >
          <TableCell sx={{ width: 16 }}>
            <Chip
              sx={{ width: "100%" }}
              color={
                ({ OK: "success", ERROR: "error" }[row.status] as any) ||
                ("default" as any)
              }
            />
          </TableCell>
          <TableCell>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          {getSortedColumns(row, false, columnsOrder)
            .filter(([key]) => key !== "id" && key !== "__typename" && key !== "health")
            .map(([_, value], i) => {
              return (
                <TableCell
                  key={`${value as any}-${i}`}
                  align={!i ? "left" : "right"}
                  onClick={() => onSelectRow?.(row)}
                >
                  {Array.isArray(value) ? value.join(", ") : String(value)}
                </TableCell>
              );
            })}
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <Typography gutterBottom component="div" style={{ fontSize: 10 }}>
                  <div style={{ whiteSpace: "pre-wrap", maxWidth: "90%" }}>
                    {JSON.stringify(row.health, null, 2)}
                  </div>
                </Typography>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  const { filters, filterFunctions } = filterOptions || {};
  const filterEnabled = Boolean(filterOptions && filters && filterFunctions);
  if (filterEnabled && filter && filter !== "All") {
    rows = rows.filter(filterFunctions[filter]);
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Paper sx={{ width: "100%", overflow: "hidden", padding: "16px" }}>
        {type && (
          <Typography align="center" variant="h4" gutterBottom>
            {type}
          </Typography>
        )}
        <div style={{ display: "flex", marginRight: 16 }}>
          {filterEnabled && (
            <FormControl style={{ maxHeight: 56, width: "25%", marginRight: 16 }}>
              <InputLabel id="lb-label">Filter</InputLabel>
              <Select
                name="filter"
                labelId="filter-label"
                value={filter}
                onChange={handleFiltersSelect}
                input={<OutlinedInput label="Filter" />}
                style={{ height: 56 }}
              >
                {filters.map((filter) => (
                  <MenuItem key={filter} value={filter}>
                    <ListItemText primary={filter} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {searchable && (
            <SearchBar
              value={searchTerm}
              onChange={(event) => setSearchTerm((event as any).target.value)}
              type={"Log"}
              sx={{ marginBottom: "16px" }}
            />
          )}
        </div>
        <TableContainer sx={{ maxHeight: height || 600 }} ref={tableEl}>
          <MUITable
            stickyHeader
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size="small"
          >
            <EnhancedTableHead
              rows={parsedRows}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rowCount={rows?.length}
              columnsOrder={columnsOrder}
            />
            <TableBody>
              {parsedRows
                .slice()
                .filter(
                  (row: any) =>
                    !searchable ||
                    Object.values(row)
                      .join()
                      .toLowerCase()
                      .trim()
                      .includes(searchTerm.toLowerCase().trim()),
                )
                .sort(getComparator(order, orderBy))
                .map((row, i: number) => (
                  <Row key={row.timestamp} row={row} index={i} />
                ))}
            </TableBody>
          </MUITable>
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
        </TableContainer>
      </Paper>
    </Box>
  );
}
