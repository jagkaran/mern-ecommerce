import React, { useState } from "react";
import { Box, TextField } from "@mui/material";

/**
 * Field — input + gentle validation copy.
 * Phrase errors as quiet suggestions, not red commands.
 */
export const Field = ({ label, hint, error, helperText, onBlur, sx, ...props }) => {
  const [touched, setTouched] = useState(false);
  const showError = Boolean(error && (touched || props.error));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, ...sx }}>
      {label && (
        <Box
          component="label"
          htmlFor={props.id || props.name}
          sx={{
            fontSize: "var(--t-fontSize-sm)",
            fontWeight: 500,
            color: "var(--t-neutral-700)",
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </Box>
      )}
      <TextField
        variant="outlined"
        size="medium"
        onBlur={(e) => {
          setTouched(true);
          onBlur?.(e);
        }}
        {...props}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "var(--t-border-radius-base)",
            backgroundColor: "#FFF",
            fontSize: "var(--t-fontSize-base)",
            fontFamily: "inherit",
            transition: "all var(--t-motion-duration-fast) var(--t-motion-easing-out)",
            "& fieldset": { borderColor: "var(--t-neutral-200)" },
            "&:hover fieldset": { borderColor: "var(--t-neutral-300)" },
            "&.Mui-focused fieldset": {
              borderColor: "var(--t-primary-600)",
              borderWidth: "2px",
            },
            ...(showError && {
              "& fieldset": { borderColor: "var(--t-semantic-error)" },
            }),
          },
          "& input": { py: 1.5 },
          "& textarea": { py: 1.5 },
        }}
      />
      {(hint || showError || helperText) && (
        <Box
          sx={{
            fontSize: "var(--t-fontSize-sm)",
            color: showError ? "var(--t-semantic-error)" : "var(--t-neutral-500)",
            fontStyle: showError ? "normal" : "italic",
            minHeight: "1.2em",
          }}
        >
          {showError ? error : hint || helperText}
        </Box>
      )}
    </Box>
  );
};

export default Field;
