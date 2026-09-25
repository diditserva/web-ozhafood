import fs from 'fs';
import path from 'path';
import { db } from './db';
import { QRIS_IMAGE_DATA } from './constants';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

export interface AppSettings {
  qrisUrl: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  qrisUrl: QRIS_IMAGE_DATA,
};

export async function getAppSettings(): Promise<AppSettings> {
  // 1. Try reading from data/settings.json
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          qrisUrl: parsed.qrisUrl || DEFAULT_SETTINGS.qrisUrl,
        };
      }
    }
  } catch (err) {
    console.error('Error reading settings file:', err);
  }

  // 2. Fallback to PostgreSQL app_settings table
  try {
    const rows = await db.$queryRawUnsafe<Array<{ key: string; value: string }>>(
      'SELECT key, value FROM "app_settings" WHERE key = $1',
      'qrisUrl'
    );
    if (rows && rows.length > 0 && rows[0].value) {
      return { ...DEFAULT_SETTINGS, qrisUrl: rows[0].value };
    }
  } catch {
    // app_settings table might not exist yet
  }

  return DEFAULT_SETTINGS;
}

export async function updateAppSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();
  const updated: AppSettings = { ...current, ...newSettings };

  // 1. Save to data/settings.json
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving settings file:', err);
  }

  // 2. Save to database if possible
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "app_settings" (
        "key" TEXT PRIMARY KEY,
        "value" TEXT NOT NULL,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    if (newSettings.qrisUrl) {
      await db.$executeRawUnsafe(
        `INSERT INTO "app_settings" ("key", "value", "updated_at")
         VALUES ($1, $2, NOW())
         ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updated_at" = NOW()`,
        'qrisUrl',
        newSettings.qrisUrl
      );
    }
  } catch (err) {
    console.error('Error saving settings to database:', err);
  }

  return updated;
}
