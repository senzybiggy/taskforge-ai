import type { ReactNode } from 'react';
import { ExternalLink, FileText, ShieldAlert } from 'lucide-react';
import { DeliverableProjects } from '@/components/coordinator/DeliverableProjects';
import { Badge } from '@/components/ui/Badge';
import { Panel } from '@/components/ui/Panel';
import { formatDate } from '@/lib/format';
import type { Deliverable } from '@/types/domain';

interface DeliverableReviewProps {
  deliverable: Deliverable;
}

export function DeliverableReview({ deliverable }: DeliverableReviewProps) {
  return (
    <Panel className="p-6 sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-blue-300">
          <FileText className="h-3.5 w-3.5" />
          Simulated deliverable
        </div>
        <Badge tone="amber">Simulated demo</Badge>
        {deliverable.reviewedAt ? (
          <Badge tone="emerald">Reviewed {formatDate(deliverable.reviewedAt)}</Badge>
        ) : (
          <Badge tone="blue" dot>Awaiting your review</Badge>
        )}
      </div>
      <h2 className="mt-3 font-display text-xl font-semibold leading-snug text-white">{deliverable.title}</h2>
      <p className="mt-1 text-sm text-slate-400">
        Prepared by {deliverable.agentName} on {formatDate(deliverable.generatedAt)}
      </p>

      <div role="note" className="mt-5 flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-500/[0.06] p-4 text-sm leading-relaxed text-amber-100">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        {deliverable.disclaimer}
      </div>

      <div className="mt-6 flex flex-col gap-7">
        <ReportSection title="Summary">
          <p className="text-sm leading-relaxed text-slate-300">{deliverable.summary}</p>
        </ReportSection>

        <ReportSection title="Method">
          <BulletList items={deliverable.method} />
        </ReportSection>

        {deliverable.projects.length > 0 && (
          <ReportSection title={`Projects reviewed (${deliverable.projects.length})`}>
            <DeliverableProjects projects={deliverable.projects} />
          </ReportSection>
        )}

        {deliverable.comparison.length > 0 && (
          <ReportSection title="Comparison">
            <BulletList items={deliverable.comparison} />
          </ReportSection>
        )}

        <ReportSection title="Recommendations">
          <BulletList items={deliverable.recommendations} />
        </ReportSection>

        {deliverable.sources.length > 0 && (
          <ReportSection title="Sources">
            <ul className="flex flex-col gap-2">
              {deliverable.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-300 underline-offset-4 transition-colors hover:text-blue-200 hover:underline"
                  >
                    {source.title}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </ReportSection>
        )}
      </div>
    </Panel>
  );
}

function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-white/[0.06] pt-6">
      <h3 className="font-display text-base font-semibold text-white">{title}</h3>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2 text-sm leading-relaxed text-slate-300">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
