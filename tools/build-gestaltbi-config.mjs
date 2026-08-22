#!/usr/bin/env node
/**
 * Build the GestaltBI six-file config bundle from the Everpix metric CSVs.
 *
 *   node tools/build-gestaltbi-config.mjs
 *
 * Writes data.csv, mapping.json, structure.json, processing.json, modes.json
 * and it.json to the repo root, where the gestaltbi-core client reads them
 * over jsDelivr:
 *
 *   https://gestaltbi.github.io/gestaltbi-core/gh/sirmmo/everpix-intelligence
 *
 * Re-run after changing anything under Internal Metrics/ or External Metrics/.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- CSV in ------------------------------------------------------------------
const splitLine = (line) => {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
};
const readCsv = (rel) => {
  const [head, ...body] = readFileSync(join(ROOT, rel), 'utf8').replace(/^﻿/, '').trim().split(/\r?\n/);
  const cols = splitLine(head);
  return body.filter(Boolean).map((l) => Object.fromEntries(splitLine(l).map((c, i) => [cols[i], c])));
};
const IM = (f) => join('Internal Metrics', f);
const key = (rows, k = 'Date') => Object.fromEntries(rows.map((r) => [r[k], r]));
const n = (v) => { if (v === undefined || v === null || v === '') return ''; const x = parseFloat(v); return Number.isFinite(x) ? x : ''; };
const add = (...xs) => { const v = xs.map(n).filter((x) => x !== ''); return v.length ? v.reduce((a, b) => a + b, 0) : ''; };

/**
 * Serialize a number the way the client's `cleanNumber()` expects.
 *
 * ngx-papaparse runs with `header: true` and no `dynamicTyping`, so every cell
 * reaches the pipeline as a string and `format` parses it with an Italian
 * reader: it drops the FIRST '.' as a thousands separator, then reads ',' as
 * the decimal point. A plain US "642.1" would therefore become 6421.
 * Emit a comma decimal, never a thousands separator, and quote it so the comma
 * cannot be mistaken for a field break.
 */
const cell = (v, dp = 2) => {
  if (v === '' || v === null || v === undefined) return '';
  const r = Number(v.toFixed(dp));
  if (Number.isInteger(r)) return String(r);
  return '"' + r.toFixed(dp).replace('.', ',') + '"';
};

const MONTHS = ['Sep-12','Oct-12','Nov-12','Dec-12','Jan-13','Feb-13','Mar-13','Apr-13','May-13','Jun-13','Jul-13','Aug-13','Sep-13','Oct-13'];
const MN = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 };
const iso = (m) => { const [mm, yy] = m.split('-'); return `20${yy}-${String(MN[mm]).padStart(2, '0')}-01`; };

const users = key(readCsv(IM('KPIs (Users).csv')));
const newU = key(readCsv(IM('KPIs (New Users).csv')));
const subs = key(readCsv(IM('KPIs (Subscribers - Peak During Month).csv')));
const cash = key(readCsv(IM('KPIs (Sales Volume - Minus Processing Fees and Refunds).csv')));
const rec = key(readCsv(IM('KPIs (Revenues in Sales Recognition Basis - Minus Processing Fees and Refunds).csv')));
const aws = key(readCsv(IM('KPIs (AWS Costs - Production System Only).csv')));
const s3 = key(readCsv(IM('System AWS Costs (S3 TiB per Month).csv')));
const rate = key(readCsv(IM('KPIs (User Subscription Rate).csv')));
const freeAct = key(readCsv(IM('KPIs (Free Users Visiting Website or iOS App - % of Monthly Signup Cohorts).csv')));
const subAct = key(readCsv(IM('KPIs (Subscribed Users Visiting Website or iOS App - % of Monthly Signup Cohorts).csv')));
const photos = key(readCsv(IM('KPIs (New Photos Synced - Millions).csv')));
const traffic = key(readCsv(join('External Metrics', 'Monthly Website Traffic.csv')), 'Month Index');

