import * as React from 'react';
import Typography from '@mui/material/Typography';

interface TitleProps {
  children?: React.ReactNode;
}

export const Title = (props: TitleProps) => {
  return (
    <Typography
      component="h3"
      variant="h6"
      sx={{
        marginBottom: 3,
        fontWeight: '700',
      }}
    >
      {props.children}
    </Typography>
  );
};

export default Title;
