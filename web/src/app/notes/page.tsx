"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pin, Trash2 } from "lucide-react";
import { PageHeader, PageContainer, EmptyState } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { sanitizeTitle } from "@/lib/security";
import { useAsyncAction } from "@/hooks";
import { confirmAction } from "@/lib/store/confirm-store";

export default function NotesPage() {
  const qc = useQueryClient();
  const { loading: saving, run } = useAsyncAction();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: notes = [] } = useQuery({
    queryKey: ["secure-notes"],
    queryFn: () => db.secureNotes.orderBy("updatedAt").reverse().toArray(),
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    await run(async () => {
      const now = new Date();
      await db.secureNotes.add({
        title: sanitizeTitle(title),
        body: body.trim(),
        tags: [],
        isPinned: false,
        createdAt: now,
        updatedAt: now,
      });
      setTitle("");
      setBody("");
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["secure-notes"] });
    });
  }

  async function togglePin(id: number, pinned: boolean) {
    await db.secureNotes.update(id, { isPinned: !pinned, updatedAt: new Date() });
    qc.invalidateQueries({ queryKey: ["secure-notes"] });
  }

  async function remove(id: number) {
    const note = notes.find((n) => n.id === id);
    const ok = await confirmAction({
      title: "Delete note?",
      description: note ? `"${note.title}" will be permanently removed.` : undefined,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await db.secureNotes.delete(id);
    qc.invalidateQueries({ queryKey: ["secure-notes"] });
  }

  const sorted = [...notes].sort((a, b) => Number(b.isPinned) - Number(a.isPinned));

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        eyebrow="Personal"
        title="Secure Notes"
        description="Private financial notes stored locally on your device."
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} className="mr-1.5" />
            New note
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={handleAdd} className="space-y-3">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <textarea
                className="min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                placeholder="Note content..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save note"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {sorted.length === 0 ? (
        <EmptyState title="No notes" description="Store account numbers, tax info, or financial reminders securely." />
      ) : (
        <div className="space-y-3">
          {sorted.map((n) => (
            <Card key={n.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {n.isPinned && <Pin size={14} className="text-primary" />}
                      <h3 className="font-semibold">{n.title}</h3>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Updated {new Date(n.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {n.id && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => togglePin(n.id!, n.isPinned)}>
                          <Pin size={16} />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(n.id!)}>
                          <Trash2 size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
