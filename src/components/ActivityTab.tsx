import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';

import { fromNow, formatDateTime } from '@/src/utils/time';
import type { StreamerStats } from '@/src/types/models';

type SortMode = 'count' | 'recent';

interface Props {
  stats: StreamerStats[];
  totalClaims: number;
  onDeleteStreamer: (username: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onExport: () => Promise<void>;
}

export function ActivityTab({
  stats,
  totalClaims,
  onDeleteStreamer,
  onClearAll,
  onExport,
}: Props) {
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const rows = stats.filter((row) => row.username.toLowerCase().includes(normalizedSearch));

    return rows.sort((a, b) => {
      if (sortMode === 'count') {
        return b.claimCount - a.claimCount;
      }
      return new Date(b.lastClaimedAt).getTime() - new Date(a.lastClaimedAt).getTime();
    });
  }, [search, sortMode, stats]);

  if (stats.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No bonus claims tracked yet. Watch a Twitch stream and wait for a channel point bonus.
      </Alert>
    );
  }

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Chip
          color="primary"
          label={`${totalClaims} total bonus${totalClaims === 1 ? '' : 'es'} claimed`}
        />
        <Stack direction="row" spacing={1}>
          <Tooltip title="Export local data as JSON">
            <IconButton aria-label="Export local data" onClick={() => void onExport()}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Button color="error" variant="outlined" onClick={() => void onClearAll()}>
            Clear all
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1}>
        <TextField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search streamer"
          size="small"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" />
                </InputAdornment>
              ),
              'aria-label': 'Search streamer by name',
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={sortMode}
            aria-label="Sort streamers"
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            <MenuItem value="recent">Most recent</MenuItem>
            <MenuItem value="count">Highest count</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {filtered.length === 0 ? (
        <Alert severity="info">No streamers match your current search.</Alert>
      ) : (
        filtered.map((row) => (
          <Card key={row.username} variant="outlined">
            <CardContent>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
              >
                <Box>
                  <Typography variant="h6">{row.username}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {row.claimCount} bonuses claimed
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last claimed: {fromNow(row.lastClaimedAt)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    First claimed: {formatDateTime(row.firstClaimedAt)}
                  </Typography>
                </Box>
                <Tooltip title={`Delete ${row.username} records`}>
                  <IconButton
                    aria-label={`Delete ${row.username}`}
                    color="error"
                    onClick={() => void onDeleteStreamer(row.username)}
                  >
                    <DeleteOutlineOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </CardContent>
          </Card>
        ))
      )}
    </Stack>
  );
}
