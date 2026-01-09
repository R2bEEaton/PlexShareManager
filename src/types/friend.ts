export interface PlexFriend {
  id: string;
  email: string;
  username: string;
  friendlyName: string;
  thumb?: string;
  lastSeenAt?: number;
  sharedServers?: PlexSharedServer[];
}

export interface PlexSharedServer {
  id: string;
  name: string;
  libraryIds: string[];
  allLibraries: boolean;
}
