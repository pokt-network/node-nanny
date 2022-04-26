import Box from "@mui/material/Box"

interface FormProps {
    read?: boolean
}

export const Form: React.FC<FormProps> = ({ read, children }) => {
    return (
        <Box
            sx={{
                "& .MuiFormControl-root": {
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
                border: 0,
                margin: 0,
                padding: "4px 0"
                },
                "& .MuiInputBase-root, & .MuiBox-root": {
                flexGrow: 1,
                width: "100%",
                },
                "& label": {
                width: "150px",
                position: "relative",
                transform: "none"
                },
                "& fieldset": {
                borderWidth: `${read ? "0px" : "1px"}`
                },
                "& legend": {
                display: "none"
                },
                "& .MuiFormControlLabel-root": {
                width: "100%",
                margin: 0
                }
            }}
        >
            {children}
        </Box>
    )
}

export default Form