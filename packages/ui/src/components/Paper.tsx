import Space, { SpaceSizeEnum } from "components/Space"
import MuiPaper, { PaperTypeMap } from "@mui/material/Paper"

export const Paper = (props: PaperTypeMap["props"]) => {
  return (
    <>
      <MuiPaper
        sx={{
          width: "100%", 
          padding: 2
        }}
      >
        {props.children}
      </MuiPaper>
      <Space h={SpaceSizeEnum.Md} />
    </>
  )
}

export default Paper