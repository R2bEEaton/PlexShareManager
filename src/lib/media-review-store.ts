import { promises as fs } from "fs";
import path from "path";
import {
  MediaReviewData,
  CachedMediaItem,
  MediaReviewStatus,
  ReviewStats,
} from "@/types/media-review";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "media-review.json");

function getEmptyData(): MediaReviewData {
  return {
    version: 1,
    lastSync: 0,
    mediaCache: {},
    reviewStatus: {},
  };
}

async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

export async function loadReviewData(): Promise<MediaReviewData> {
  try {
    await ensureDataDir();
    const content = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(content) as MediaReviewData;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return getEmptyData();
    }
    console.error("Error loading review data:", error);
    return getEmptyData();
  }
}

export async function saveReviewData(data: MediaReviewData): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function updateMediaCache(
  libraryId: string,
  items: CachedMediaItem[]
): Promise<CachedMediaItem[]> {
  const data = await loadReviewData();
  const existingItems = data.mediaCache[libraryId] || [];
  const existingKeys = new Set(existingItems.map((item) => item.ratingKey));

  const newItems = items.filter((item) => !existingKeys.has(item.ratingKey));

  data.mediaCache[libraryId] = items;
  data.lastSync = Date.now();
  await saveReviewData(data);

  return newItems;
}

export async function markAsReviewed(
  ratingKeys: string[],
  action: "shared" | "skipped"
): Promise<void> {
  const data = await loadReviewData();
  const now = Date.now();

  for (const ratingKey of ratingKeys) {
    data.reviewStatus[ratingKey] = {
      ratingKey,
      reviewedAt: now,
      action,
    };
  }

  await saveReviewData(data);
}

export async function getUnreviewedItems(): Promise<CachedMediaItem[]> {
  const data = await loadReviewData();
  const unreviewed: CachedMediaItem[] = [];

  for (const libraryId in data.mediaCache) {
    const items = data.mediaCache[libraryId];
    for (const item of items) {
      if (!data.reviewStatus[item.ratingKey]) {
        unreviewed.push(item);
      }
    }
  }

  // Sort by addedAt descending (newest first)
  unreviewed.sort((a, b) => b.addedAt - a.addedAt);

  return unreviewed;
}

export async function getReviewStats(): Promise<ReviewStats> {
  const data = await loadReviewData();

  let totalCached = 0;
  let unreviewed = 0;
  let shared = 0;
  let skipped = 0;
  const byLibrary: ReviewStats["byLibrary"] = {};

  for (const libraryId in data.mediaCache) {
    const items = data.mediaCache[libraryId];
    const libraryUnreviewed = items.filter(
      (item) => !data.reviewStatus[item.ratingKey]
    ).length;

    byLibrary[libraryId] = {
      total: items.length,
      unreviewed: libraryUnreviewed,
    };

    totalCached += items.length;
    unreviewed += libraryUnreviewed;
  }

  for (const ratingKey in data.reviewStatus) {
    const status = data.reviewStatus[ratingKey];
    if (status.action === "shared") {
      shared++;
    } else {
      skipped++;
    }
  }

  return {
    totalCached,
    unreviewed,
    shared,
    skipped,
    lastSync: data.lastSync || null,
    byLibrary,
  };
}

export async function clearReviewData(): Promise<void> {
  await saveReviewData(getEmptyData());
}
