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
  IconButton,
  Paper,
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
}

function EnhancedTableHead({ rows, order, orderBy, onRequestSort }: EnhancedTableProps) {
  const createSortHandler = (property: any) => (event: MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };
  const headCells = rows.length
    ? Object.keys(rows[0])
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
  onSelectRow?: Dispatch<SetStateAction<any>>;
}

export function LogTable({
  rows,
  loading,
  loadItems,
  height,
  searchable,
  selectedRow,
  type,
  onSelectRow,
}: TableProps) {
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const parseLogsForTable = (logs: ILogsQuery["logs"]["docs"]): IParsedLog[] => {
    return logs.map(({ message, timestamp }) => {
      const parsedMessage = JSON.parse(message);
      return {
        timestamp: new Date(Number(timestamp)).toISOString(),
        ...parsedMessage,
      };
    });
  };

  const parsedRows = parseLogsForTable(rows);

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
          {Object.entries(row)
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
                <Typography variant="h6" gutterBottom component="div">
                  <div>
                    <pre>{JSON.stringify(row.health, null, 2)}</pre>
                  </div>
                </Typography>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Paper sx={{ width: "100%", overflow: "hidden", padding: "16px" }}>
        {type && (
          <Typography align="center" variant="h4" gutterBottom>
            {type}
          </Typography>
        )}
        {searchable && (
          <SearchBar
            value={searchTerm}
            handleChange={setSearchTerm}
            type={type}
            sx={{ marginBottom: "16px" }}
          />
        )}
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
              rowCount={rows.length}
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
                  <Row row={row} index={i} />
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
