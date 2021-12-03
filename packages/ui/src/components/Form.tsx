import * as React from "react";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { InputLabel, MenuItem, Paper, Select } from "@mui/material";
import Box from "@mui/material/Box";
import FormControl from '@mui/material/FormControl';
import { Button } from "@mui/material";

import { Title } from "./Title";

function preventDefault(event: React.MouseEvent) {
  event.preventDefault();
}

export function Form() {
  return (
    <React.Fragment>
      <div>
        <Paper variant="outlined">
        <FormControl fullWidth>
          <TextField id="outlined-basic" label="Chain Name" variant="outlined" />
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={"yo"}
            label="Age"
           // onChange={handleChange}
          >
            <MenuItem value={"ETH"}>ETH</MenuItem>
            <MenuItem value={20}>Twenty</MenuItem>
            <MenuItem value={30}>Thirty</MenuItem>
          </Select>
          <Button
            fullWidth
            style={{
              display: "flex",
              justifyContent: "center",
            }}
            variant="outlined"
          >
            Submit
          </Button>
          </FormControl>
        </Paper>
      </div>
    </React.Fragment>
  );
}
