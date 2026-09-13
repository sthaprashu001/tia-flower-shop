import { ShopStatus } from "./types";
import { shopStatus as mockShopStatus } from "./data";
import { isDatabaseConfigured, connectToDatabase } from "./mongodb";
import ShopSettings from "@/models/ShopSettings";

export interface ShopSettingsValue {
  status: ShopStatus;
  capacityPerHour: number;
}

const DEFAULT_CAPACITY_PER_HOUR = 8;

export async function getShopSettings(): Promise<ShopSettingsValue> {
  if (!isDatabaseConfigured()) {
    return { status: mockShopStatus, capacityPerHour: DEFAULT_CAPACITY_PER_HOUR };
  }

  try {
    await connectToDatabase();
    const doc = await ShopSettings.findOne().lean<{ status: ShopStatus; capacityPerHour: number } | null>();
    if (!doc) return { status: "OPEN", capacityPerHour: DEFAULT_CAPACITY_PER_HOUR };
    return { status: doc.status, capacityPerHour: doc.capacityPerHour ?? DEFAULT_CAPACITY_PER_HOUR };
  } catch (err) {
    console.error("Failed to load shop settings, using defaults:", err);
    return { status: mockShopStatus, capacityPerHour: DEFAULT_CAPACITY_PER_HOUR };
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
  }).lean<{ status: ShopStatus; capacityPerHour: number } | null>();
  if (!doc) {
    // Shouldn't happen with upsert:true, but keeps TypeScript (and any
    // unexpected driver behavior) honest.
    throw new Error("Failed to read back shop settings after update.");
  }
  return { status: doc.status, capacityPerHour: doc.capacityPerHour ?? DEFAULT_CAPACITY_PER_HOUR };
}
