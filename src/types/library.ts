export interface PlexLibrary {
  id: string;
  key: string;
  title: string;
  type: "movie" | "show" | "artist" | "photo";
  agent: string;
  scanner: string;
  language: string;
  uuid: string;
  updatedAt: number;
  createdAt: number;
  scannedAt: number;
  itemCount?: number;
}

export interface PlexMediaItem {
  id: string;
  key: string;
  title: string;
  type: "movie" | "show" | "episode" | "season";
  year?: number;
  thumb?: string;
  art?: string;
  rating?: number;
  summary?: string;
  duration?: number;
  addedAt?: number;
  updatedAt?: number;
  ratingKey: string;
  labels?: string[]; // Array of label tags
  sectionId?: string; // Library section ID (used when viewing all libraries)
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
