import type { ID, InfluencerProfile, InspirationLook } from '@/domain/types';
import { fromBool, fromJson, orUndefined, toBool, toJson, type Database } from './database';

interface InfluencerRow {
  id: string;
  platform: InfluencerProfile['platform'];
  handle: string;
  profile_url: string;
  display_name: string | null;
  notes: string | null;
  created_at: string;
}

interface LookRow {
  id: string;
  influencer_id: string | null;
  source_url: string | null;
  image_uris: string;
  items: string;
  occasions: string;
  seasons: string;
  liked: number;
  recreatability: number;
  created_at: string;
}

const influencerFromRow = (row: InfluencerRow): InfluencerProfile => ({
  id: row.id,
  platform: row.platform,
  handle: row.handle,
  profileUrl: row.profile_url,
  displayName: orUndefined(row.display_name),
  notes: orUndefined(row.notes),
  createdAt: row.created_at,
});

const lookFromRow = (row: LookRow): InspirationLook => ({
  id: row.id,
  influencerId: orUndefined(row.influencer_id),
  sourceUrl: orUndefined(row.source_url),
  imageUris: fromJson(row.image_uris, []),
  items: fromJson(row.items, []),
  occasions: fromJson(row.occasions, []),
  seasons: fromJson(row.seasons, []),
  liked: toBool(row.liked),
  recreatability: row.recreatability,
  createdAt: row.created_at,
});

export function createInspirationRepository(db: Database) {
  return {
    async listInfluencers(): Promise<InfluencerProfile[]> {
      const rows = await db.getAllAsync<InfluencerRow>('SELECT * FROM influencers ORDER BY created_at DESC;', []);
      return rows.map(influencerFromRow);
    },

    async upsertInfluencer(profile: InfluencerProfile): Promise<void> {
      await db.runAsync(
        `INSERT OR REPLACE INTO influencers (id, platform, handle, profile_url, display_name, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          profile.id,
          profile.platform,
          profile.handle,
          profile.profileUrl,
          profile.displayName ?? null,
          profile.notes ?? null,
          profile.createdAt,
        ],
      );
    },

    async removeInfluencer(id: ID): Promise<void> {
      await db.withTransactionAsync(async () => {
        await db.runAsync('UPDATE inspiration_looks SET influencer_id = NULL WHERE influencer_id = ?;', [id]);
        await db.runAsync('DELETE FROM influencers WHERE id = ?;', [id]);
      });
    },

    async listLooks(): Promise<InspirationLook[]> {
      const rows = await db.getAllAsync<LookRow>('SELECT * FROM inspiration_looks ORDER BY created_at DESC;', []);
      return rows.map(lookFromRow);
    },

    async upsertLook(look: InspirationLook): Promise<void> {
      await db.runAsync(
        `INSERT OR REPLACE INTO inspiration_looks
           (id, influencer_id, source_url, image_uris, items, occasions, seasons, liked, recreatability, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          look.id,
          look.influencerId ?? null,
          look.sourceUrl ?? null,
          toJson(look.imageUris),
          toJson(look.items),
          toJson(look.occasions),
          toJson(look.seasons),
          fromBool(look.liked),
          look.recreatability,
          look.createdAt,
        ],
      );
    },

    async removeLook(id: ID): Promise<void> {
      await db.runAsync('DELETE FROM inspiration_looks WHERE id = ?;', [id]);
    },
  };
}

export type InspirationRepository = ReturnType<typeof createInspirationRepository>;
