import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import {
  Alert,
  Box,
  Chip,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { AboutTab } from '@/src/components/AboutTab';
import { ActivityTab } from '@/src/components/ActivityTab';
import type {
  ExtensionResponse,
  RuntimeBroadcastMessage,
} from '@/src/messaging/messages';
import type { PopupState, StreamerStats } from '@/src/types/models';

import fullLogo from '@/assets/logo/logo-full.svg';

type TabKey = 'activity' | 'about';

const DEFAULT_POPUP_STATE: PopupState = {
  trackingEnabled: true,
  currentStreamer: null,
  status: 'waiting',
};

function statusLabel(state: PopupState): string {
  if (!state.trackingEnabled) {
    return 'Tracking stopped';
  }

  if (state.currentStreamer) {
    return `Watching: ${state.currentStreamer}`;
  }

  if (state.status === 'active') {
    return 'Tracking active';
  }

  return 'Waiting for Twitch';
}

function App() {
  const [tab, setTab] = useState<TabKey>('activity');
  const [stats, setStats] = useState<StreamerStats[]>([]);
  const [totalClaims, setTotalClaims] = useState(0);
  const [popupState, setPopupState] = useState<PopupState>(DEFAULT_POPUP_STATE);
  const [error, setError] = useState<string | null>(null);

  const version = browser.runtime.getManifest().version;

  const readStats = async () => {
    const response = (await browser.runtime.sendMessage({
      type: 'GET_STREAMER_STATS',
    })) as ExtensionResponse;

    if (!response.ok || !('stats' in response)) {
      setError(response.ok ? 'Unexpected stats response' : response.error);
      return;
    }

    setStats(response.stats);
    setTotalClaims(response.totalClaims);
  };

  const readPopupState = async () => {
    const response = (await browser.runtime.sendMessage({
      type: 'GET_POPUP_STATE',
    })) as ExtensionResponse;

    if (!response.ok || !('popupState' in response)) {
      setError(response.ok ? 'Unexpected popup state response' : response.error);
      return;
    }

    setPopupState(response.popupState);
  };

  const refreshAll = async () => {
    await Promise.all([readStats(), readPopupState()]);
  };

  useEffect(() => {
    void refreshAll();

    const listener = (message: RuntimeBroadcastMessage) => {
      if (message.type === 'DATA_UPDATED') {
        void readStats();
      }

      if (message.type === 'POPUP_STATE_UPDATED' || message.type === 'TRACKING_STATE_CHANGED') {
        void readPopupState();
      }
    };

    browser.runtime.onMessage.addListener(listener);
    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  }, []);

  const onToggleTracking = async (enabled: boolean) => {
    setError(null);
    const response = (await browser.runtime.sendMessage({
      type: 'SET_TRACKING_STATE',
      payload: { enabled },
    })) as ExtensionResponse;

    if (!response.ok || !('enabled' in response)) {
      setError(response.ok ? 'Unexpected tracking response' : response.error);
      return;
    }

    setPopupState((previous) => ({
      ...previous,
      trackingEnabled: response.enabled,
      status: response.enabled ? 'active' : 'stopped',
    }));
  };

  const onDeleteStreamer = async (username: string) => {
    if (!window.confirm(`Delete all local records for ${username}?`)) {
      return;
    }

    const response = (await browser.runtime.sendMessage({
      type: 'DELETE_STREAMER',
      payload: { username },
    })) as ExtensionResponse;

    if (!response.ok) {
      setError(response.error);
      return;
    }

    await readStats();
  };

  const onClearAll = async () => {
    if (!window.confirm('Clear all local claim tracking data?')) {
      return;
    }

    const response = (await browser.runtime.sendMessage({
      type: 'CLEAR_ALL_DATA',
    })) as ExtensionResponse;

    if (!response.ok) {
      setError(response.error);
      return;
    }

    await readStats();
  };

  const onExport = async () => {
    const response = (await browser.runtime.sendMessage({
      type: 'EXPORT_DATA',
    })) as ExtensionResponse;

    if (!response.ok || !('exported' in response)) {
      setError(response.ok ? 'Unexpected export response' : response.error);
      return;
    }

    const blob = new Blob([JSON.stringify(response.exported, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twitchgrabbits-export-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = useMemo(() => {
    if (!popupState.trackingEnabled) {
      return 'default' as const;
    }
    if (popupState.currentStreamer) {
      return 'success' as const;
    }
    return 'warning' as const;
  }, [popupState.currentStreamer, popupState.trackingEnabled]);

  return (
    <Box sx={{ width: 400, p: 2 }}>
      <Paper elevation={0} sx={{ p: 2, background: 'linear-gradient(140deg, #23232d, #13131a)' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box component="img" src={fullLogo} alt="TwitchGrabBits" sx={{ width: 78, height: 78 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5">TwitchGrabBits</Typography>
            <Chip
              size="small"
              color={statusColor}
              label={statusLabel(popupState)}
              aria-label={`Current status: ${statusLabel(popupState)}`}
            />
          </Box>
          <Tooltip title={popupState.trackingEnabled ? 'Stop tracking' : 'Start tracking'}>
            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <Switch
                  checked={popupState.trackingEnabled}
                  onChange={(_, checked) => void onToggleTracking(checked)}
                  slotProps={{
                    input: {
                      'aria-label': popupState.trackingEnabled
                        ? 'Tracking active, switch to stop'
                        : 'Tracking stopped, switch to start',
                    },
                  }}
                />
              }
              label={<PowerSettingsNewIcon fontSize="small" />}
              labelPlacement="start"
            />
          </Tooltip>
        </Stack>
      </Paper>

      {error ? (
        <Alert sx={{ mt: 1 }} severity="error">
          {error}
        </Alert>
      ) : null}

      <Tabs
        value={tab}
        onChange={(_, value: TabKey) => setTab(value)}
        sx={{ mt: 1 }}
        aria-label="TwitchGrabBits tabs"
      >
        <Tab label="Activity" value="activity" />
        <Tab label="About" value="about" />
      </Tabs>

      {tab === 'activity' ? (
        <ActivityTab
          stats={stats}
          totalClaims={totalClaims}
          onDeleteStreamer={onDeleteStreamer}
          onClearAll={onClearAll}
          onExport={onExport}
        />
      ) : (
        <AboutTab version={version} />
      )}
    </Box>
  );
}

export default App;
