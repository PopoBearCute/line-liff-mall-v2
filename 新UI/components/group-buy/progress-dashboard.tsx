"use client";

import { TrendingUp, Check, Flame, Target } from "lucide-react";

interface ProgressItem {
  prodName: string;
  total: number;
}

interface Product {
  name: string;
  moq: number;
}

interface ProgressDashboardProps {
  progress: ProgressItem[];
  products: Product[];
}

export function ProgressDashboard({ progress, products }: ProgressDashboardProps) {
  const totalItems = progress.reduce((acc, item) => acc + item.total, 0);
  const completedCount = progress.filter((item) => {
    const prod = products.find((p) => p.name === item.prodName);
    return prod && item.total >= prod.moq;
  }).length;

  if (!progress || progress.length === 0) {
    return (
      <section id="leader-board" className="glass-card card-hover mb-6 rounded-3xl p-5">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
          <TrendingUp className="h-5 w-5 text-primary" />
          集結中！開團還差多少？
        </h3>
        <p className="text-center text-sm text-muted-foreground">
          目前尚未有人表態
        </p>
      </section>
    );
  }

  return (
    <section id="leader-board" className="glass-card card-hover mb-6 rounded-3xl p-5">
      {/* Dashboard Header with Stats */}
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          團購進度
        </h3>
        <div className="flex gap-3">
          <div className="flex flex-col items-center rounded-xl bg-muted/50 px-3 py-1.5">
            <span className="text-lg font-bold text-foreground">{totalItems}</span>
            <span className="text-[10px] text-muted-foreground">總登記</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-primary/10 px-3 py-1.5">
            <span className="text-lg font-bold text-primary">{completedCount}</span>
            <span className="text-[10px] text-muted-foreground">可成團</span>
          </div>
        </div>
      </div>

      {/* Progress Items */}
      <div className="space-y-4">
        {progress.map((item, index) => {
          const prod = products.find((p) => p.name === item.prodName);
          const moq = prod?.moq ?? 1;
          const percent = Math.min((item.total / moq) * 100, 100);
          const isComplete = item.total >= moq;
          const remaining = Math.max(0, moq - item.total);

          return (
            <div key={item.prodName} className="group">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {index === 0 && !isComplete && (
                    <Flame className="h-4 w-4 text-accent" />
                  )}
                  <span className="text-sm font-semibold text-foreground line-clamp-1">
                    {item.prodName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      <Check className="h-3 w-3" />
                      可成團
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Target className="h-3 w-3" />
                      還差 {remaining} 份
                    </span>
                  )}
                </div>
              </div>

              {/* Enhanced Progress Bar */}
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className={`progress-bar-fill h-full rounded-full transition-all duration-700 ${isComplete
                      ? "bg-gradient-to-r from-primary to-primary/80 progress-glow"
                      : "bg-gradient-to-r from-secondary/80 to-secondary/60"
                    }`}
                  style={{ width: `${percent}%` }}
                />
                {/* Progress indicator dots */}
                <div className="absolute inset-0 flex items-center justify-end pr-1">
                  <span className="text-[10px] font-bold text-white drop-shadow-sm">
                    {item.total}/{moq}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
