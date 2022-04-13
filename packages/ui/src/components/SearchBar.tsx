import { ChangeEvent, Dispatch, SetStateAction } from "react";
import { FormControl, InputAdornment, InputLabel, OutlinedInput } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

interface ISearchBarProps {
  value: string;
  onChange: Dispatch<SetStateAction<ChangeEvent<HTMLTextAreaElement | HTMLInputElement>>>;
  type?: string;
  sx?: any;
}

export default function SearchBar({ value, onChange, type, sx }: ISearchBarProps) {
  const searchText = `Search${type ? ` ${type}s` : ""}`;

  return (
    <FormControl fullWidth sx={sx}>
      {type && <InputLabel htmlFor="search-input">{searchText}</InputLabel>}
      <OutlinedInput
        id="search-input"
        value={value}
        onChange={(event) => onChange(event)}
        startAdornment={
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        }
        endAdornment={
          value && (
            <HighlightOffIcon
              sx={{ cursor: "pointer" }}
              onClick={() => onChange({ target: { value: "" } } as any)}
            />
          )
        }
        label={searchText}
      />
    </FormControl>
  );
}
