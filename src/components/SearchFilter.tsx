import {
  Stack,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { TEAMS_IN_ORDER } from '../data/catalog2026'
import type { FilterOptions, StatusFilter } from '../lib/filters'

const STATUS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'missing', label: 'Faltan' },
  { id: 'owned', label: 'Tengo' },
  { id: 'duplicates', label: 'Repetidas' },
]

export default function SearchFilter({
  options,
  onChange,
}: {
  options: FilterOptions
  onChange: (next: FilterOptions) => void
}) {
  return (
    <Stack spacing={1.5} sx={{ mb: 2 }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Buscar por número, equipo o jugador…"
        value={options.query}
        onChange={(e) => onChange({ ...options, query: e.target.value })}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={options.status}
          onChange={(_e, v: StatusFilter | null) => v && onChange({ ...options, status: v })}
          sx={{ flexWrap: 'wrap' }}
        >
          {STATUS.map((s) => (
            <ToggleButton key={s.id} value={s.id} sx={{ px: 1.5 }}>
              {s.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <TextField
          select
          size="small"
          label="Equipo"
          value={options.team}
          onChange={(e) => onChange({ ...options, team: e.target.value })}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">Todos los equipos</MenuItem>
          {TEAMS_IN_ORDER.map((team) => (
            <MenuItem key={team} value={team}>
              {team}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </Stack>
  )
}
