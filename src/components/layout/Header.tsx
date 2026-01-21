"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Server, Library, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useReviewStatus } from "@/hooks/use-review-status";

export function Header() {
  const pathname = usePathname();
  const { data: statusData } = useReviewStatus();

  const unreviewedCount = statusData?.data?.unreviewed || 0;

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Server className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Plex Share Manager</h1>
              <p className="text-sm text-muted-foreground">
                Manage your library shares with friends
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Library className="h-4 w-4" />
              Library
            </Link>
            <Link
              href="/review"
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/review" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Bell className="h-4 w-4" />
              Review New
              {unreviewedCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                  {unreviewedCount > 99 ? "99+" : unreviewedCount}
                </Badge>
              )}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
