import { createTheme } from "@mui/material/styles";
import tokens from "./tokens";

const theme = createTheme({
  palette: {
    neutral: {
      50: tokens.neutral[50],
      100: tokens.neutral[100],
      200: tokens.neutral[200],
      300: tokens.neutral[300],
      400: tokens.neutral[400],
      500: tokens.neutral[500],
      600: tokens.neutral[600],
      700: tokens.neutral[700],
      800: tokens.neutral[800],
      900: tokens.neutral[900],
    },
    primary: {
      main: tokens.primary[600],
      light: tokens.primary[500],
      dark: tokens.primary[700],
      contrastText: "#FFF",
    },
    accent: {
      sage: {
        main: tokens.accent.sage[400],
        light: tokens.accent.sage[300],
        dark: tokens.accent.sage[600],
        contrastText: "#FFF",
      },
      mustard: {
        main: tokens.accent.mustard[400],
        dark: tokens.accent.mustard[700],
        contrastText: "#FFF",
      },
    },
    secondary: {
      main: tokens.accent.sage[400],
      contrastText: "#FFF",
    },
    background: { default: tokens.neutral[50], paper: "#FFFFFF" },
    text: { primary: tokens.neutral[900], secondary: tokens.neutral[500] },
    success: { main: tokens.semantic.success },
    warning: { main: tokens.semantic.warning },
    error: { main: tokens.semantic.error },
    info: { main: tokens.semantic.info },
  },
  typography: {
    fontFamily: tokens.fontFamily.sans,
    h1: {
      fontFamily: tokens.fontFamily.display,
      fontSize: tokens.fontSize["5xl"],
      fontWeight: tokens.fontWeight.medium,
      lineHeight: tokens.lineHeight.looser,
      letterSpacing: tokens.letterSpacing.tight,
      color: tokens.neutral[900],
    },
    h2: {
      fontFamily: tokens.fontFamily.display,
      fontSize: tokens.fontSize["4xl"],
      fontWeight: tokens.fontWeight.medium,
      lineHeight: 1.25,
      letterSpacing: tokens.letterSpacing.tight,
      color: tokens.neutral[900],
    },
    h3: {
      fontFamily: tokens.fontFamily.display,
      fontSize: tokens.fontSize["3xl"],
      fontWeight: tokens.fontWeight.medium,
      lineHeight: tokens.lineHeight.snug,
      color: tokens.neutral[900],
    },
    h4: {
      fontFamily: tokens.fontFamily.display,
      fontSize: tokens.fontSize["2xl"],
      fontWeight: tokens.fontWeight.medium,
      lineHeight: tokens.lineHeight.snug,
      color: tokens.neutral[900],
    },
    h5: {
      fontFamily: tokens.fontFamily.sans,
      fontSize: tokens.fontSize.xl,
      fontWeight: tokens.fontWeight.semibold,
      lineHeight: tokens.lineHeight.snug,
      color: tokens.neutral[900],
    },
    h6: {
      fontFamily: tokens.fontFamily.sans,
      fontSize: tokens.fontSize.lg,
      fontWeight: tokens.fontWeight.semibold,
      lineHeight: tokens.lineHeight.snug,
      color: tokens.neutral[800],
    },
    body1: {
      fontFamily: tokens.fontFamily.sans,
      fontSize: tokens.fontSize.base,
      lineHeight: tokens.lineHeight.base,
      color: tokens.neutral[600],
    },
    body2: {
      fontFamily: tokens.fontFamily.sans,
      fontSize: tokens.fontSize.sm,
      lineHeight: tokens.lineHeight.base,
      color: tokens.neutral[500],
    },
    overline: {
      fontFamily: tokens.fontFamily.sans,
      fontSize: tokens.fontSize.xs,
      fontWeight: tokens.fontWeight.medium,
      lineHeight: 1.4,
      letterSpacing: tokens.letterSpacing.widest,
      textTransform: "uppercase",
      color: tokens.neutral[500],
    },
    button: {
      textTransform: "none",
      fontWeight: tokens.fontWeight.medium,
      letterSpacing: tokens.letterSpacing.wide,
    },
  },
  shape: { borderRadius: parseInt(tokens.border.radius.base) },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: tokens.fontFamily.sans,
          backgroundColor: tokens.neutral[50],
          color: tokens.neutral[700],
        },
        "h1, h2, h3, h4": { fontFamily: tokens.fontFamily.display },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: tokens.border.radius.base,
          letterSpacing: tokens.letterSpacing.wide,
          fontWeight: tokens.fontWeight.medium,
          transition: `all ${tokens.motion.duration.fast} ${tokens.motion.easing.out}`,
          "&:hover": { transform: "translateY(-1px)" },
        },
        containedPrimary: {
          backgroundColor: tokens.primary[600],
          color: "#FFF",
          boxShadow: tokens.shadow.sm,
          "&:hover": {
            backgroundColor: tokens.primary[700],
            boxShadow: tokens.shadow.md,
            transform: "translateY(-1px)",
          },
          "&:active": {
            backgroundColor: tokens.primary[700],
            transform: "translateY(0)",
          },
        },
        outlinedPrimary: {
          borderColor: tokens.primary[600],
          color: tokens.primary[600],
          "&:hover": {
            backgroundColor: tokens.primary[50],
            borderColor: tokens.primary[700],
          },
        },
        textPrimary: {
          color: tokens.primary[600],
          "&:hover": { backgroundColor: tokens.primary[50] },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "none",
          borderRadius: tokens.border.radius.md,
          boxShadow: tokens.shadow.base,
          transition: `all ${tokens.motion.duration.fast} ${tokens.motion.easing.out}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: tokens.border.radius.md },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: tokens.border.radius.base,
          backgroundColor: "#FFF",
          fontFamily: tokens.fontFamily.sans,
          transition: `all ${tokens.motion.duration.fast} ${tokens.motion.easing.out}`,
          "& fieldset": { borderColor: tokens.neutral[200] },
          "&:hover fieldset": { borderColor: tokens.neutral[300] },
          "&.Mui-focused fieldset": { borderColor: tokens.primary[600], borderWidth: "2px" },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: tokens.border.radius.base,
        },
        input: {
          padding: "14px 16px",
        },
      },
    },
    MuiRating: {
      styleOverrides: {
        icon: { color: tokens.accent.mustard[400] },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: tokens.border.radius.pill,
          fontWeight: tokens.fontWeight.medium,
          letterSpacing: tokens.letterSpacing.wide,
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: tokens.primary[600],
          textDecoration: "none",
          transition: `color ${tokens.motion.duration.fast} ${tokens.motion.easing.out}`,
          "&:hover": { color: tokens.primary[700] },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${tokens.neutral[200]}`,
        },
        head: {
          fontWeight: tokens.fontWeight.semibold,
          color: tokens.neutral[700],
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: `all ${tokens.motion.duration.fast} ${tokens.motion.easing.out}`,
        },
      },
    },
  },
});

export default theme;
