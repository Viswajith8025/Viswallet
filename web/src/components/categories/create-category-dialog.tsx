"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, Sheet } from "@/components/ui/dialog";
import { CategoryIconBadge } from "@/components/categories/category-icon-badge";
import { createCustomCategory } from "@/lib/categories/create-category";
import { DEFAULT_CATEGORY_COLOR } from "@/lib/categories-default";
import { CATEGORY_ICON_NAMES } from "@/lib/category-icons";
import { cn } from "@/lib/design/cn";
import { showToast } from "@/lib/store/toast-store";
import { useInvalidateFinance } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { financeKeys } from "@/lib/queries/use-finance";

type CreateCategoryDialogProps = {
  open: boolean;
  onClose: () => void;
  kind?: "expense" | "income";
  onCreated?: (categoryId: number) => void;
};

export function CreateCategoryDialog({
  open,
  onClose,
  kind = "expense",
  onCreated,
}: CreateCategoryDialogProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const title = kind === "income" ? "New income category" : "New expense category";
  const form = open ? (
    <CreateCategoryForm key={kind} kind={kind} onClose={onClose} onCreated={onCreated} />
  ) : null;

  if (isMobile) {
    return (
      <Sheet open={open} onClose={onClose} labelledBy="create-category-title">
        <div className="px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
          <h2 id="create-category-title" className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Appears right away when adding transactions.
          </p>
          <div className="mt-4">{form}</div>
        </div>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} labelledBy="create-category-title-desktop" size="md">
      <div className="p-6">
        <h2 id="create-category-title-desktop" className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Custom categories show up in quick add and transaction forms.
        </p>
        <div className="mt-4">{form}</div>
      </div>
    </Dialog>
  );
}

function CreateCategoryForm({
  kind,
  onClose,
  onCreated,
}: {
  kind: "expense" | "income";
  onClose: () => void;
  onCreated?: (categoryId: number) => void;
}) {
  const invalidate = useInvalidateFinance();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_CATEGORY_COLOR);
  const [iconName, setIconName] = useState("circle-dot");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const created = await createCustomCategory({
        name,
        iconName,
        color,
        kind,
      });
      await invalidate();
      await queryClient.refetchQueries({ queryKey: financeKeys.all });
      showToast(`Category "${created.name}" created`, { tone: "success" });
      if (created.id != null) onCreated?.(created.id);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create category.";
      setError(message);
      showToast(message, { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={kind === "income" ? "Freelance, bonus…" : "Pet care, hobbies…"}
        autoFocus
      />
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-muted-foreground">Color</span>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-xl border border-input"
        />
      </label>
      <div className="space-y-2">
        <span className="text-sm font-medium text-muted-foreground">Icon</span>
        <div className="scroll-premium grid max-h-36 grid-cols-6 gap-2 overflow-y-auto sm:grid-cols-8">
          {CATEGORY_ICON_NAMES.slice(0, 24).map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setIconName(icon)}
              className={cn(
                "flex items-center justify-center rounded-xl border p-1 transition-all",
                iconName === icon
                  ? "border-primary bg-primary-muted ring-1 ring-primary/20"
                  : "border-border hover:border-border-strong",
              )}
              aria-pressed={iconName === icon}
              aria-label={icon}
            >
              <CategoryIconBadge iconName={icon} color={color} size="sm" />
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? "Creating…" : "Create category"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}
