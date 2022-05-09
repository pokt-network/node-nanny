import MuiPaper, { PaperTypeMap } from '@mui/material/Paper';

export const Paper = (props: PaperTypeMap['props']) => {
  return (
    <MuiPaper
      sx={{
        width: '100%',
        padding: 2,
        marginBottom: 4,
      }}
    >
      {props.children}
    </MuiPaper>
  );
};

export default Paper;
