import { TrendingUp, Check } from "lucide-react";

interface ProgressItem {
  prodName: string;
  total: number;
}

interface Product {
  name: string;
  moq: number;
}

interface ProgressBoardProps {
  progress: ProgressItem[];
  products: Product[];
}

export function ProgressBoard({ progress, products }: ProgressBoardProps) {
  if (!progress || progress.length === 0) {
    return (
      <section className="mb-6 rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
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
    <section className="mb-6 rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
        <TrendingUp className="h-5 w-5 text-primary" />
        集結中！開團還差多少？
      </h3>

      <div className="grid gap-4">
        {progress.map((item) => {
          const prod = products.find((p) => p.name === item.prodName);
          const moq = prod?.moq ?? 1;
          const percent = Math.min((item.total / moq) * 100, 100);
          const isComplete = item.total >= moq;

          return (
            <div key={item.prodName} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-card-foreground truncate pr-2">
                  {item.prodName}
                </span>
                <span
                  className={`flex items-center gap-1 font-semibold ${
                    isComplete ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {isComplete && <Check className="h-3.5 w-3.5" />}
                  {item.total} / {moq}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`progress-bar-fill h-full rounded-full ${
                    isComplete ? "bg-primary" : "bg-secondary"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
