import { PlexAPI } from "@lukehagar/plexjs";

export function createPlexClient() {
  const serverURL = process.env.PLEX_SERVER_URL;
  const accessToken = process.env.PLEX_AUTH_TOKEN;

  if (!serverURL || !accessToken) {
    throw new Error(
      "Missing Plex configuration. Please set PLEX_SERVER_URL and PLEX_AUTH_TOKEN in .env.local"
    );
  }

  return new PlexAPI({
    accessToken,
    serverURL,
    clientIdentifier: "plex-share-manager",
    product: "Plex Share Manager",
    version: "1.0.0",
    platform: "Web",
    device: "Browser",
  });
}

export const plexClient = createPlexClient();
