import Link from "next/link";
import { category } from "@/lib/catalog";
import { money, num, relativeDate } from "@/lib/format";
import { RequestStatus } from "./ui";

export interface RequestCardData {
  id: string;
  title: string;
  category: string;
  status: string;
  estimatedHours: number;
  monthlyLoss: number;
  createdAt: Date;
  company: { name: string; city: string };
  assigneeName?: string | null;
}

export function RequestCard({ r, matchedSkills, distanceKm, highlight, invited }: {
  r: RequestCardData;
  matchedSkills?: string[];
  distanceKm?: number;
  highlight?: boolean;
  invited?: boolean;
}) {
  return (
    <Link href={`/demandas/${r.id}`} className={`card grid content-start gap-3 transition hover:border-accent ${highlight ? "border-accent" : ""}`}>
      {invited && <p className="text-[11px] font-bold uppercase tracking-wider text-accent">Você foi convidado(a)</p>}
      <div className="flex items-center justify-between gap-2">
        <span className="label">{category(r.category).label}</span>
        <RequestStatus status={r.status} />
      </div>
      <p className="font-semibold leading-snug">{r.title}</p>
      <p className="text-sm text-muted">
        {r.company.name} · {r.company.city}
        {distanceKm !== undefined && ` · ${num(distanceKm, 0)} km`}
      </p>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div><dt className="text-muted">Prejuízo da empresa</dt><dd className="num text-sm">{money(r.monthlyLoss * 12)}/ano</dd></div>
        <div><dt className="text-muted">Esforço estimado</dt><dd className="num text-sm">{r.estimatedHours} h de extensão</dd></div>
      </dl>
      {matchedSkills && (
        <div className="flex flex-wrap gap-1">
          {matchedSkills.length ? matchedSkills.map((s) => <span key={s} className="tag tag-hit">{s}</span>) : <span className="text-xs text-muted">Fora das suas áreas</span>}
        </div>
      )}
      <p className="text-xs text-muted">{r.assigneeName ? `Com ${r.assigneeName}` : `Publicada ${relativeDate(r.createdAt)}`}</p>
    </Link>
  );
}
