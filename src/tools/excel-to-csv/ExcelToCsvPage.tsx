import { useState } from 'react';
import excelToCsv from './index';
import { readWorkbook, toObjects, type Sheet } from './features/excel-to-csv';
import { writeCsv } from '../../shared/lib/csv';
import { createZip } from '../../shared/lib/zip';
import { FilePickerButton } from '../../shared/ui/ImageBatch';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, Segmented } from '../../shared/ui/tool';
import { Button } from '../../shared/ui/ui';
import { downloadBlob, downloadText } from '../../shared/utils/dom.utils';

type Format = 'csv' | 'tsv' | 'json';
const PREVIEW_ROWS = 200;
const card = 'rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const MIME: Record<Format, string> = { csv: 'text/csv', tsv: 'text/tab-separated-values', json: 'application/json' };

function render(sheet: Sheet, format: Format, header: boolean): string {
  if (format === 'json') return JSON.stringify(header ? toObjects(sheet.rows) : sheet.rows, null, 2);
  return writeCsv(sheet.rows, { delimiter: format === 'tsv' ? '\t' : ',', newline: '\r\n' });
}

export default function ExcelToCsvPage() {
  const [file, setFile] = useState<{ name: string; sheets: Sheet[] } | null>(null);
  const [active, setActive] = useState(0);
  const [format, setFormat] = useState<Format>('csv');
  const [header, setHeader] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const open = async ([f]: File[]) => {
    if (!f) return;
    setBusy(true);
    setError('');
    try {
      const sheets = await readWorkbook(new Uint8Array(await f.arrayBuffer()));
      setFile({ name: f.name.replace(/\.xlsx?m?$/i, ''), sheets });
      setActive(0);
    } catch (e) {
      setFile(null);
      setError(e instanceof Error ? e.message : 'Could not read this file.');
    } finally {
      setBusy(false);
    }
  };

  const sheet = file?.sheets[active];
  const ext = format;
  const saveOne = () => sheet && downloadText(render(sheet, format, header), `${file!.name}-${sheet.name}.${ext}`, MIME[format]);
  const saveAll = () => {
    if (!file) return;
    const enc = new TextEncoder();
    const zip = createZip(file.sheets.map((s) => ({ name: `${s.name}.${ext}`, data: enc.encode(render(s, format, header)) })));
    downloadBlob(new Blob([zip as Uint8Array<ArrayBuffer>], { type: 'application/zip' }), `${file.name}.zip`);
  };

  return (
    <div className="space-y-8">
      <Breadcrumb tool={excelToCsv} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="CSV">Excel to </Headline>
        <FilePickerButton onFiles={open} multiple={false} accept=".xlsx,.xlsm" label="Choose an .xlsx file" />
      </div>
      <StatusStrip
        status={busy ? 'Reading the workbook…' : file ? `${file.sheets.length} sheet${file.sheets.length === 1 ? '' : 's'} in ${file.name}.xlsx` : 'Open an Excel .xlsx file. It never leaves your device.'}
        tone={busy ? 'busy' : file ? 'good' : 'neutral'}
      />
      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      {file && sheet && (
        <>
          <section aria-label="Export options" className={`flex flex-wrap items-end gap-4 ${card}`}>
            <Select
              label="Sheet"
              options={file.sheets.map((s, i) => ({ value: i, label: s.hidden ? `${s.name} (hidden)` : s.name }))}
              value={active}
              onChange={setActive}
            />
            <Segmented
              label="Format"
              options={[
                { value: 'csv', label: 'CSV' },
                { value: 'tsv', label: 'TSV' },
                { value: 'json', label: 'JSON' },
              ]}
              value={format}
              onChange={setFormat}
            />
            {format === 'json' && (
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={header} onChange={(e) => setHeader(e.target.checked)} />
                First row is the header
              </label>
            )}
            <Button onClick={saveOne}>Download {sheet.name}</Button>
            {file.sheets.length > 1 && (
              <Button variant="secondary" onClick={saveAll}>
                Download all sheets (ZIP)
              </Button>
            )}
          </section>

          <div tabIndex={0} role="region" aria-label={`Preview of ${sheet.name}`} className={`max-h-[32rem] overflow-auto ${card}`}>
            {sheet.rows.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">This sheet is empty.</p>
            ) : (
              <table className="text-left text-sm">
                <tbody className="divide-y divide-slate-100 text-slate-800 dark:divide-slate-800 dark:text-slate-200">
                  {sheet.rows.slice(0, PREVIEW_ROWS).map((r, i) => (
                    <tr key={i}>
                      {r.map((c, j) => (
                        <td key={j} className="max-w-xs truncate border-r border-slate-100 px-2 py-1 dark:border-slate-800">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {sheet.rows.length > PREVIEW_ROWS && (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                Showing the first {PREVIEW_ROWS} of {sheet.rows.length.toLocaleString()} rows. Downloads include every row.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
