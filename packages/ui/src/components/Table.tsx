import { ChangeEvent, Dispatch, MouseEvent, SetStateAction, useState } from "react";
import {
  Box,
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

interface TableProps {
  rows: { [key: string]: any }[];
  height?: number;
  searchable?: boolean;
  paginate?: boolean;
  numPerPage?: number;
  selectedRow?: string;
  type?: string;
  onSelectRow?: Dispatch<SetStateAction<any>>;
}

export function Table({
  rows,
  height,
  searchable,
  paginate,
  numPerPage,
  selectedRow,
  type,
  onSelectRow,
}: TableProps) {
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(
    paginate ? numPerPage || 25 : rows.length,
  );
  const [searchTerm, setSearchTerm] = useState<string>("");

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

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

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
              rowCount={rows.length}
            />
            <TableBody>
              {rows
                .slice()

                .filter(
                  (row) =>
                    !searchable ||
                    Object.values(row)
                      .join()
                      .toLowerCase()
                      .trim()
                      .includes(searchTerm.toLowerCase().trim()),
                )
                .sort(getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => {
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
                      {Object.entries(row)
                        .filter(([key]) => key !== "id" && key !== "__typename")
                        .map(([_, value], i) => {
                          return (
                            <TableCell
                              key={value}
                              align={!i ? "left" : "right"}
                              onClick={() => onSelectRow?.(row)}
                            >
                              {Array.isArray(value) ? value.join(", ") : String(value)}
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
