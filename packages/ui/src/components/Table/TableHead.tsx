import { MouseEvent } from 'react';

import { Order, getSortedColumns } from './Table';
import { formatHeaderCell } from 'utils';

import MuiTableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';

interface EnhancedTableProps {
  rows: any[];
  order: Order;
  orderBy: string;
  columnsOrder: string[];
  onRequestSort: (event: MouseEvent<unknown>, property: any) => void;
  expandable?: boolean;
}

export const TableHead = ({
  rows,
  order,
  orderBy,
  columnsOrder,
  onRequestSort,
  expandable,
}: EnhancedTableProps) => {
  const createSortHandler = (property: any) => (event: MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };
  const headCells = rows.length
    ? (getSortedColumns(rows[0], true, columnsOrder) as string[])
        .filter((value) => value !== 'id' && value !== '__typename')
        .map((column) => ({ id: column, label: formatHeaderCell(column) }))
    : [];

  return (
    <MuiTableHead>
      <TableRow>
        {expandable && (
          <TableCell
            align="left"
            sx={{
              backgroundColor: '#252F3A',
              color: 'secondary.main',
              fontWeight: 'bold',
            }}
          ></TableCell>
        )}
        {headCells.map((headCell, i) => (
          <TableCell
            key={headCell.id ?? i}
            align={!i ? 'left' : 'right'}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{
              backgroundColor: '#252F3A',
              color: 'secondary.main',
              fontWeight: 'bold',
            }}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
              sx={{
                whiteSpace: 'nowrap',
              }}
            >
              {headCell.label}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </MuiTableHead>
  );
};

export default TableHead;
