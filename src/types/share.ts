export interface ShareRequest {
  friendIds: string[];
  serverId: string;
  action: "add" | "remove";
  libraryIds: string[];
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
