import { describeClaims, tokenStatus, type TokenStatus } from '../features/claims';
import type { JsonObject } from '../features/jwt';
import { Panel } from '../../../shared/ui/Panel';
import { Badge } from '../../../shared/ui/ui';

const STATUS_BADGE: Record<TokenStatus, { tone: 'green' | 'red' | 'amber'; label: string }> = {
  valid: { tone: 'green', label: 'Valid' },
  expired: { tone: 'red', label: 'Expired' },
  'not-yet-valid': { tone: 'amber', label: 'Not yet valid' },
};

export function ClaimsPanel({ payload, now }: { payload: JsonObject; now: number }) {
  const rows = describeClaims(payload, now);
  const status = STATUS_BADGE[tokenStatus(payload, now)];
  const hasTiming = 'exp' in payload || 'nbf' in payload;

  return (
    <Panel eyebrow="Claims" icon="info">
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
        <Badge tone={status.tone}>{status.label}</Badge>
        {!('exp' in payload) && <span>No expiry (exp) claim: this token never expires on its own.</span>}
        {hasTiming && <span>Based on your device clock.</span>}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">The payload has none of the registered claims (iss, sub, aud, exp, nbf, iat, jti).</p>
      ) : (
        <dl className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((r) => (
            <div key={r.name} className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
              <dt>
                <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{r.name}</span>
                <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">{r.label}</span>
              </dt>
              <dd className="min-w-0 space-y-1">
                {r.time ? (
                  <p className="text-sm text-slate-900 dark:text-slate-100">
                    {r.time.date} <span className="text-slate-500 dark:text-slate-400">({r.time.relative})</span>
                    <span className="ml-2 font-mono text-xs text-slate-400">{r.value}</span>
                  </p>
                ) : (
                  <p className="break-all font-mono text-sm text-slate-900 dark:text-slate-100">{r.value}</p>
                )}
                {r.note && <p className="text-sm text-amber-700 dark:text-amber-300">{r.note}</p>}
                <p className="text-sm text-slate-500 dark:text-slate-400">{r.description}</p>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </Panel>
  );
}
