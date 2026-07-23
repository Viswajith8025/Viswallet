"use client";

import { useMemo, useState } from "react";
import { format, isSameDay, startOfDay } from "date-fns";
import { CreditCard, Receipt, Repeat } from "lucide-react";
import { PageHeader, EmptyState, PageContainer } from "@/components/ui/page";
import { DexiePageGate } from "@/components/layout/dexie-page-gate";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { useDexieTable } from "@/hooks";

type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  amountPaise: number;
  type: "bill" | "emi" | "subscription";
};

export default function CalendarPage() {
  const { data: events = [], isPending, isError, refetch } = useDexieTable(
    "calendar-events",
    async () => {
      const [bills, emis, subs] = await Promise.all([
        db.bills.filter((b) => b.status !== "paid").toArray(),
        db.emis.filter((e) => e.isActive).toArray(),
        db.subscriptions.filter((s) => s.isActive && !!s.nextRenewalAt).toArray(),
      ]);
      const all: CalendarEvent[] = [
        ...bills.map((b) => ({
          id: `bill-${b.id}`,
          date: new Date(b.dueAt),
          title: b.name,
          amountPaise: b.amountPaise,
          type: "bill" as const,
        })),
        ...emis.map((e) => ({
          id: `emi-${e.id}`,
          date: new Date(e.nextDueAt),
          title: `${e.name} EMI`,
          amountPaise: e.emiAmountPaise,
          type: "emi" as const,
        })),
        ...subs.map((s) => ({
          id: `sub-${s.id}`,
          date: new Date(s.nextRenewalAt!),
          title: s.name,
          amountPaise: s.amountPaise,
          type: "subscription" as const,
        })),
      ];
      all.sort((a, b) => a.date.getTime() - b.date.getTime());
      return all;
    },
  );
  const [selected, setSelected] = useState(format(new Date(), "yyyy-MM-dd"));

  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const key = format(startOfDay(e.date), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  const selectedEvents = events.filter((e) => isSameDay(e.date, new Date(selected)));
  const upcoming = events.filter((e) => e.date >= startOfDay(new Date())).slice(0, 10);

  const icon = { bill: Receipt, emi: CreditCard, subscription: Repeat };
  const color = { bill: "text-destructive", emi: "text-primary", subscription: "text-muted-foreground" };

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title="Calendar"
        description="Upcoming bills, EMIs, and subscription renewals."
      />

      <DexiePageGate isPending={isPending} isError={isError} onRetry={() => refetch()} label="Loading calendar…">
      <div className="space-y-8">

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-5">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-muted-foreground">Jump to date</span>
              <input
                type="date"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-card px-3.5 text-sm"
              />
            </label>
            <div className="mt-4 space-y-2">
              {grouped.slice(0, 14).map(([day, items]) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelected(day)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    selected === day ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                >
                  <span>{format(new Date(day), "EEE, d MMM")}</span>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-4 font-semibold">{format(new Date(selected), "EEEE, d MMMM yyyy")}</h2>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing scheduled for this day.</p>
              ) : (
                <ul className="space-y-3">
                  {selectedEvents.map((e) => {
                    const Icon = icon[e.type];
                    return (
                      <li key={e.id} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                        <Icon size={18} className={color[e.type]} />
                        <div className="flex-1">
                          <p className="font-medium">{e.title}</p>
                          <p className="text-xs capitalize text-muted-foreground">{e.type}</p>
                        </div>
                        <span className="font-semibold tabular-nums">{formatINR(e.amountPaise)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="mb-4 font-semibold">Upcoming</h2>
              {upcoming.length === 0 ? (
                <EmptyState title="All clear" description="No upcoming payments scheduled." />
              ) : (
                <ul className="divide-y divide-border">
                  {upcoming.map((e) => {
                    const Icon = icon[e.type];
                    return (
                      <li key={e.id} className="flex items-center gap-3 py-3">
                        <Icon size={16} className={color[e.type]} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{e.title}</p>
                          <p className="text-xs text-muted-foreground">{format(e.date, "dd MMM yyyy")}</p>
                        </div>
                        <span className="text-sm tabular-nums font-medium">{formatINR(e.amountPaise)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
      </DexiePageGate>
    </PageContainer>
  );
}
