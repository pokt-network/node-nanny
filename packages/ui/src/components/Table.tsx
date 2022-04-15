import { ChangeEvent, Dispatch, MouseEvent, SetStateAction, useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Paper,
  Table as MUITable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

import { formatHeaderCell, s } from "utils";
import SearchBar from "./SearchBar";

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (a[orderBy] === null) return -1;
  if (b[orderBy] === null) return 1;
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
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
  order: Order;
  orderBy: string;
  columnsOrder: string[];
  onRequestSort: (event: MouseEvent<unknown>, property: any) => void;
}

function EnhancedTableHead({
  rows,
  order,
  orderBy,
  columnsOrder,
  onRequestSort,
}: EnhancedTableProps) {
  const createSortHandler = (property: any) => (event: MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };
  const headCells = rows.length
    ? (getSortedColumns(rows[0], true, columnsOrder) as string[])
        .filter((value) => value !== "id" && value !== "__typename")
        .map((column) => ({ id: column, label: formatHeaderCell(column) }))
    : [];

  return (
    <TableHead>
      <TableRow>
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

interface TableProps {
  rows: any;
  height?: number;
  searchable?: boolean;
  paginate?: boolean;
  numPerPage?: number;
  selectedRow?: string;
  type?: string;
  columnsOrder?: string[];
  filterOptions?: FilterOptions;
  onSelectRow?: Dispatch<SetStateAction<any>>;
  mapDisplay?: (args: any) => any;
}

interface FilterOptions {
  filters: string[];
  filterFunctions: { [filter: string]: (args: any) => boolean };
}

export function Table({
  rows,
  height,
  searchable,
  paginate,
  numPerPage,
  selectedRow,
  type,
  columnsOrder,
  filterOptions,
  onSelectRow,
  mapDisplay,
}: TableProps) {
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(
    paginate ? numPerPage || 25 : rows.length,
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState<string>("All");

  const handleRequestSort = (_event: MouseEvent<unknown>, property: any) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFiltersSelect = (event) => {
    setFilter(event.target.value);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const { filters, filterFunctions } = filterOptions || {};
  const filterEnabled = Boolean(filterOptions && filters && filterFunctions);
  if (filterEnabled && filter && filter !== "All") {
    rows = rows.filter(filterFunctions[filter]);
  }

  const displayRows = mapDisplay ? rows.map(mapDisplay) : rows;

  const getHeaderText = (): string => {
    const unfiltered = `${
      type === "Node" || type === "Host" ? rows?.length : ""
    } ${type}${s(rows.length)}`;
    return !filterEnabled || filter === "All"
      ? unfiltered
      : `${rows?.length} ${filter} ${type}${s(rows.length)}`;
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Paper sx={{ width: "100%", overflow: "hidden", padding: "16px" }}>
        {type && (
          <Typography align="center" variant="h4" gutterBottom>
            {getHeaderText()}
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
              type={type}
              sx={{ marginBottom: "16px" }}
            />
          )}
        </div>
        <TableContainer sx={{ maxHeight: height || 600 }}>
          <MUITable
            stickyHeader
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size="small"
          >
            <EnhancedTableHead
              rows={rows}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              columnsOrder={columnsOrder}
            />
            <TableBody>
              {displayRows
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
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row: any) => {
                  return (
                    <TableRow
                      key={String(row.id)}
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        cursor: `${onSelectRow ? "pointer" : "default"}`,
                      }}
                      hover={!!onSelectRow}
                      selected={selectedRow === String(row.id)}
                    >
                      {getSortedColumns(row, false, columnsOrder)
                        .filter(([key]) => key !== "id" && key !== "__typename")
                        .map(([_, value], i) => {
                          return (
                            <TableCell
                              key={`${value as any}-${i}`}
                              align={!i ? "left" : "right"}
                              onClick={() => {
                                onSelectRow?.(
                                  mapDisplay
                                    ? rows.find((rowsData: any) => rowsData.id === row.id)
                                    : row,
                                );
                              }}
                            >
                              <CellContents cell={value} />
                            </TableCell>
                          );
                        })}
                    </TableRow>
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
            </TableBody>
          </MUITable>
        </TableContainer>
        {paginate && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Paper>
    </Box>
  );
}
