import * as React from 'react';
import Typography from '@mui/material/Typography';

interface ViewProps {
  children?: React.ReactNode;
}

export function View(props: ViewProps) {
  return (
    <Typography component="h2" variant="h6" color="primary" gutterBottom>
      {props.children}
    </Typography>
  );
}