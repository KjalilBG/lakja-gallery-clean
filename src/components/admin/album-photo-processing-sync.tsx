"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type AlbumPhotoProcessingSyncProps = {
  albumId: string;
  enabled: boolean;
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function AlbumPhotoProcessingSync({ albumId, enabled }: AlbumPhotoProcessingSyncProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function run() {
      let cycles = 0;

      while (!cancelled) {
        try {
          const response = await fetch(`/api/admin/albums/${albumId}/photos/process`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ action: "drain" })
          });

          if (!response.ok) {
            break;
          }

          const data = (await response.json()) as { ok?: boolean; completed?: boolean; remaining?: number };

          if (!data.ok) {
            break;
          }

          cycles += 1;

          if (cycles % 2 === 0 || data.completed || (data.remaining ?? 0) === 0) {
            router.refresh();
          }

          if (data.completed || (data.remaining ?? 0) === 0) {
            break;
          }
        } catch {
          break;
        }

        await wait(1200);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [albumId, enabled, router]);

  return null;
}
