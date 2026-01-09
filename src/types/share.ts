export interface ShareRequest {
  friendIds: string[];
  serverId: string;
  action: "add" | "remove";
  libraryIds: string[];
  itemRatingKeys?: string[]; // Optional: specific items to share via labels
}

export interface ShareResponse {
  success: boolean;
  message: string;
  errors?: string[];
}

export interface SharedContent {
  friendId: string;
  sharedLibraries: string[];
  allLibraries: boolean;
}
