import { Box, Divider, Link, Stack, Typography } from '@mui/material';

import { GITHUB_URL, PERSONAL_WEBSITE_URL } from '@/src/config/links';

import fullLogo from '@/assets/logo/logo-full.png';

interface Props {
  version: string;
  buildVersion: string;
}

export function AboutTab({ version, buildVersion }: Props) {
  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Box
        component="img"
        src={fullLogo}
        alt="TwitchGrabBits logo"
        sx={{ width: '100%', borderRadius: 2 }}
      />

      <Box>
        <Typography variant="h6">TwitchGrabBits</Typography>
        <Typography variant="body2" color="text.secondary">
          Version {version}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Build {buildVersion}
        </Typography>
      </Box>

      <Typography variant="body2">
        TwitchGrabBits watches supported Twitch channel pages for available bonus rewards,
        claims them automatically while tracking is enabled, and records local per-streamer
        claim statistics.
      </Typography>

      <Typography variant="body2" color="text.secondary">
        Privacy: claim tracking data remains local in your browser IndexedDB unless remote
        synchronization is explicitly enabled in a future version. Remote synchronization is
        disabled by default in this release.
      </Typography>

      <Divider />

      <Stack spacing={1}>
        <Link href={GITHUB_URL} target="_blank" rel="noreferrer">
          GitHub Repository
        </Link>
        <Link href={PERSONAL_WEBSITE_URL} target="_blank" rel="noreferrer">
          Personal Website
        </Link>
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} TwitchGrabBits. All rights reserved.
        </Typography>
      </Stack>
    </Stack>
  );
}
