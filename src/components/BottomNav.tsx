import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined'
import QrCodeScannerOutlinedIcon from '@mui/icons-material/QrCodeScannerOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import type { Tab } from './Sidebar'

// Accesos rápidos en la barra inferior (mobile). El resto de las secciones
// vive en "Más", que abre el menú lateral completo.
const PRIMARY: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'resumen', label: 'Resumen', icon: <DashboardOutlinedIcon /> },
  { id: 'album', label: 'Álbum', icon: <StyleOutlinedIcon /> },
  { id: 'escanear', label: 'Escanear', icon: <QrCodeScannerOutlinedIcon /> },
  { id: 'sobres', label: 'Sobres', icon: <Inventory2OutlinedIcon /> },
]

export default function BottomNav({
  tab,
  onTab,
  onMore,
}: {
  tab: Tab
  onTab: (t: Tab) => void
  onMore: () => void
}) {
  // Si la sección activa no está entre los accesos rápidos, resaltamos "Más".
  const value = PRIMARY.some((p) => p.id === tab) ? tab : 'more'

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (t) => t.zIndex.appBar,
        display: { md: 'none' },
        borderTop: '1px solid',
        borderColor: 'divider',
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_e, v: Tab | 'more') => (v === 'more' ? onMore() : onTab(v))}
      >
        {PRIMARY.map((p) => (
          <BottomNavigationAction key={p.id} value={p.id} label={p.label} icon={p.icon} />
        ))}
        <BottomNavigationAction value="more" label="Más" icon={<MoreHorizIcon />} />
      </BottomNavigation>
    </Paper>
  )
}
