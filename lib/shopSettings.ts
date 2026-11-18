import { ShopStatus } from "./types";
import { shopStatus as mockShopStatus } from "./data";
import { isDatabaseConfigured, connectToDatabase } from "./mongodb";
import ShopSettings from "@/models/ShopSettings";

export interface ShopSettingsValue {
  status: ShopStatus;
  capacityPerHour: number;
  openHour: number; // first pickup hour (shop time, 0-23)
  closeHour: number; // pickups end at this hour (1-24)
}

const DEFAULT_CAPACITY_PER_HOUR = 8;
// Pickups are open 24 hours a day by default (00:00 – 24:00, Kathmandu time).
const DEFAULT_OPEN_HOUR = 0;
const DEFAULT_CLOSE_HOUR = 24;

// The old built-in default was 06:00–22:00. Settings still saved with exactly
// that pair were never customised, so they are upgraded to the 24-hour default.
// To restrict hours again, save any other pair in the admin dashboard
// (e.g. 7 → 21).
const LEGACY_OPEN_HOUR = 6;
const LEGACY_CLOSE_HOUR = 22;

type SettingsDoc = { status: ShopStatus; capacityPerHour?: number; openHour?: number; closeHour?: number };

function toValue(doc: SettingsDoc): ShopSettingsValue {
  let openHour = doc.openHour ?? DEFAULT_OPEN_HOUR;
  let closeHour = doc.closeHour ?? DEFAULT_CLOSE_HOUR;
  if (openHour === LEGACY_OPEN_HOUR && closeHour === LEGACY_CLOSE_HOUR) {
    openHour = DEFAULT_OPEN_HOUR;
    closeHour = DEFAULT_CLOSE_HOUR;
  }
  return {
    status: doc.status,
    capacityPerHour: doc.capacityPerHour ?? DEFAULT_CAPACITY_PER_HOUR,
    openHour,
    closeHour,
  };
}

const DEFAULTS = { capacityPerHour: DEFAULT_CAPACITY_PER_HOUR, openHour: DEFAULT_OPEN_HOUR, closeHour: DEFAULT_CLOSE_HOUR };

export async function getShopSettings(): Promise<ShopSettingsValue> {
  if (!isDatabaseConfigured()) {
    return { status: mockShopStatus, ...DEFAULTS };
  }

  try {
    await connectToDatabase();
    const doc = await ShopSettings.findOne().lean<SettingsDoc | null>();
    if (!doc) return { status: "OPEN", ...DEFAULTS };
    return toValue(doc);
  } catch (err) {
    console.error("Failed to load shop settings, using defaults:", err);
    return { status: mockShopStatus, ...DEFAULTS };
  }
}

export async function updateShopSettings(
  updates: Partial<ShopSettingsValue>
): Promise<ShopSettingsValue> {
  await connectToDatabase();
  const doc = await ShopSettings.findOneAndUpdate({}, updates, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  }).lean<SettingsDoc | null>();
  if (!doc) {
    // Shouldn't happen with upsert:true, but keeps TypeScript (and any
    // unexpected driver behavior) honest.
    throw new Error("Failed to read back shop settings after update.");
  }
  return toValue(doc);
}
