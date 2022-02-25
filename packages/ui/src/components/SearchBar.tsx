import { Dispatch, SetStateAction } from "react";
import { FormControl, InputAdornment, InputLabel, OutlinedInput } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

interface ISearchBarProps {
  value: string;
  handleChange: Dispatch<SetStateAction<string>>;
  type?: string;
  sx?: any;
}

export default function SearchBar({ value, handleChange, type, sx }: ISearchBarProps) {
  const searchText = `Search${type ? ` ${type}` : ""}`;

  return (
    <FormControl fullWidth sx={sx}>
      <InputLabel htmlFor="search-input">{searchText}</InputLabel>
      <OutlinedInput
        id="search-input"
        value={value}
        onChange={({ target }) => handleChange(target.value)}
        startAdornment={
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        }
        endAdornment={
          value && <HighlightOffIcon sx={{ cursor: "pointer" }} onClick={() => handleChange("")} />
        }
        label={searchText}
      />
    </FormControl>
  );
}
