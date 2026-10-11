import { describe, expect, it } from 'vitest';
import { createZip } from '../../../src/shared/lib/zip';
import { cellRef, isDateFormat, readWorkbook, serialToIso, toObjects } from '../../../src/tools/excel-to-csv/features/excel-to-csv';

const enc = (s: string) => new TextEncoder().encode(s);
const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';

function xlsx(parts: Record<string, string>) {
  return createZip(Object.entries(parts).map(([name, s]) => ({ name, data: enc(s) })));
}

const workbook = (sheets: string) => ({
  'xl/workbook.xml': `<workbook ${NS} xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets}</sheets></workbook>`,
  'xl/_rels/workbook.xml.rels':
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="/xl/worksheets/sheet2.xml"/></Relationships>',
});

describe('readWorkbook', () => {
  it('reads shared strings, numbers, booleans, inline strings and dates', async () => {
    const sheets = await readWorkbook(
      xlsx({
        ...workbook('<sheet name="Data" sheetId="1" r:id="rId1"/><sheet name="Hidden" state="hidden" sheetId="2" r:id="rId2"/>'),
        'xl/sharedStrings.xml': `<sst ${NS}><si><t>Name</t></si><si><r><t>Ad</t></r><r><t>a</t></r></si><si><t>When</t></si></sst>`,
        'xl/styles.xml': `<styleSheet ${NS}><numFmts><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts><cellXfs><xf numFmtId="0"/><xf numFmtId="164"/><xf numFmtId="14"/></cellXfs></styleSheet>`,
        'xl/worksheets/sheet1.xml': `<worksheet ${NS}><sheetData>
          <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>2</v></c><c r="C1" t="inlineStr"><is><t>Ok</t></is></c></row>
          <row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2" s="1"><v>45292</v></c><c r="C2" t="b"><v>1</v></c><c r="E2"><v>3.5</v></c></row>
        </sheetData></worksheet>`,
        'xl/worksheets/sheet2.xml': `<worksheet ${NS}><sheetData><row r="1"><c r="A1" s="2"><v>45292.5</v></c></row></sheetData></worksheet>`,
      }),
    );
    expect(sheets.map((s) => [s.name, s.hidden])).toEqual([
      ['Data', false],
      ['Hidden', true],
    ]);
    expect(sheets[0].rows).toEqual([
      ['Name', 'When', 'Ok', '', ''],
      ['Ada', '2024-01-01', 'TRUE', '', '3.5'],
    ]);
    expect(sheets[1].rows).toEqual([['2024-01-01T12:00:00']]);
  });

  it('fills merged cells and drops trailing empties', async () => {
    const [s] = await readWorkbook(
      xlsx({
        ...workbook('<sheet name="M" sheetId="1" r:id="rId1"/>'),
        'xl/worksheets/sheet1.xml': `<worksheet ${NS}><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>X</t></is></c></row><row r="3"/></sheetData><mergeCells><mergeCell ref="A1:B2"/></mergeCells></worksheet>`,
      }),
    );
    expect(s.rows).toEqual([
      ['X', 'X'],
      ['X', 'X'],
    ]);
  });

  it('rejects legacy .xls and non-zip files with a clear message', async () => {
    await expect(readWorkbook(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0, 0]))).rejects.toThrow(/legacy \.xls/);
    await expect(readWorkbook(enc('hello'))).rejects.toThrow(/Not a readable \.xlsx/);
  });
});

describe('helpers', () => {
  it('parses cell references', () => {
    expect(cellRef('A1')).toEqual([0, 0]);
    expect(cellRef('AB10')).toEqual([9, 27]);
    expect(cellRef('a1')).toBeNull();
  });

  it('detects date formats and converts serials', () => {
    expect(isDateFormat('yyyy-mm-dd')).toBe(true);
    expect(isDateFormat('"Day"0.00')).toBe(false);
    expect(isDateFormat('[Red]0.00')).toBe(false);
    expect(serialToIso(1)).toBe('1899-12-31');
    expect(serialToIso(0, true)).toBe('1904-01-01');
  });

  it('builds objects with unique keys', () => {
    expect(toObjects([['a', 'a', ''], ['1', '2', '3']])).toEqual([{ a: '1', a_2: '2', column_3: '3' }]);
  });
});
