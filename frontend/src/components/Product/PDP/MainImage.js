import { Avatar } from "@mui/material";
import React from "react";

function MainImage({ src }) {
  return (
    <div>
      <Avatar
        src={src}
        sx={{
          width: "auto",
          height: "auto",
        }}
        variant="square"
      ></Avatar>
    </div>
  );
}

export default MainImage;
