"use client";

import { Header } from "@/components/layout/Header";
import { NewMediaReview } from "@/components/review/NewMediaReview";

export default function ReviewPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Review New Media</h1>
          <p className="text-muted-foreground mt-2">
            Review newly added content and decide whether to share with friends or skip.
          </p>
        </div>
        <NewMediaReview />
      </main>
    </div>
  );
}
