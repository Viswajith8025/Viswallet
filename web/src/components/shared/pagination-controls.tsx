import { Button } from "@/components/ui/button";

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalItems <= pageSize) return null;

  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 text-sm">
      <span className="text-muted-foreground">
        {from}–{to} of {totalItems}
        {totalPages > 1 && ` · Page ${page + 1} of ${totalPages}`}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={!hasPrev} aria-label="Previous page">
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext} aria-label="Next page">
          Next
        </Button>
      </div>
    </div>
  );
}
