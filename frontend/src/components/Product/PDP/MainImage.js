import { Avatar } from "@mui/material";
import React from "react";

function MainImage({ src }) {
  return (
    <div>
      {/* <img src={src} width="100%" /> */}
      <Avatar
        src={src}
        sx={{
          width: 480,
          height: 640,
        }}
        variant="square"
      ></Avatar>
    </div>
  );
}

export default MainImage;
