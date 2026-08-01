"use client";

import { useRef } from "react";
import { Camera } from "lucide-react";
import { cn } from "@/lib/design/cn";

type ProfileAvatarProps = {
  displayName: string;
  avatarUrl?: string;
  size?: "md" | "lg";
  editable?: boolean;
  onPickFile?: (file: File) => void;
  uploading?: boolean;
};

const SIZES = {
  md: "h-11 w-11 text-lg rounded-xl",
  lg: "h-20 w-20 text-2xl rounded-2xl",
};

export function ProfileAvatar({
  displayName,
  avatarUrl,
  size = "lg",
  editable,
  onPickFile,
  uploading,
}: ProfileAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const letter = displayName.trim().charAt(0).toUpperCase() || "V";

  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden bg-primary font-semibold text-primary-foreground",
          SIZES[size],
          avatarUrl && "bg-muted",
        )}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local data URL from device storage
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          letter
        )}
      </div>
      {editable && onPickFile && (
        <>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-muted",
              uploading && "opacity-60",
            )}
            aria-label="Change profile photo"
          >
            <Camera size={14} />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPickFile(file);
              e.target.value = "";
            }}
          />
        </>
      )}
    </div>
  );
}
