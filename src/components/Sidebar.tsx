import {
  Box,
  Toolbar,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Button,
} from '@mui/material'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined'
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import RepeatOutlinedIcon from '@mui/icons-material/RepeatOutlined'
import CloudSyncOutlinedIcon from '@mui/icons-material/CloudSyncOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import { useAuth } from '../store/useAuth'
import { useCollection, type SyncStatus } from '../store/useCollection'
import { LOCAL_MODE } from '../lib/config'

export type Tab = 'resumen' | 'stats' | 'album' | 'faltan' | 'repes' | 'datos'

export const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'resumen', label: 'Resumen', icon: <DashboardOutlinedIcon /> },
  { id: 'stats', label: 'Estadísticas', icon: <QueryStatsOutlinedIcon /> },
  { id: 'album', label: 'Álbum', icon: <StyleOutlinedIcon /> },
  { id: 'faltan', label: 'Faltan', icon: <SearchOutlinedIcon /> },
  { id: 'repes', label: 'Repetidas', icon: <RepeatOutlinedIcon /> },
  { id: 'datos', label: 'Datos', icon: <CloudSyncOutlinedIcon /> },
]

export default function Sidebar({
  tab,
  onTab,
}: {
  tab: Tab
  onTab: (t: Tab) => void
}) {
  const { user, signOut } = useAuth()
  const status = useCollection((s) => s.status)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 1 }}>
        <SportsSoccerIcon color="primary" />
        <Typography variant="h6" noWrap>
          Figus Tracker
        </Typography>
      </Toolbar>
      <Divider />

      <List sx={{ flex: 1, px: 1, py: 1.5 }}>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.id}
            selected={tab === item.id}
            onClick={() => onTab(item.id)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                '&:hover': { bgcolor: 'primary.dark' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
          </ListItemButton>
        ))}
      </List>

      <Divider />
      <Box sx={{ p: 2 }}>
        {LOCAL_MODE ? (
          <Chip label="Modo local" color="warning" size="small" variant="outlined" sx={{ mb: 1 }} />
        ) : (
          <SyncChip status={status} />
        )}
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mb: 1 }}>
          {user?.email}
        </Typography>
        {!LOCAL_MODE && (
          <Button
            size="small"
            startIcon={<LogoutIcon />}
            color="inherit"
            variant="outlined"
            fullWidth
            onClick={() => signOut()}
          >
            Cerrar sesión
          </Button>
        )}
      </Box>
    </Box>
  )
}

function SyncChip({ status }: { status: SyncStatus }) {
  const map: Record<SyncStatus, { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
    idle: { label: 'Listo', color: 'default' },
    loading: { label: 'Cargando…', color: 'info' },
    saving: { label: 'Guardando…', color: 'warning' },
    saved: { label: 'Guardado ✓', color: 'success' },
    offline: { label: 'Sin conexión', color: 'warning' },
    error: { label: 'Error', color: 'error' },
  }
  const { label, color } = map[status]
  return <Chip label={label} color={color} size="small" sx={{ mb: 1 }} />
}
