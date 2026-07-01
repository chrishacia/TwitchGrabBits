import 'fake-indexeddb/auto';

import { TwitchGrabBitsDatabase } from '@/src/db/database';
import { ClaimRepository } from '@/src/db/repositories/claimRepository';

describe('ClaimRepository', () => {
  let database: TwitchGrabBitsDatabase;
  let repository: ClaimRepository;

  beforeEach(() => {
    database = new TwitchGrabBitsDatabase(`test-db-${crypto.randomUUID()}`);
    repository = new ClaimRepository(database);
  });

  afterEach(async () => {
    await database.delete();
  });

  it('creates streamer row on first claim and increments later', async () => {
    await repository.recordClaim({
      username: 'wackyjackietv',
      claimedAt: '2026-06-30T18:00:00.000Z',
      pageUrl: 'https://www.twitch.tv/wackyjackietv',
      buttonAriaLabel: 'Claim Bonus',
    });

    await repository.recordClaim({
      username: 'wackyjackietv',
      claimedAt: '2026-06-30T18:02:00.000Z',
      pageUrl: 'https://www.twitch.tv/wackyjackietv',
      buttonAriaLabel: 'Claim Bonus',
    });

    const rows = await repository.getStreamerStats();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.claimCount).toBe(2);
    expect(rows[0]?.firstClaimedAt).toBe('2026-06-30T18:00:00.000Z');
    expect(rows[0]?.lastClaimedAt).toBe('2026-06-30T18:02:00.000Z');
  });

  it('keeps streamers separated', async () => {
    await repository.recordClaim({
      username: 'streamerone',
      claimedAt: '2026-06-30T18:00:00.000Z',
      pageUrl: 'https://www.twitch.tv/streamerone',
      buttonAriaLabel: 'Claim Bonus',
    });

    await repository.recordClaim({
      username: 'streamertwo',
      claimedAt: '2026-06-30T18:01:00.000Z',
      pageUrl: 'https://www.twitch.tv/streamertwo',
      buttonAriaLabel: 'Claim Bonus',
    });

    const rows = await repository.getStreamerStats();
    const names = rows.map((row) => row.username).sort();

    expect(names).toEqual(['streamerone', 'streamertwo']);
  });

  it('stores claim event and aggregate in one transaction path for concurrent writes', async () => {
    await Promise.all(
      Array.from({ length: 5 }).map((_, index) =>
        repository.recordClaim({
          username: 'wackyjackietv',
          claimedAt: `2026-06-30T18:0${index}:00.000Z`,
          pageUrl: 'https://www.twitch.tv/wackyjackietv',
          buttonAriaLabel: 'Claim Bonus',
        }),
      ),
    );

    const rows = await repository.getStreamerStats();
    const exportData = await repository.exportData();

    expect(rows[0]?.claimCount).toBe(5);
    expect(exportData.claimEvents).toHaveLength(5);
  });
});
