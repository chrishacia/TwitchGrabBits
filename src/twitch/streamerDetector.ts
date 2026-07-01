import { STREAM_INFO_SELECTOR } from '@/src/twitch/selectors';

const RESERVED_ROUTES = new Set([
  'directory',
  'videos',
  'settings',
  'subscriptions',
  'inventory',
  'drops',
  'downloads',
  'jobs',
  'p',
  'turbo',
  'wallet',
  'search',
  'store',
  'friends',
  'team',
  'tags',
]);

const CHANNEL_NAME_REGEX = /^[a-z0-9_]+$/;

export function normalizePotentialChannelPath(pathOrHref: string): string | null {
  const normalizedInput = pathOrHref.trim();
  if (!normalizedInput) {
    return null;
  }

  let pathname: string;
  try {
    const maybeUrl = normalizedInput.startsWith('http')
      ? new URL(normalizedInput)
      : new URL(normalizedInput, 'https://www.twitch.tv');
    pathname = maybeUrl.pathname;
  } catch {
    return null;
  }

  const cleanPath = pathname.replace(/\/+$/, '').toLowerCase();
  const segments = cleanPath.split('/').filter(Boolean);

  if (segments.length !== 1) {
    return null;
  }

  const candidate = segments[0] ?? '';
  if (!candidate || RESERVED_ROUTES.has(candidate) || !CHANNEL_NAME_REGEX.test(candidate)) {
    return null;
  }

  return candidate;
}

export function detectCurrentStreamer(doc: Document, url: URL): string | null {
  const preferredFromPath = normalizePotentialChannelPath(url.pathname);
  const section = doc.querySelector(STREAM_INFO_SELECTOR);

  if (section) {
    const anchors = Array.from(section.querySelectorAll<HTMLAnchorElement>('a[href]'));

    const candidates = anchors
      .map((anchor) => normalizePotentialChannelPath(anchor.getAttribute('href') ?? anchor.href))
      .filter((value): value is string => Boolean(value));

    if (preferredFromPath && candidates.includes(preferredFromPath)) {
      return preferredFromPath;
    }

    if (candidates.length > 0) {
      return candidates[0] ?? null;
    }
  }

  return preferredFromPath;
}