const press = {};
for (const r of readCsv('Press Coverage.csv')) {
  const p = (r.Date || '').split(/\s+/);
  if (p.length === 3) { const k = `${p[1]}-${p[2]}`; press[k] = (press[k] || 0) + 1; }
}

// --- data.csv ----------------------------------------------------------------
// Raw, human-readable headers; mapping.json renames them to canonical codes.
const HEADERS = ['id','Month','Users','Subscribers','New Users','Cash Sales','Recognized Revenue','AWS Cost',
  'Storage TiB','New Photos','Subscription Rate','Subscription Rate 1k','Subscription Rate 10k',
  'Free Active 30d','Subscribers Active 30d','Website Visits','Press Articles'];

const rows = MONTHS.map((m, i) => [
  String(i + 1),
  iso(m),
  cell(n(users[m]?.Signups), 0),
  cell(n(subs[m]?.Count), 0),
  cell(n(newU[m]?.Count), 0),
  cell(add(cash[m]?.['Stripe Yearly'], cash[m]?.['Stripe Monthly'], cash[m]?.['Apple Monthly'])),
  cell(add(rec[m]?.['Stripe Yearly'], rec[m]?.['Stripe Monthly'], rec[m]?.['Apple Monthly'])),
  cell(n(aws[m]?.Cost)),
  cell(s3[m] ? add(s3[m].Normal, s3[m].RRS) : '', 1),
  cell(n(photos[m]?.Delta), 1),
  cell(n(rate[m]?.All), 4), cell(n(rate[m]?.['1000+ Photos']), 4), cell(n(rate[m]?.['10000+ Photos']), 4),
  cell(n(freeAct[m]?.['Last 30 Days']), 4), cell(n(subAct[m]?.['Last 30 Days']), 4),
  cell(n(traffic[m]?.Visits), 0),
  String(press[m] ?? 0),
]);
const dataCsv = [HEADERS.join(','), ...rows.map((r) => r.join(','))].join('\n') + '\n';

// --- canonical codes ---------------------------------------------------------
const C = {
  date: 'uatu:date',
  users: 'everpix:users', subs: 'everpix:subscribers', newUsers: 'everpix:new_users',
  cash: 'everpix:cash_sales', rec: 'everpix:recognized_revenue', aws: 'everpix:aws_cost',
  tib: 'everpix:storage_tib', photos: 'everpix:new_photos',
  rateAll: 'everpix:sub_rate', rate1k: 'everpix:sub_rate_1k', rate10k: 'everpix:sub_rate_10k',
  freeAct: 'everpix:free_active', subAct: 'everpix:sub_active',
  visits: 'everpix:visits', press: 'everpix:press',
};
const CALC = {
  marginAccrual: 'everpix:calc:margin_accrual', marginCash: 'everpix:calc:margin_cash',
  deferred: 'everpix:calc:deferred',
  cumRec: 'everpix:calc:cum_recognized', cumAws: 'everpix:calc:cum_aws',
  cumMargin: 'everpix:calc:cum_margin', cumDeferred: 'everpix:calc:cum_deferred',
};

const mapping = { type: 'mapping', version: '1', name: 'everpix', columns: [
  { column: 'id', target: 'id' },
  { column: 'Month', target: C.date },
  { column: 'Users', target: C.users },
  { column: 'Subscribers', target: C.subs },
  { column: 'New Users', target: C.newUsers },
  { column: 'Cash Sales', target: C.cash },
  { column: 'Recognized Revenue', target: C.rec },
  { column: 'AWS Cost', target: C.aws },
  { column: 'Storage TiB', target: C.tib },
  { column: 'New Photos', target: C.photos },
  { column: 'Subscription Rate', target: C.rateAll },
  { column: 'Subscription Rate 1k', target: C.rate1k },
  { column: 'Subscription Rate 10k', target: C.rate10k },
  { column: 'Free Active 30d', target: C.freeAct },
  { column: 'Subscribers Active 30d', target: C.subAct },
  { column: 'Website Visits', target: C.visits },
  { column: 'Press Articles', target: C.press },
]};

