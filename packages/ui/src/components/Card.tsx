import * as React from "react";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { Title } from "./Title";

function preventDefault(event: React.MouseEvent) {
  event.preventDefault();
}

export function Card({ title = "", text = "", subtext = "", linkText = "" }) {
  return (
    <React.Fragment>
      <Title>{title}</Title>
      <Typography component="p" variant="h4">
        {text}
      </Typography>
      <Typography color="text.secondary" sx={{ flex: 1 }}>
        {subtext}
      </Typography>
      <div>
        <Link color="primary" href="#" onClick={preventDefault}>
          {linkText}
        </Link>
      </div>
    </React.Fragment>
  );
}
