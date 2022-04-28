import Box from "@mui/material/Box"

type SpaceProps = {
  h?: SpaceSizeEnum
  w?: SpaceSizeEnum
}

export enum SpaceSizeEnum {
  Xs = "xs",
  Sm = "sm", 
  Md = "md",
  Lg = "lg",
  Xl = "xl"
} 

export const Space: React.FC<SpaceProps> = ({ h, w, children }) => {
  const convertSize = (size: SpaceSizeEnum) => {
    switch (size) {
      case "xs":
        return 1
      case "sm":
        return 2
      case "md":
        return 4
      case "lg":
        return 6
      case "xl":
        return 8
      default:
        return 0
    }
  }

  return (
    <Box
      mt={convertSize(h)}
      mr={convertSize(w)}
    >
      {children}
    </Box>
  )
}

export default Space