import * as React from "react";
import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import TextField from "@mui/material/TextField";
import { MenuItem, Paper } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import { Button } from "@mui/material";

const CREATE_CHAIN = gql`
  mutation createChain($name: String!, $type: String!) {
    createChain(name: $name, type: $type) {
      name
      type
    }
  }
`;

const typeMenuItems = ["EVM", "AVA", "HEI", "POKT", "SOL", "ALG", "HRM"];

export function Form() {
  const [name, setName] = useState("");
  const [type, setType] = useState("EVM");
  const [submit, { data, loading, error }] = useMutation(CREATE_CHAIN);

  const handleTypeChange = (event: SelectChangeEvent<typeof type>) => {
    setType(event.target.value);
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  return (
    <React.Fragment>
      <div>
        <Paper style={{ width: "200%" }} variant="outlined">
          <FormControl fullWidth>
            <TextField
              value={name}
              onChange={handleNameChange}
              label="Chain Name"
              variant="outlined"
            />
            <Select value={type} onChange={handleTypeChange}>
              {typeMenuItems.map((item) => (
                <MenuItem value={item}>{item}</MenuItem>
              ))}
            </Select>
            <Button
              fullWidth
              style={{
                display: "flex",
                justifyContent: "center",
              }}
              variant="outlined"
              onClick={() => {
                submit({ variables: { name, type } });
                setName("");
                setType("");
              }}
            >
              Submit
            </Button>
          </FormControl>
        </Paper>
      </div>
    </React.Fragment>
  );
}
