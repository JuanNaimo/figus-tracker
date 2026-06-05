import { useEffect, useState } from 'react'
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  CircularProgress,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import { useAuth } from './store/useAuth'
import { useCollection } from './store/useCollection'
import { usePacks } from './store/usePacks'
import { useMilestones } from './store/useMilestones'
import { isSupabaseConfigured } from './lib/supabase'
import { LOCAL_MODE } from './lib/config'
import { CATALOG } from './data/catalog2026'
import { computeByTeam } from './lib/stats'
import { groupOf } from './data/groups'
import Auth from './components/Auth'
import Sidebar, { type Tab } from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Stats from './components/Stats'
import AlbumGrid from './components/AlbumGrid'
import MissingList from './components/MissingList'
import DuplicatesList from './components/DuplicatesList'
import Packs from './components/Packs'
import Scanner from './components/Scanner'
import ImportExportPanel from './components/ImportExportPanel'
import ConfigMissing from './components/ConfigMissing'

const DRAWER_WIDTH = 260

export default function App() {
  const { user, loading } = useAuth()
  const hydrate = useCollection((s) => s.hydrate)
  const clear = useCollection((s) => s.clear)
  const hydratePacks = usePacks((s) => s.hydrate)
  const clearPacks = usePacks((s) => s.clear)
  const hydrateMilestones = useMilestones((s) => s.hydrate)
  const clearMilestones = useMilestones((s) => s.clear)
  const recordMilestones = useMilestones((s) => s.record)
  const collection = useCollection((s) => s.collection)
  const [tab, setTab] = useState<Tab>('resumen')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (user) {
      hydrate(user.id)
      hydratePacks(user.id)
      hydrateMilestones(user.id)
    } else {
      clear()
      clearPacks()
      clearMilestones()
    }
  }, [user, hydrate, clear, hydratePacks, clearPacks, hydrateMilestones, clearMilestones])

  // Registra la fecha en que cada país (selección nacional) se completa por
  // primera vez, para poder mostrar "el primer país que completaste".
  useEffect(() => {
    if (!user) return
    const completed = computeByTeam(CATALOG, collection)
      .filter((t) => groupOf(t.team) !== null && t.total > 0 && t.percent === 100)
      .map((t) => t.team)
    if (completed.length) recordMilestones(completed)
  }, [user, collection, recordMilestones])

  if (!isSupabaseConfigured && !LOCAL_MODE) return <ConfigMissing />
  if (loading)
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    )
  if (!user && !LOCAL_MODE) return <Auth />

  const handleTab = (t: Tab) => {
    setTab(t)
    setMobileOpen(false)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar solo en mobile */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { md: 'none' },
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <SportsSoccerIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" noWrap>
            Figus Tracker
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Navegación lateral */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          <Sidebar tab={tab} onTab={handleTab} />
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          <Sidebar tab={tab} onTab={handleTab} />
        </Drawer>
      </Box>

      {/* Contenido */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          p: { xs: 2, md: 3 },
          maxWidth: 1100,
        }}
      >
        <Toolbar sx={{ display: { md: 'none' } }} />
        {tab === 'resumen' && <Dashboard />}
        {tab === 'stats' && <Stats />}
        {tab === 'album' && <AlbumGrid />}
        {tab === 'faltan' && <MissingList />}
        {tab === 'repes' && <DuplicatesList />}
        {tab === 'sobres' && <Packs />}
        {tab === 'escanear' && <Scanner />}
        {tab === 'datos' && <ImportExportPanel />}
      </Box>
    </Box>
  )
}