// --- structure.json ----------------------------------------------------------
const MEAS = 'uatu:measure', AGGABLE = 'uatu:aggregable', AGG = 'uatu:aggregate';
const USD = 'number:currency';
// One CSV row per month and we group by month, so sum/avg/last coincide; `sum`
// is used for flows and `last` for levels so the intent survives a coarser grain.
const flow = (col, target, type = 'number') => [
  { column: col, type, tags: ['sbi:i:mappable', MEAS, AGGABLE], aggregation: [{ type: 'sum', target }] },
  { column: target, type, tags: [MEAS, AGG, 'uatu:aggregate:long', 'uatu:aggregate:point'] },
];
const level = (col, target, type = 'number') => [
  { column: col, type, tags: ['sbi:i:mappable', MEAS, AGGABLE], aggregation: [{ type: 'last', target }] },
  { column: target, type, tags: [MEAS, AGG, 'uatu:aggregate:long', 'uatu:aggregate:point'] },
];
const ratio = (col, target) => [
  { column: col, type: 'number', tags: ['sbi:i:mappable', MEAS, AGGABLE], aggregation: [{ type: 'avg', target }] },
  { column: target, type: 'number', tags: [MEAS, AGG] },
];
const calc = (col, type = USD, extra = []) => ({ column: col, type, tags: [MEAS, AGG, ...extra] });

const structure = { type: 'structure', version: '1', name: 'everpix', columns: [
  { column: 'id', type: 'int', multi: false, required: true, tags: ['uatu:id'] },
  { column: C.date, type: 'date', multi: false, required: true,
    tags: ['sbi:i:mappable', 'uatu:date', 'gcx:date', 'uatu:timedimension', 'uatu:dimension:time'] },

  ...flow(C.cash, `${C.cash}:sum`, USD),
  ...flow(C.rec, `${C.rec}:sum`, USD),
  ...flow(C.aws, `${C.aws}:sum`, USD),
  ...flow(C.newUsers, `${C.newUsers}:sum`),
  ...flow(C.photos, `${C.photos}:sum`),
  ...flow(C.visits, `${C.visits}:sum`),
  ...flow(C.press, `${C.press}:sum`),

  ...level(C.users, `${C.users}:last`),
  ...level(C.subs, `${C.subs}:last`),
  ...level(C.tib, `${C.tib}:last`),

  ...ratio(C.rateAll, `${C.rateAll}:avg`),
  ...ratio(C.rate1k, `${C.rate1k}:avg`),
  ...ratio(C.rate10k, `${C.rate10k}:avg`),
  ...ratio(C.freeAct, `${C.freeAct}:avg`),
  ...ratio(C.subAct, `${C.subAct}:avg`),

  // Row-level derivations, aggregated alongside the rest.
  { column: CALC.marginAccrual, type: USD, tags: [MEAS, AGGABLE], aggregation: [{ type: 'sum', target: `${CALC.marginAccrual}:sum` }] },
  { column: `${CALC.marginAccrual}:sum`, type: USD, tags: [MEAS, AGG, 'uatu:aggregate:long', 'uatu:aggregate:point'] },
  { column: CALC.marginCash, type: USD, tags: [MEAS, AGGABLE], aggregation: [{ type: 'sum', target: `${CALC.marginCash}:sum` }] },
  { column: `${CALC.marginCash}:sum`, type: USD, tags: [MEAS, AGG, 'uatu:aggregate:long', 'uatu:aggregate:point'] },
  { column: CALC.deferred, type: USD, tags: [MEAS, AGGABLE], aggregation: [{ type: 'sum', target: `${CALC.deferred}:sum` }] },
  { column: `${CALC.deferred}:sum`, type: USD, tags: [MEAS, AGG] },

  // Cumulatives, computed after aggregation.
  calc(CALC.cumRec, USD, ['uatu:aggregate:long']),
  calc(CALC.cumAws, USD, ['uatu:aggregate:long']),
  calc(CALC.cumMargin, USD, ['uatu:aggregate:long', 'uatu:aggregate:change']),
  calc(CALC.cumDeferred, USD, ['uatu:aggregate:long']),
]};

