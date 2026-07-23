"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Award, Receipt, Target, PiggyBank, TrendingUp, Shield, HardDrive, Flame, List, LineChart,
} from "lucide-react";
import { PageHeader, PageContainer, EmptyState } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { cn } from "@/lib/design/cn";
import { Progress } from "@/components/ui/progress";

const ICONS: Record<string, typeof Award> = {
  Award, Receipt, Target, PiggyBank, TrendingUp, Shield, HardDrive, Flame, List, LineChart,
};

export default function AchievementsPage() {
  const { data: achievements = [] } = useQuery({
    queryKey: ["achievements"],
    queryFn: () => db.achievements.toArray(),
  });

  const unlocked = achievements.filter((a) => a.unlockedAt).length;

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        eyebrow="Milestones"
        title="Achievements & Milestones"
        description={`${unlocked} of ${achievements.length} milestones unlocked.`}
      />

      {achievements.length === 0 ? (
        <EmptyState
          title="No milestones yet"
          description="Track transactions, hit savings goals, and stay consistent to unlock achievements."
        />
      ) : (
      <div className="grid gap-4 sm:grid-cols-2">
        {achievements.map((a) => {
          const Icon = ICONS[a.iconName] ?? Award;
          const pct = Math.min(100, Math.round((a.progress / a.target) * 100));
          const done = Boolean(a.unlockedAt);

          return (
            <Card key={a.id} className={cn(done && "border-primary/30 bg-primary/5")}>
              <CardContent className="flex gap-4 p-5">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                    done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{a.title}</p>
                    {done && <Badge variant="outline">Unlocked</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{a.description}</p>
                  {!done && (
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{pct}%</span>
                      </div>
                      <Progress value={pct} max={100} size="sm" className="mt-1" />
                    </div>
                  )}
                  {done && a.unlockedAt && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Unlocked {new Date(a.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}
    </PageContainer>
  );
}
