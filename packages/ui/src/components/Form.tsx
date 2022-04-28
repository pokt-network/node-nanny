import Box from "@mui/material/Box";

interface FormProps {
  read?: boolean;
}

export const Form: React.FC<FormProps> = ({ read, children }) => {
  return (
    <Box
      sx={{
        "& .MuiFormControl-root": {
          display: "grid",
          gridTemplateColumns: "150px 1fr",
          alignItems: "center",
          width: "100%",
          border: 0,
          margin: 0,
          padding: "4px 0",
        },
        "& .MuiInputBase-root, & .MuiBox-root": {
          flexGrow: 1,
          width: "auto",
        },
        "& label": {
          width: "150px",
          maxWidth: "none",
          position: "relative",
          transform: "none",
          transition: "none",
        },
        "& fieldset": {
          borderWidth: `${read ? "0px" : "1px"}`,
        },
        "& legend": {
          display: "none",
        },
        "& .MuiFormControlLabel-root": {
          width: "100%",
          margin: 0,
        },
        "& .MuiFormHelperText-root": {
          gridColumn: "2",
          marginX: 1,
        },
      }}
    >
      {children}
    </Box>
  );
};

export default Form;
