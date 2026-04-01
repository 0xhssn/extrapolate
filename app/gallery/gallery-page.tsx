"use client";

import Balancer from "react-wrap-balancer";
import PhotoBooth from "@/components/home/photo-booth";
import { useRouter } from "next/navigation";
import { DataProps } from "@/lib/types";
import { UploadDialog, useUploadDialog } from "@/components/home/upload-dialog";
import { useSignInDialog } from "@/components/layout/sign-in-dialog";
import { useCheckoutDialog } from "@/components/layout/checkout-dialog";
import { useUserDataStore } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Upload, Images, Sparkles } from "lucide-react";

export function GalleryPage({ data }: { data: DataProps[] | null }) {
  const router = useRouter();
  const setShowUploadModal = useUploadDialog((s) => s.setOpen);
  const setShowSignInModal = useSignInDialog((s) => s.setOpen);
  const setShowCheckoutModal = useCheckoutDialog((s) => s.setOpen);
  const userData = useUserDataStore((s) => s.userData);

  function handleUploadClick() {
    if (!userData) {
      setShowSignInModal(true);
    } else if (userData.credits < 10) {
      setShowCheckoutModal(true);
    } else {
      setShowUploadModal(true);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Mount the dialog so it can be triggered from this page */}
      <UploadDialog />

      <div className="bg-gradient-to-br from-black to-stone-500 bg-clip-text text-center font-display text-4xl font-bold tracking-[-0.02em] text-transparent drop-shadow-sm md:text-7xl md:leading-[5rem]">
        <Balancer>Gallery</Balancer>
      </div>

      <div className="grid w-full gap-4 px-4 sm:grid-cols-2">
        {data?.map((row) => (
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

      {data?.length === 0 && (
        <div className="mt-16 flex w-full max-w-md flex-col items-center px-4">
          {/* Icon cluster */}
          <div className="mb-6 flex items-center justify-center rounded-full bg-gradient-to-br from-stone-100 to-stone-200 p-5 shadow-inner">
            <Images className="h-10 w-10 text-stone-400" />
          </div>

          {/* Heading */}
          <h2 className="bg-gradient-to-br from-black to-stone-500 bg-clip-text text-center font-display text-2xl font-bold tracking-tight text-transparent md:text-3xl">
            <Balancer>Your gallery is empty</Balancer>
          </h2>

          {/* Sub-copy */}
          <p className="mt-3 text-center text-sm leading-relaxed text-gray-500 md:text-base">
            <Balancer ratio={0.5}>
              Upload a photo and watch AI predict how you&apos;ll age — from 10
              years from now all the way to 90. Each generation costs{" "}
              <span className="font-semibold text-gray-700">10 credits</span>.
            </Balancer>
          </p>

          {/* CTA button */}
          <Button
            size="lg"
            className="mt-8 space-x-2 rounded-full border border-primary px-8 transition-colors hover:bg-primary-foreground hover:text-primary"
            onClick={handleUploadClick}
          >
            <Upload className="h-5 w-5" />
            <span>Upload your first photo</span>
          </Button>

          {/* Motivational hint */}
          <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
            <Sparkles className="h-3.5 w-3.5" />
            Results are ready in about a minute
          </p>
        </div>
      )}
    </div>
  );
}
