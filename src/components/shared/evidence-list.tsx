import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Evidence } from "@/lib/data-client/types";
import { SourceBadge } from "./source-badge";

export function EvidenceList({ evidence }: { evidence: Evidence[] }) {
  if (!evidence.length) return null;
  return (
    <section className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800" aria-label="Source evidence">
      <p className="eyebrow mb-3">Source-backed facts</p>
      <div className="grid gap-2">
        {evidence.map((item) => {
          const content = (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <SourceBadge source={item.source} />
                <span className="font-medium text-slate-900 dark:text-white">{item.title}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.excerpt}</p>
            </>
          );
          return item.workItemId ? (
            <Link key={item.id} href={`/work/${item.workItemId}`} className="evidence-card focus-ring">
              {content}
            </Link>
          ) : item.sourceUrl ? (
            <a key={item.id} href={item.sourceUrl} target="_blank" rel="noreferrer" className="evidence-card focus-ring">
              {content}
              <ExternalLink className="absolute right-3 top-3 text-slate-400" size={14} aria-hidden="true" />
            </a>
          ) : (
            <div key={item.id} className="evidence-card">{content}</div>
          );
        })}
      </div>
    </section>
  );
}
