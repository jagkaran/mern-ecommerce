import React from "react";
import { Avatar, Grid } from "@mui/material";

function ImageGrid({ images = [], onSelect, selectedImage }) {
  return (
    <Grid container direction="column">
      {images.map((image, index) => (
        <Avatar
          src={image.url}
          key={index}
          sx={{
            border: index === selectedImage ? 1 : "1px solid #eee",
            cursor: "pointer",
            width: 60,
            height: 80,
            mb: 1,
          }}
          onClick={() => onSelect(index)}
          variant="square"
        ></Avatar>
      ))}
    </Grid>
  );
}

export default ImageGrid;
