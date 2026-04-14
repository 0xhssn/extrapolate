"use client";

import Balancer from "react-wrap-balancer";
import PhotoBooth from "@/components/home/photo-booth";
import { useRouter } from "next/navigation";
import { DataProps } from "@/lib/types";
import { useEffect, useRef, useState, useCallback } from "react";
import { LoadingCircle } from "@/components/shared/icons";

export function GalleryPage({
  initialData,
  pageSize,
}: {
  initialData: DataProps[];
  pageSize: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState<DataProps[]>(initialData);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData.length === pageSize);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/gallery?page=${page}&limit=${pageSize}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setItems((prev) => [...prev, ...json.data]);
      setHasMore(json.hasMore);
      setPage((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, pageSize]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="bg-gradient-to-br from-black to-stone-500 bg-clip-text text-center font-display text-4xl font-bold tracking-[-0.02em] text-transparent drop-shadow-sm md:text-7xl md:leading-[5rem]">
        <Balancer>Gallery</Balancer>
      </div>
      <div className="grid w-full gap-4 px-4 sm:grid-cols-2">
        {items.map((row) => (
          <div
            key={row.id}
            className="cursor-pointer transition-all hover:scale-[1.01]"
            onClick={() => router.push(`/p/${row.id}`)}
          >
            <PhotoBooth
              id={row.id}
              input={row.input}
              output={row.output}
              failed={row.failed}
              initialState={0}
              className="h-full"
            />
          </div>
        ))}
      </div>
      {items.length === 0 && !loading && (
        <div className="mt-8 flex items-center justify-center">
          <p>Upload a photo to see your gallery!</p>
        </div>
      )}
      {/* Sentinel element — triggers the next page load when it scrolls into view */}
      <div ref={sentinelRef} className="h-1 w-full" />
      {loading && (
        <div className="my-8 flex items-center justify-center">
          <LoadingCircle />
        </div>
      )}
    </div>
  );
}
