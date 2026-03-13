// lib/theme.js
"use client";

import { createTheme } from "@mui/material/styles";

// 基准橙色（来自图片的近似值）
export const BRAND_ORANGE = "#FF6600";

const theme = createTheme({
  palette: {
    primary: {
      main: BRAND_ORANGE,
      dark: "#E65C00",
      light: "#FF8533",
      contrastText: "#FFFFFF",
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        // 让 <Button variant="contained" /> 默认是 primary
        color: "primary",
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 10,
        },
      },
    },
  },
});

export default theme;