// --- processing.json ---------------------------------------------------------
const noop = (options) => ({ op: 'noop', options });
const processing = { type: 'processing', version: '1', name: 'everpix', process: {
  format_dates: { op: 'format', options: { dateTag: 'uatu:date', dateFormat: 'YYYY-MM-DD', numberTag: MEAS } },
  clear: { op: 'clear', require: ['format_dates'] },
  globalfilter: { op: 'globalfilter', require: ['clear'] },
  localfilter: { op: 'localfilter', require: ['globalfilter'] },

  pre_agg_enhance: { op: 'enhance', require: ['localfilter'], options: { nullSafe: true, columns: [
    { column: CALC.marginAccrual, calculate: 'expr', expr: ['-', C.rec, C.aws] },
    { column: CALC.marginCash, calculate: 'expr', expr: ['-', C.cash, C.aws] },
    { column: CALC.deferred, calculate: 'expr', expr: ['-', C.cash, C.rec] },
  ]}},

  date_agg: { op: 'aggregate', require: ['pre_agg_enhance'], options: { groupby: [C.date] } },

  enhance: { op: 'enhance', require: ['date_agg'], options: { cumulateOn: [C.date], columns: [
    { column: CALC.cumRec, calculate: 'func', func: 'cumsum', on: [`${C.rec}:sum`] },
    { column: CALC.cumAws, calculate: 'func', func: 'cumsum', on: [`${C.aws}:sum`] },
    { column: CALC.cumMargin, calculate: 'func', func: 'cumsum', on: [`${CALC.marginAccrual}:sum`] },
    { column: CALC.cumDeferred, calculate: 'func', func: 'cumsum', on: [`${CALC.deferred}:sum`] },
  ]}},

  // Mode entry points. Everpix has no geography, so the map views resolve to
  // the same frame and render empty rather than erroring.
  longtable: { op: 'clear', require: ['enhance'] },
  longgraph: { op: 'clear', require: ['enhance'] },
  longmap: { op: 'clear', require: ['enhance'] },
  pointtable: { op: 'clear', require: ['enhance'] },
  pointgraph: { op: 'clear', require: ['enhance'] },
  pointmap: { op: 'clear', require: ['enhance'] },

  conf_basegraph: noop({ prefixes: ['baseA', 'baseB'],
    startingDynamicMeasure: `${C.rec}:sum`, startingFixedMeasure: `${C.aws}:sum` }),
  conf_longgraph: noop({ name: '', prefixes: ['longA', 'longB'], revenue: CALC.cumRec, rows: [] }),
  conf_pointgraph: noop({ name: '', prefixes: ['pointA', 'pointB'], revenue: CALC.cumRec, rows: [] }),
  conf_longtable: noop({ columnDefs: [
    { headerName: 'Month', sortable: true, field: C.date, formatter: 'date' },
    { headerName: 'Recognized revenue', field: `${C.rec}:sum` },
    { headerName: 'Cash sales', field: `${C.cash}:sum` },
    { headerName: 'AWS cost', field: `${C.aws}:sum` },
    { headerName: 'Margin (accrual)', field: `${CALC.marginAccrual}:sum` },
    { headerName: 'Margin (cash)', field: `${CALC.marginCash}:sum` },
    { headerName: 'Deferred revenue', field: `${CALC.cumDeferred}` },
    { headerName: 'Users', field: `${C.users}:last`, formatter: 'floatamount' },
    { headerName: 'Subscribers', field: `${C.subs}:last`, formatter: 'floatamount' },
    { headerName: 'Storage TiB', field: `${C.tib}:last`, formatter: 'floatamount' },
  ]}),
  conf_pointtable: noop({ columnDefs: [
    { headerName: 'Month', sortable: true, field: C.date, formatter: 'date' },
    { headerName: 'New users', field: `${C.newUsers}:sum`, formatter: 'floatamount' },
    { headerName: 'New photos (M)', field: `${C.photos}:sum`, formatter: 'floatamount' },
    { headerName: 'Website visits', field: `${C.visits}:sum`, formatter: 'floatamount' },
    { headerName: 'Press articles', field: `${C.press}:sum`, formatter: 'floatamount' },
    { headerName: 'Subscription rate', field: `${C.rateAll}:avg` },
    { headerName: 'Free active 30d', field: `${C.freeAct}:avg` },
  ]}),
}};

