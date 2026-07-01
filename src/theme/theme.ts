import { createTheme } from '@mui/material/styles';

import { COLORS } from '@/src/config/constants';

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: COLORS.primary,
      dark: COLORS.darkPurple,
      contrastText: COLORS.white,
    },
    background: {
      default: COLORS.deepBackground,
      paper: '#23232a',
    },
    text: {
      primary: COLORS.white,
      secondary: COLORS.mutedText,
    },
    success: {
      main: COLORS.success,
    },
    error: {
      main: COLORS.error,
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Segoe UI, system-ui, sans-serif',
    h5: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
  },
});
