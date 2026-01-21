export interface CachedMediaItem {
  ratingKey: string;
  libraryId: string;
  title: string;
  type: "movie" | "show";
  year?: number;
  addedAt: number;
  thumb?: string;
}

export interface MediaReviewStatus {
  ratingKey: string;
  reviewedAt: number;
  action: "shared" | "skipped";
}

export interface MediaReviewData {
  version: 1;
  lastSync: number;
  mediaCache: { [libraryId: string]: CachedMediaItem[] };
  reviewStatus: { [ratingKey: string]: MediaReviewStatus };
}

export interface SyncResult {
  newItems: CachedMediaItem[];
  totalItems: number;
  librariesSynced: number;
}

export interface ReviewStats {
  totalCached: number;
  unreviewed: number;
  shared: number;
  skipped: number;
  lastSync: number | null;
  byLibrary: {
    [libraryId: string]: {
      total: number;
      unreviewed: number;
    };
  };
}

export interface ReviewRequest {
  ratingKeys: string[];
  action: "shared" | "skipped";
}
