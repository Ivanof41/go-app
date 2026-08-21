"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { AvatarCropModal } from "./AvatarCropModal";

export function AvatarUploader({
  currentAvatar,
  name,
}: {
  currentAvatar: string | null;
  name: string;
}) {
  const [avatar, setAvatar] = useState(currentAvatar);
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingSrc(URL.createObjectURL(file));
    e.target.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar src={avatar} name={name} size="lg" />
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onFileChange}
        />
        <Button type="button" variant="ghost" fullWidth={false} onClick={() => inputRef.current?.click()}>
          Cambiar foto
        </Button>
      </div>

      {pendingSrc && (
        <AvatarCropModal
          imageSrc={pendingSrc}
          onClose={() => setPendingSrc(null)}
          onSaved={(dataUrl) => {
            setAvatar(dataUrl);
            setPendingSrc(null);
          }}
        />
      )}
    </div>
  );
}
