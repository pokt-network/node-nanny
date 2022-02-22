import { ChangeEvent, useState } from "react";
import { useMutation } from "@apollo/client";
import {
  Button,
  FormControl,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";

import { CREATE_CHAIN } from "queries";
import { IChain } from "types";

const typeMenuItems = ["EVM", "AVA", "HEI", "POKT", "SOL", "ALG", "HRM"];

export default function ChainsForm() {
  const [name, setName] = useState("");
  const [type, setType] = useState("EVM");
  const [variance, setVariance] = useState(0);
  const [submit, { data, loading, error }] = useMutation<{ createChain: IChain }>(CREATE_CHAIN);

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleTypeChange = (event: SelectChangeEvent<typeof type>) => {
    setType(event.target.value);
  };

  const handleVarianceChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVariance(Number(event.target.value));
  };

  return (
    <>
      <div>
        <Paper style={{ width: "200%" }} variant="outlined">
          <FormControl fullWidth>
            <TextField
              value={name}
              onChange={handleNameChange}
              label="Chain Name"
              variant="outlined"
            />
            <div style={{ marginTop: "10px" }} />
            <Select value={type} onChange={handleTypeChange}>
              {typeMenuItems.map((item) => (
                <MenuItem value={item}>{item}</MenuItem>
              ))}
            </Select>
            <div style={{ marginTop: "10px" }} />
            <TextField
              value={variance}
              onChange={handleVarianceChange}
              label="Variance"
              variant="outlined"
            />
            <div style={{ marginTop: "10px" }} />
            <Button
              fullWidth
              style={{
                display: "flex",
                justifyContent: "center",
              }}
              variant="outlined"
              onClick={() => {
                submit({ variables: { name, type, variance } });
                setName("");
                setType("");
              }}
            >
              Submit
            </Button>
          </FormControl>
        </Paper>
      </div>
    </>
  );
}