// --- modes.json --------------------------------------------------------------
// Only the modes this dataset can actually answer. `sync`, `longdiff` and
// `longchange` rank or decompose across non-time dimensions (customer,
// product, region) that a monthly platform time-series does not have.
const modes = [
  { type: 'button', id: 'long', labelKey: 'modes.long', icon: 'chart-timeline-variant' },
  { type: 'divider' },
  { type: 'button', id: 'point', labelKey: 'modes.point', icon: 'chart-bubble' },
];

// --- it.json (column labels) -------------------------------------------------
const L = {
  [C.date]: 'Mese',
  [C.users]: 'Utenti', [`${C.users}:last`]: 'Utenti',
  [C.subs]: 'Abbonati', [`${C.subs}:last`]: 'Abbonati',
  [C.newUsers]: 'Nuovi utenti', [`${C.newUsers}:sum`]: 'Nuovi utenti',
  [C.cash]: 'Incassi', [`${C.cash}:sum`]: 'Incassi',
  [C.rec]: 'Ricavi di competenza', [`${C.rec}:sum`]: 'Ricavi di competenza',
  [C.aws]: 'Costi AWS', [`${C.aws}:sum`]: 'Costi AWS',
  [C.tib]: 'Archiviazione (TiB)', [`${C.tib}:last`]: 'Archiviazione (TiB)',
  [C.photos]: 'Nuove foto (milioni)', [`${C.photos}:sum`]: 'Nuove foto (milioni)',
  [C.rateAll]: 'Tasso di conversione', [`${C.rateAll}:avg`]: 'Tasso di conversione',
  [C.rate1k]: 'Conversione — 1.000+ foto', [`${C.rate1k}:avg`]: 'Conversione — 1.000+ foto',
  [C.rate10k]: 'Conversione — 10.000+ foto', [`${C.rate10k}:avg`]: 'Conversione — 10.000+ foto',
  [C.freeAct]: 'Utenti free attivi (30gg)', [`${C.freeAct}:avg`]: 'Utenti free attivi (30gg)',
  [C.subAct]: 'Abbonati attivi (30gg)', [`${C.subAct}:avg`]: 'Abbonati attivi (30gg)',
  [C.visits]: 'Visite al sito', [`${C.visits}:sum`]: 'Visite al sito',
  [C.press]: 'Articoli stampa', [`${C.press}:sum`]: 'Articoli stampa',
  [CALC.marginAccrual]: 'Margine lordo (competenza)', [`${CALC.marginAccrual}:sum`]: 'Margine lordo (competenza)',
  [CALC.marginCash]: 'Margine lordo (cassa)', [`${CALC.marginCash}:sum`]: 'Margine lordo (cassa)',
  [CALC.deferred]: 'Risconti passivi', [`${CALC.deferred}:sum`]: 'Risconti passivi',
  [CALC.cumRec]: 'Ricavi cumulati', [CALC.cumAws]: 'Costi AWS cumulati',
  [CALC.cumMargin]: 'Margine cumulato', [CALC.cumDeferred]: 'Risconti passivi cumulati',
};

// --- write -------------------------------------------------------------------
const w = (name, text) => { writeFileSync(join(ROOT, name), text); console.log(`  ${name.padEnd(18)} ${text.length.toLocaleString().padStart(8)} bytes`); };
const j = (o) => JSON.stringify(o, null, 2) + '\n';
console.log('GestaltBI config bundle:');
w('data.csv', dataCsv);
w('mapping.json', j(mapping));
w('structure.json', j(structure));
w('processing.json', j(processing));
w('modes.json', j(modes));
w('it.json', j(L));
console.log(`  ${rows.length} monthly rows · ${structure.columns.length} columns · ${modes.filter((m) => m.type === 'button').length} modes`);
