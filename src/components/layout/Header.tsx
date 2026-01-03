import { Server } from "lucide-react";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <Server className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Plex Share Manager</h1>
            <p className="text-sm text-muted-foreground">
              Manage your library shares with friends
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
