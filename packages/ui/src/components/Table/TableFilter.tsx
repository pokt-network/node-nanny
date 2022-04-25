import { Dispatch } from "react"

import SearchBar from "components/SearchBar"

import Box from "@mui/material/Box"
import FormControl from "@mui/material/FormControl"
import InputLabel from "@mui/material/InputLabel"
import Select from "@mui/material/Select"
import MenuItem from "@mui/material/MenuItem"
import ListItemText from "@mui/material/ListItemText"

type TableFilterProps = {
  filter: string
  filters: string[]
  setFilter: Dispatch<string>
  searchTerm: string
  setSearchTerm: Dispatch<string>
  searchEnabled: boolean
  filterEnabled: boolean
}

export const TableFilter = ({ filters, filter, setFilter, searchTerm, setSearchTerm, searchEnabled, filterEnabled }: TableFilterProps) => {
  const handleFiltersSelect = (event) => {
    setFilter(event.target.value);
  };

  return (
    <Box sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
      {searchEnabled && (
        <SearchBar
          value={searchTerm}
          onChange={(event) => setSearchTerm((event as any).target.value)}
          type={"Log"}
        />
      )}
      {filterEnabled && (
        <FormControl size="small" sx={{ width: "25%"}}>
          <InputLabel id="filter-label">Filter</InputLabel>
          <Select
            name="filter"
            labelId="filter-label"
            value={filter}
            onChange={handleFiltersSelect}
            variant="outlined"
            sx={{ height: "40px" }}
          >
            {filters.map((filter) => (
              <MenuItem key={filter} value={filter}>
                <ListItemText primary={filter} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  )
}

export default TableFilter