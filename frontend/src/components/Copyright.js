import { Link, Typography } from "@mui/material";
import React from "react";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

function Copyright() {
  return (
    <div className="w-screen h-auto bottom-0 p-2">
      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        mb={2}
        mt={2}
      >
        {" "}
        {"Copyright © "}
        <Link
          color="inherit"
          href="https://www.linkedin.com/in/jagkaran-singh/"
          target="_blank"
        >
          <LinkedInIcon sx={{ "&:hover": { color: "secondary.main" } }} />
        </Link>{" "}
        {new Date().getFullYear()}
      </Typography>
    </div>
  );
}

export default Copyright;
