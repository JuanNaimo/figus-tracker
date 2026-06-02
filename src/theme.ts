import { createTheme } from '@mui/material/styles'

// Tema oscuro de alto contraste para la app.
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#4f8cff', contrastText: '#04122e' }, // azul vivo (acentos/nav)
    secondary: { main: '#f1c40f', contrastText: '#1a1500' }, // dorado (repetidas)
    success: { main: '#2ecc71', contrastText: '#00210f' }, // tengo
    warning: { main: '#f1c40f' },
    error: { main: '#ff5a5a' },
    background: { default: '#0a0e1a', paper: '#161c2d' },
    text: { primary: '#f8fafc', secondary: '#a8b3cf' },
    divider: 'rgba(255,255,255,0.12)',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: '1px solid rgba(255,255,255,0.10)' } } },
    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: { root: { border: '1px solid rgba(255,255,255,0.10)', '&:before': { display: 'none' } } },
    },
  },
})
