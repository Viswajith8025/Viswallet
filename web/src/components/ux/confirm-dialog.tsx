"use client";

import { AlertTriangle } from "lucide-react";
import { Dialog, DialogBody } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useConfirmStore } from "@/lib/store/confirm-store";

export function ConfirmDialog() {
  const open = useConfirmStore((s) => s.open);
  const title = useConfirmStore((s) => s.title);
  const description = useConfirmStore((s) => s.description);
  const confirmLabel = useConfirmStore((s) => s.confirmLabel);
  const cancelLabel = useConfirmStore((s) => s.cancelLabel);
  const destructive = useConfirmStore((s) => s.destructive);
  const close = useConfirmStore((s) => s.close);

  return (
    <Dialog open={open} onClose={() => close(false)} labelledBy="confirm-title" size="sm">
      <DialogBody>
        <div className="mb-4 flex gap-3">
          {destructive && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Icon icon={AlertTriangle} size="lg" />
            </div>
          )}
          <div>
            <h2 id="confirm-title" className="text-title">
              {title}
            </h2>
            {description && <p className="mt-1.5 text-body text-muted-foreground">{description}</p>}
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => close(false)} className="min-h-11 w-full sm:w-auto">
            {cancelLabel ?? "Cancel"}
          </Button>
          <Button
            variant={destructive ? "destructive" : "primary"}
            onClick={() => close(true)}
            className="min-h-11 w-full sm:w-auto"
          >
            {confirmLabel ?? "Confirm"}
          </Button>
        </div>
      </DialogBody>
    </Dialog>
  );
}
