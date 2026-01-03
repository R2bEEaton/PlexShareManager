export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PlexServerInfo {
  id: string;
  name: string;
  address: string;
  port: number;
  version: string;
  scheme: string;
  host: string;
  accessToken: string;
  owned: boolean;
}
