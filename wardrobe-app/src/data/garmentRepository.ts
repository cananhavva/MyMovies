import type { Garment, ID } from '@/domain/types';
import { fromBool, fromJson, orUndefined, toBool, toJson, type Database, type SqlValue } from './database';

interface GarmentRow {
  id: string;
  name: string;
  category: Garment['category'];
  subcategory: string | null;
  colors: string;
  pattern: Garment['pattern'] | null;
  seasons: string;
  weather: string;
  occasions: string;
  formality: Garment['formality'] | null;
  warmth: Garment['warmth'] | null;
  composition: string | null;
  lining_composition: string | null;
  quality: string | null;
  brand: string | null;
  product_url: string | null;
  price: string | null;
  image_uris: string;
  field_sources: string;
  ai_confidence: number | null;
  pending_analysis: number;
  notes: string | null;
  favorite: number;
  archived: number;
  created_at: string;
  updated_at: string;
}

function fromRow(row: GarmentRow): Garment {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    subcategory: orUndefined(row.subcategory),
    colors: fromJson(row.colors, []),
    pattern: orUndefined(row.pattern),
    seasons: fromJson(row.seasons, []),
    weather: fromJson(row.weather, []),
    occasions: fromJson(row.occasions, []),
    formality: orUndefined(row.formality),
    warmth: orUndefined(row.warmth),
    composition: fromJson(row.composition, undefined),
    liningComposition: fromJson(row.lining_composition, undefined),
    quality: fromJson(row.quality, undefined),
    brand: orUndefined(row.brand),
    productUrl: orUndefined(row.product_url),
    price: fromJson(row.price, undefined),
    imageUris: fromJson(row.image_uris, []),
    fieldSources: fromJson(row.field_sources, {}),
    aiConfidence: orUndefined(row.ai_confidence),
    pendingAnalysis: toBool(row.pending_analysis),
    notes: orUndefined(row.notes),
    favorite: toBool(row.favorite),
    archived: toBool(row.archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toParams(g: Garment): SqlValue[] {
  return [
    g.id,
    g.name,
    g.category,
    g.subcategory ?? null,
    toJson(g.colors),
    g.pattern ?? null,
    toJson(g.seasons),
    toJson(g.weather),
    toJson(g.occasions),
    g.formality ?? null,
    g.warmth ?? null,
    toJson(g.composition),
    toJson(g.liningComposition),
    toJson(g.quality),
    g.brand ?? null,
    g.productUrl ?? null,
    toJson(g.price),
    toJson(g.imageUris),
    toJson(g.fieldSources),
    g.aiConfidence ?? null,
    fromBool(g.pendingAnalysis),
    g.notes ?? null,
    fromBool(g.favorite),
    fromBool(g.archived),
    g.createdAt,
    g.updatedAt,
  ];
}

const COLUMNS =
  'id, name, category, subcategory, colors, pattern, seasons, weather, occasions, formality, warmth, composition, ' +
  'lining_composition, quality, brand, product_url, price, image_uris, field_sources, ai_confidence, pending_analysis, ' +
  'notes, favorite, archived, created_at, updated_at';
const PLACEHOLDERS = COLUMNS.split(',')
  .map(() => '?')
  .join(', ');

export function createGarmentRepository(db: Database) {
  return {
    async list(): Promise<Garment[]> {
      const rows = await db.getAllAsync<GarmentRow>(`SELECT ${COLUMNS} FROM garments ORDER BY created_at DESC;`, []);
      return rows.map(fromRow);
    },

    async findByProductUrl(productUrl: string): Promise<Garment | undefined> {
      const row = await db.getFirstAsync<GarmentRow>(
        `SELECT ${COLUMNS} FROM garments WHERE product_url = ? AND archived = 0 LIMIT 1;`,
        [productUrl],
      );
      return row ? fromRow(row) : undefined;
    },

    async upsert(garment: Garment): Promise<void> {
      await db.runAsync(`INSERT OR REPLACE INTO garments (${COLUMNS}) VALUES (${PLACEHOLDERS});`, toParams(garment));
    },

    async remove(id: ID): Promise<void> {
      await db.runAsync('DELETE FROM garments WHERE id = ?;', [id]);
    },
  };
}

export type GarmentRepository = ReturnType<typeof createGarmentRepository>;
