import Link from "next/link";
import { category } from "@/lib/catalog";
import { money, num, pct, relativeDate } from "@/lib/format";
import { RequestStatusBadge } from "./domain";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Avatar, Progress } from "./ui/misc";

function summary(b: string) {
  const lines = b.split("\n").map((l) => l.trim()).filter(Boolean);
  const i = lines.indexOf("O que precisamos");
  return i >= 0 && lines[i + 1] ? lines[i + 1] : lines[0];
}

export interface RequestCardData {
  id: string; title: string; category: string; briefing: string; estimatedHours: number; monthlyLoss: number; status: string; createdAt: Date;
  company: { name: string; city: string };
}

export function RequestCard({ r, fit, matchedSkills, distanceKm, invited }: { r: RequestCardData; fit?: number; matchedSkills?: string[]; distanceKm?: number; invited?: boolean }) {
  return (
    <Link href={`/demandas/${r.id}`} className="group block">
      <Card className="flex h-full flex-col p-4 transition group-hover:border-foreground/20 group-hover:shadow-card">
        <div className="flex items-start gap-3">
          <Avatar name={r.company.name} square size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-medium leading-snug">{r.title}</p>
            <p className="text-xs text-muted-foreground">{r.company.name} · {r.company.city}{distanceKm !== undefined ? ` · ${num(distanceKm)} km` : ""}</p>
          </div>
          {invited ? <Badge tone="brand" dot>Convite</Badge> : <RequestStatusBadge status={r.status} />}
        </div>
        <p className="mt-3 line-clamp-2 text-[13px] text-muted-foreground">{summary(r.briefing)}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {category(r.category).skills.map((s) => <Badge key={s} tone={matchedSkills?.includes(s) ? "brand" : "outline"}>{s}</Badge>)}
        </div>
        <div className="mt-auto grid gap-3 pt-4">
          {fit !== undefined && (
            <div className="grid gap-1">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Aderência às suas áreas</span><span className="tabular font-medium">{pct(fit)}</span></div>
              <Progress value={fit * 100} />
            </div>
          )}
          <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <span><b className="tabular text-foreground">{money(r.monthlyLoss)}</b>/mês em jogo</span>
            <span>{r.estimatedHours} h · {relativeDate(r.createdAt)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
