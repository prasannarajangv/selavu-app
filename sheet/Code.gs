/**
 * Selavu → Google Sheet sync
 *
 * Lives inside the template sheet (Extensions → Apps Script). A household makes one copy of the template,
 * deploys this script as a Web app, and pastes the same connection link into Selavu on each phone.
 * Phones send their changes (action "sync": a list of per-item changes) and get the whole book back,
 * so entries logged on one phone show up on the other.
 *
 * Tabs: Summary (charts), Transactions, Cards, one tab per bill month (e.g. "Nov-2026"),
 * and a hidden _Settings tab for budgets, paid bills and people.
 */

var VERSION = 3;

var TX = 'Transactions', CARDS = 'Cards', SUMMARY = 'Summary', SETTINGS = '_Settings', OLD = 'Old data';
var TX_HEAD = ['ID', 'Date', 'Card', 'Amount (₹)', 'Kind', 'Category', 'Note', 'Bill Month', 'Cycle', 'Updated', 'For', 'Logged by', 'Card ID'];
var CARD_HEAD = ['Card', 'Type', 'Statement day', 'Payment due day', 'Credit limit (₹)', 'Colour', 'ID', 'Owner'];
var FIXED_TABS = [SUMMARY, TX, CARDS, OLD, SETTINGS];
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var GOLD = '#c79a45', INK = '#111111';

// Old free-text categories (for "Import old tracker rows") → [kind, category]
var LEGACY = { 'outside food': ['Expense', 'Food & Dining'], 'zomato': ['Expense', 'Food & Dining'], 'snacks erode': ['Expense', 'Food & Dining'],
  'zepto': ['Expense', 'Groceries'], 'vegetables': ['Expense', 'Groceries'], 'chicken': ['Expense', 'Groceries'], 'market purchase': ['Expense', 'Groceries'],
  'emi': ['Expense', 'EMI & Loans'], 'rent': ['Expense', 'Rent & Housing'], 'rental agreement': ['Expense', 'Rent & Housing'],
  'bathroom pipe': ['Expense', 'Home & Repairs'], 'tv installation': ['Expense', 'Home & Repairs'], 'mattress purchase': ['Expense', 'Shopping'],
  'dress purchase': ['Expense', 'Shopping'], 'phone temper': ['Expense', 'Shopping'], 'amazon': ['Expense', 'Shopping'],
  'decathlon purchase': ['Expense', 'Sports & Fitness'], 'sports': ['Expense', 'Sports & Fitness'], 'pangu marriage': ['Expense', 'Gifts & Functions'],
  'malli poo': ['Expense', 'Personal'], 'chit amount': ['Transfer', 'Savings & Investments'], 'srikanth transfer': ['Transfer', ''],
  'lent to friend': ['Lent', ''], 'received amount': ['Received', ''], 'cash / atm': ['Transfer', ''] };
var CATS = ['Food & Dining', 'Groceries', 'Fuel', 'Travel', 'Shopping', 'Bills & Utilities', 'Rent & Housing', 'Home & Repairs', 'Health',
  'Subscriptions', 'EMI & Loans', 'Entertainment', 'Gifts & Functions', 'Sports & Fitness', 'Personal', 'Savings & Investments', 'Other'];

// ---------- Menu ----------

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Selavu')
    .addItem('1. Set up this sheet', 'setupSheet')
    .addItem('2. Get connection link for the app', 'showConnectionLink')
    .addSeparator()
    .addItem('Import old tracker rows (from "Old data" tab)', 'importOldRows')
    .addItem('Rebuild month tabs and summary', 'rebuildAll')
    .addToUi();
}

function setupSheet() {
  var ss = SpreadsheetApp.getActive();
  ensureTabs_(ss);
  buildSummary_(ss);
  key_();
  SpreadsheetApp.getUi().alert('Sheet is ready.\n\nNext: Extensions → Apps Script → Deploy → New deployment → ' +
    'type "Web app", Execute as "Me", Who has access "Anyone" → Deploy. Copy the Web app URL, then come back and choose ' +
    'Selavu → 2. Get connection link for the app.');
}

function showConnectionLink() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.prompt('Paste your Web app URL',
    'From Apps Script → Deploy → Manage deployments (it ends in /exec):', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var url = res.getResponseText().trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) {
    ui.alert('That doesn\'t look like a Web app URL. It should start with https://script.google.com/macros/s/ and end with /exec.');
    return;
  }
  ensureTabs_(SpreadsheetApp.getActive());
  var link = url + '?k=' + key_();
  var html = HtmlService.createHtmlOutput(
    '<div style="font:14px Arial;line-height:1.5">' +
    '<p>Copy this link and paste it in <b>Selavu → Settings → Connect Google Sheet</b>.</p>' +
    '<textarea id="l" readonly style="width:100%;height:90px;font:12px monospace">' + link + '</textarea>' +
    '<p><button onclick="var t=document.getElementById(\'l\');t.select();document.execCommand(\'copy\');this.textContent=\'Copied\'">Copy link</button></p>' +
    '<p style="color:#666">Use the same link on your spouse\'s phone to share this sheet. Keep it private: anyone with this link can read and change the entries.</p></div>')
    .setWidth(460).setHeight(260);
  ui.showModalDialog(html, 'Selavu connection link');
}

// Hand edits in the sheet: tell the phones to read it again on their next sync.
function onEdit() { try { bumpRev_(); } catch (e) {} }

function bumpRev_() { PropertiesService.getDocumentProperties().setProperty('REV', String(Date.now())); }
function rev_() {
  var props = PropertiesService.getDocumentProperties();
  var r = props.getProperty('REV');
  if (!r) { r = String(Date.now()); props.setProperty('REV', r); }
  return r;
}

function key_() {
  var props = PropertiesService.getDocumentProperties();
  var k = props.getProperty('KEY');
  if (!k) { k = Utilities.getUuid().replace(/-/g, ''); props.setProperty('KEY', k); }
  return k;
}

// ---------- Web app ----------

function doGet() {
  return ContentService.createTextOutput('Selavu sync is running. Use the connection link inside the Selavu app.');
}

function doPost(e) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(25000);
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    if (!body.k || body.k !== PropertiesService.getDocumentProperties().getProperty('KEY')) return out_({ ok: false, error: 'bad-key' });
    var ss = SpreadsheetApp.getActive();
    ensureTabs_(ss);
    if (body.action === 'ping') return out_({ ok: true, v: VERSION, sheetUrl: ss.getUrl(), name: ss.getName(), count: txCount_(ss),
                                               people: readSettings_(ss).people });
    if (body.action === 'sync') return out_(sync_(ss, body));
    if (body.action === 'pull') return out_(pull_(ss));
    if (body.action === 'push') { var r = push_(ss, body); bumpRev_(); return out_(r); }
    return out_({ ok: false, error: 'unknown-action' });
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// ---------- Sync (each phone ↔ sheet) ----------

/**
 * body: { rev, ops: [ {k:'tx', id, tx|null}, {k:'card', id, card|null}, {k:'person', id, person|null},
 *                     {k:'budget', id: category, v|null}, {k:'paid', id: 'cardId|yyyy-MM', v|null} ] }   (null = deleted)
 * Returns the whole book (like pull) with a new rev, or { same: true } when nothing changed since the phone's rev.
 */
function sync_(ss, body) {
  var ops = body.ops || [];
  if (ops.length) { applyOps_(ss, ops); bumpRev_(); }
  var rev = rev_();
  if (!ops.length && body.rev && body.rev === rev) return { ok: true, same: true, rev: rev, sheetUrl: ss.getUrl() };
  var snap = pull_(ss);
  snap.rev = rev;
  return snap;
}

function applyOps_(ss, ops) {
  var st = readSettings_(ss), stChanged = false, cards = null;
  ops.forEach(function (o) {
    if (o.k === 'person') {
      var i = indexOf_(st.people, o.id);
      if (!o.person) { if (i >= 0) st.people.splice(i, 1); }
      else if (i >= 0) st.people[i] = { id: o.id, name: String(o.person.name) };
      else st.people.push({ id: o.id, name: String(o.person.name) });
      stChanged = true;
    } else if (o.k === 'budget' || o.k === 'paid') {
      var map = o.k === 'budget' ? st.budgets : st.paid;
      if (o.v) map[o.id] = o.v; else delete map[o.id];
      stChanged = true;
    } else if (o.k === 'card') {
      cards = cards || readCards_(ss);
      var j = indexOf_(cards, o.id);
      if (!o.card) { if (j >= 0) cards.splice(j, 1); }
      else if (j >= 0) cards[j] = o.card;
      else cards.push(o.card);
    }
  });
  if (stChanged) writeSettings_(ss, st);
  if (cards) writeCards_(ss, cards);
  var txOps = ops.filter(function (o) { return o.k === 'tx'; })
    .map(function (o) { return o.tx ? { op: 'upsert', tx: o.tx } : { op: 'delete', id: o.id }; });
  if (txOps.length) applyTx_(ss, txOps);
}

function indexOf_(list, id) { for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(id)) return i; return -1; }

function readSettings_(ss) {
  var st = ss.getSheetByName(SETTINGS);
  var parse = function (v, d) { try { return JSON.parse(v) || d; } catch (e) { return d; } };
  var v = st.getRange('B1:B3').getValues();
  return { budgets: parse(v[0][0], {}), paid: parse(v[1][0], {}), people: parse(v[2][0], []) };
}
function writeSettings_(ss, s) {
  ss.getSheetByName(SETTINGS).getRange('A1:B3').setValues([['budgets', JSON.stringify(s.budgets)], ['paid', JSON.stringify(s.paid)],
                                                            ['people', JSON.stringify(s.people)]]);
}

// ---------- Push (older app versions) ----------

/**
 * body: { full?: true, tx?: [...all entries] }  replaces every transaction
 *       { ops: [{op:'upsert', tx}, {op:'delete', id}] }  incremental
 *       cards / budgets / paid  (sent when they changed)
 * Each tx: { id, date:'yyyy-MM-ddTHH:mm', card, cardId, amount, kind, category, note, billMonth:'yyyy-MM', cycle }
 */
function push_(ss, body) {
  var tz = ss.getSpreadsheetTimeZone();
  var sh = ss.getSheetByName(TX);
  var touched = {};
  if (body.cards) writeCards_(ss, body.cards);
  if (body.budgets || body.paid) {
    var st = ss.getSheetByName(SETTINGS);
    if (body.budgets) st.getRange('A1:B1').setValues([['budgets', JSON.stringify(body.budgets)]]);
    if (body.paid) st.getRange('A2:B2').setValues([['paid', JSON.stringify(body.paid)]]);
  }

  if (body.full) {
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, TX_HEAD.length).clearContent();
    var rows = (body.tx || []).map(function (t) { touched[t.billMonth] = 1; return row_(t, tz); });
    rows.sort(function (a, b) { return a[1] - b[1]; });
    if (rows.length) sh.getRange(2, 1, rows.length, TX_HEAD.length).setValues(rows);
    rebuildMonths_(ss, null);
  } else {
    applyTx_(ss, body.ops || []);
  }
  formatTx_(sh);
  return { ok: true, count: txCount_(ss), sheetUrl: ss.getUrl() };
}

// ops: [{op:'upsert', tx}, {op:'delete', id}]; rebuilds the month tabs they touch.
function applyTx_(ss, ops) {
  var tz = ss.getSpreadsheetTimeZone();
  var sh = ss.getSheetByName(TX);
  var touched = {};
  var index = idIndex_(sh);
  var deletes = [];
  ops.forEach(function (o) {
    var at = index[o.op === 'delete' ? o.id : o.tx.id];
    if (at) { var old = sh.getRange(at, 8).getValue(); if (old instanceof Date) touched[ym_(old, tz)] = 1; }
    if (o.op === 'delete') { if (at) deletes.push(at); return; }
    touched[o.tx.billMonth] = 1;
    var row = row_(o.tx, tz);
    if (at) sh.getRange(at, 1, 1, row.length).setValues([row]);
    else { sh.appendRow(row); index[o.tx.id] = sh.getLastRow(); }
  });
  deletes.sort(function (a, b) { return b - a; }).forEach(function (r) { sh.deleteRow(r); });
  rebuildMonths_(ss, touched);
  formatTx_(sh);
}

function row_(t, tz) {
  return [t.id, Utilities.parseDate(t.date, tz, "yyyy-MM-dd'T'HH:mm"), t.card, Number(t.amount), t.kind, t.category || '',
    t.note || '', t.billMonth ? Utilities.parseDate(t.billMonth + '-01', tz, 'yyyy-MM-dd') : '', t.cycle || '', new Date(),
    t['for'] || '', t.by || '', t.cardId || ''];
}

function idIndex_(sh) {
  var map = {};
  if (sh.getLastRow() < 2) return map;
  sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(function (r, i) { if (r[0]) map[r[0]] = i + 2; });
  return map;
}

function writeCards_(ss, cards) {
  var sh = ss.getSheetByName(CARDS);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, CARD_HEAD.length).clearContent();
  var rows = cards.map(function (c) { return [c.name, c.type, c.stmtDay || '', c.dueDay || '', c.limit || '', c.color || '', c.id, c.owner || '']; });
  if (rows.length) sh.getRange(2, 1, rows.length, CARD_HEAD.length).setValues(rows);
}

// ---------- Pull (sheet → app) ----------

// Cards tab as written (owner as a name).
function readCards_(ss) {
  var cs = ss.getSheetByName(CARDS), out = [];
  if (cs.getLastRow() < 2) return out;
  cs.getRange(2, 1, cs.getLastRow() - 1, CARD_HEAD.length).getValues().forEach(function (r) {
    if (!r[0]) return;
    out.push({ id: String(r[6] || 'c' + Utilities.getUuid().slice(0, 8)), name: String(r[0]), type: String(r[1] || 'Debit'),
               stmtDay: Number(r[2]) || '', dueDay: Number(r[3]) || '', limit: Number(r[4]) || '', color: String(r[5] || ''), owner: String(r[7] || '') });
  });
  return out;
}

function pull_(ss) {
  var tz = ss.getSpreadsheetTimeZone();
  var st = readSettings_(ss), peopleAdded = false;
  // The sheet shows names; the phones work with ids. Unknown names (typed in the sheet) become new people.
  var pid = {};
  st.people.forEach(function (p) { pid[String(p.name).toLowerCase()] = p.id; });
  var who = function (name) {
    name = String(name || '').trim();
    if (!name) return '';
    if (/^(family|joint)$/i.test(name)) return 'family';
    var id = pid[name.toLowerCase()];
    if (!id) { id = 'p' + Utilities.getUuid().slice(0, 8); pid[name.toLowerCase()] = id; st.people.push({ id: id, name: name }); peopleAdded = true; }
    return id;
  };
  var cards = [], byName = {}, byId = {};
  readCards_(ss).forEach(function (c) { c.owner = who(c.owner); cards.push(c); byId[c.id] = c; if (!byName[c.name.toLowerCase()]) byName[c.name.toLowerCase()] = c; });
  var tx = [];
  var sh = ss.getSheetByName(TX);
  if (sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, TX_HEAD.length).getValues().forEach(function (r) {
      if (!r[0] || !(r[1] instanceof Date)) return;
      var name = String(r[2]), c = byId[String(r[12] || '')] || byName[name.toLowerCase()];
      if (!c) { c = { id: 'c' + Utilities.getUuid().slice(0, 8), name: name, type: /\bcc\b|credit/i.test(name) ? 'Credit' : 'Debit',
                      stmtDay: '', dueDay: '', limit: '', color: '' }; cards.push(c); byName[name.toLowerCase()] = c; }
      tx.push({ id: String(r[0]), date: Utilities.formatDate(r[1], tz, "yyyy-MM-dd'T'HH:mm"), card: c.id, amount: Number(r[3]),
                kind: String(r[4] || 'Expense'), category: String(r[5] || ''), note: String(r[6] || ''),
                billMonth: r[7] instanceof Date ? ym_(r[7], tz) : '', 'for': who(r[10]), by: who(r[11]) });
    });
  }
  if (peopleAdded) writeSettings_(ss, st);
  return { ok: true, v: VERSION, people: st.people, cards: cards, tx: tx, budgets: st.budgets, paid: st.paid, sheetUrl: ss.getUrl() };
}

function txCount_(ss) { return Math.max(ss.getSheetByName(TX).getLastRow() - 1, 0); }

// ---------- Tabs ----------

function ensureTabs_(ss) {
  var tx = ss.getSheetByName(TX) || ss.insertSheet(TX);
  if (tx.getRange(1, 1).getValue() !== 'ID') {
    tx.getRange(1, 1, 1, TX_HEAD.length).setValues([TX_HEAD]);
    styleHead_(tx.getRange(1, 1, 1, TX_HEAD.length));
    tx.setFrozenRows(1);
    [80, 150, 140, 100, 90, 150, 220, 100, 130, 150, 110, 110, 110].forEach(function (w, i) { tx.setColumnWidth(i + 1, w); });
  }
  if (tx.getRange(1, 11).getValue() !== 'For') {
    tx.getRange(1, 11, 1, 2).setValues([['For', 'Logged by']]);   // sheets made before people were added
    styleHead_(tx.getRange(1, 11, 1, 2));
  }
  if (tx.getRange(1, 13).getValue() !== 'Card ID') {
    tx.getRange(1, 13).setValue('Card ID');   // tells apart two people's cards with the same name
    styleHead_(tx.getRange(1, 13));
  }
  var cs = ss.getSheetByName(CARDS) || ss.insertSheet(CARDS);
  if (cs.getRange(1, 1).getValue() !== 'Card') {
    cs.getRange(1, 1, 1, CARD_HEAD.length).setValues([CARD_HEAD]);
    styleHead_(cs.getRange(1, 1, 1, CARD_HEAD.length));
    cs.setFrozenRows(1);
    cs.setColumnWidth(1, 180);
  } else if (cs.getRange(1, 8).getValue() !== 'Owner') {
    cs.getRange(1, 8).setValue('Owner');
    styleHead_(cs.getRange(1, 8));
  }
  var st = ss.getSheetByName(SETTINGS) || ss.insertSheet(SETTINGS);
  if (!st.isSheetHidden()) st.hideSheet();
  if (!ss.getSheetByName(SUMMARY)) { ss.insertSheet(SUMMARY, 0); buildSummary_(ss); }
  var blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);
}

function styleHead_(r) { r.setBackground(INK).setFontColor(GOLD).setFontWeight('bold'); }

function formatTx_(sh) {
  var n = Math.max(sh.getLastRow() - 1, 1);
  sh.getRange(2, 2, n, 1).setNumberFormat('d mmm yyyy, h:mm am/pm');
  sh.getRange(2, 4, n, 1).setNumberFormat('₹#,##0.##');
  sh.getRange(2, 8, n, 1).setNumberFormat('mmm yyyy');
  sh.getRange(2, 10, n, 1).setNumberFormat('d mmm yyyy, h:mm');
}

function buildSummary_(ss) {
  var sh = ss.getSheetByName(SUMMARY) || ss.insertSheet(SUMMARY, 0);
  sh.clear();
  sh.getCharts().forEach(function (c) { sh.removeChart(c); });
  sh.setHiddenGridlines(true);
  sh.getRange('A1').setValue('SELAVU').setFontSize(22).setFontColor(GOLD).setFontWeight('bold');
  sh.getRange('A2').setValue('Updated automatically from the Selavu app. Spending = Kind "Expense". Credit cards are grouped by billing cycle.')
    .setFontColor('#666666');
  sh.getRange('A4').setValue('Spending by bill month and card').setFontWeight('bold');
  sh.getRange('A5').setFormula('=IFERROR(QUERY(Transactions!A1:L, "select H, sum(D) where E = \'Expense\' and H is not null ' +
    'group by H pivot C label H \'Bill month\'", 1), "No entries yet")');
  sh.getRange('A5:A40').setNumberFormat('mmm yyyy');
  sh.getRange('B6:L40').setNumberFormat('₹#,##0');
  sh.getRange('N4').setValue('This month by category').setFontWeight('bold');
  sh.getRange('N5').setFormula('=IFERROR(QUERY(Transactions!A1:L, "select F, sum(D) where E = \'Expense\' and H = date \'"&' +
    'TEXT(DATE(YEAR(TODAY()),MONTH(TODAY()),1),"yyyy-mm-dd")&"\' group by F order by sum(D) desc label F \'Category\', sum(D) \'Spent\'", 1), "Nothing this month yet")');
  sh.getRange('O6:O26').setNumberFormat('₹#,##0');
  sh.getRange('N28').setValue('Spending by person').setFontWeight('bold');
  sh.getRange('N29').setFormula('=IFERROR(QUERY(Transactions!A1:L, "select H, sum(D) where E = \'Expense\' and H is not null and K <> \'\' ' +
    'group by H pivot K label H \'Bill month\'", 1), "Add people in the app to see this")');
  sh.getRange('N30:N60').setNumberFormat('mmm yyyy');
  sh.getRange('O30:R60').setNumberFormat('₹#,##0');
  sh.setColumnWidth(1, 110);
  sh.setColumnWidth(14, 170);
  sh.insertChart(sh.newChart().setChartType(Charts.ChartType.COLUMN).addRange(sh.getRange('A5:L40'))
    .setNumHeaders(1).setOption('isStacked', true).setOption('title', 'Spending by bill month')
    .setOption('legend', { position: 'top' }).setPosition(4, 4, 0, 0).setOption('width', 620).setOption('height', 340).build());
  sh.insertChart(sh.newChart().setChartType(Charts.ChartType.PIE).addRange(sh.getRange('N5:O25'))
    .setNumHeaders(1).setOption('pieHole', 0.5).setOption('title', 'This month by category')
    .setPosition(24, 4, 0, 0).setOption('width', 620).setOption('height', 320).build());
  sh.insertChart(sh.newChart().setChartType(Charts.ChartType.COLUMN).addRange(sh.getRange('N29:R60'))
    .setNumHeaders(1).setOption('isStacked', true).setOption('title', 'Spending by person')
    .setOption('legend', { position: 'top' }).setPosition(42, 4, 0, 0).setOption('width', 620).setOption('height', 320).build());
}

// ---------- Month tabs ----------

function rebuildAll() { rebuildMonths_(SpreadsheetApp.getActive(), null); buildSummary_(SpreadsheetApp.getActive()); }

// touched: { 'yyyy-MM': 1 } to rebuild only those months, or null for all (also removes empty month tabs)
function rebuildMonths_(ss, touched) {
  var tz = ss.getSpreadsheetTimeZone();
  var sh = ss.getSheetByName(TX);
  var rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, TX_HEAD.length).getValues() : [];
  var groups = {};
  rows.forEach(function (r) { if (r[7] instanceof Date) (groups[ym_(r[7], tz)] = groups[ym_(r[7], tz)] || []).push(r); });
  var months = touched ? Object.keys(touched).filter(Boolean) : Object.keys(groups);
  if (!touched) {
    ss.getSheets().forEach(function (s) { if (/^[A-Z][a-z]{2}-\d{4}$/.test(s.getName()) && !groups[tabYm_(s.getName())]) ss.deleteSheet(s); });
  }
  months.forEach(function (ym) { monthTab_(ss, ym, groups[ym] || []); });
}

function ym_(d, tz) { return Utilities.formatDate(d, tz, 'yyyy-MM'); }
function tabName_(ym) { var p = ym.split('-'); return MON[+p[1] - 1] + '-' + p[0]; }
function tabYm_(name) { var p = name.split('-'); return p[1] + '-' + ('0' + (MON.indexOf(p[0]) + 1)).slice(-2); }

function monthTab_(ss, ym, rows) {
  var name = tabName_(ym);
  var sh = ss.getSheetByName(name);
  if (!rows.length) { if (sh) ss.deleteSheet(sh); return; }
  if (!sh) sh = ss.insertSheet(name, monthIndex_(ss, ym));
  sh.clear();
  sh.getCharts().forEach(function (c) { sh.removeChart(c); });
  sh.setTabColor(GOLD);
  rows.sort(function (a, b) { return a[1] - b[1]; });

  sh.getRange('A1').setValue(name.replace('-', ' ') + ' · bill month').setFontSize(16).setFontWeight('bold');
  sh.getRange('A2').setValue('Credit cards: statement period ending this month. Debit / UPI / cash: calendar month. Rebuilt automatically.')
    .setFontColor('#666666');

  var byCard = {}, byCat = {}, byWho = {}, spent = 0;
  rows.forEach(function (r) {
    var c = byCard[r[2]] = byCard[r[2]] || { cycle: r[8], exp: 0, charged: 0 };
    if (r[4] === 'Expense') {
      c.exp += r[3]; spent += r[3]; byCat[r[5] || 'Other'] = (byCat[r[5] || 'Other'] || 0) + r[3];
      if (r[10]) byWho[r[10]] = (byWho[r[10]] || 0) + r[3];
    }
    if (r[4] !== 'Received') c.charged += r[3];
  });
  var cardRows = Object.keys(byCard).sort().map(function (k) { return [k, byCard[k].cycle, byCard[k].exp, byCard[k].charged]; });
  sh.getRange(4, 1, 1, 4).setValues([['Card', 'Period', 'Spent', 'Total charged']]);
  styleHead_(sh.getRange(4, 1, 1, 4));
  sh.getRange(5, 1, cardRows.length, 4).setValues(cardRows);
  var tot = 5 + cardRows.length;
  sh.getRange(tot, 1, 1, 4).setValues([['Total', '', spent, cardRows.reduce(function (a, r) { return a + r[3]; }, 0)]]).setFontWeight('bold');
  sh.getRange(5, 3, cardRows.length + 1, 2).setNumberFormat('₹#,##0');

  var c0 = tot + 2;
  var catRows = Object.keys(byCat).map(function (k) { return [k, byCat[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
  sh.getRange(c0, 1, 1, 2).setValues([['Category', 'Spent']]);
  styleHead_(sh.getRange(c0, 1, 1, 2));
  if (catRows.length) {
    sh.getRange(c0 + 1, 1, catRows.length, 2).setValues(catRows);
    sh.getRange(c0 + 1, 2, catRows.length, 1).setNumberFormat('₹#,##0');
    sh.insertChart(sh.newChart().setChartType(Charts.ChartType.PIE).addRange(sh.getRange(c0 + 1, 1, catRows.length, 2))
      .setOption('pieHole', 0.5).setOption('title', name.replace('-', ' ') + ' by category').setPosition(4, 7, 0, 0)
      .setOption('width', 420).setOption('height', 280).build());
  }

  var w0 = c0 + catRows.length + 2;
  var whoRows = Object.keys(byWho).map(function (k) { return [k, byWho[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
  if (whoRows.length) {
    sh.getRange(w0, 1, 1, 2).setValues([['Spent by', 'Spent']]);
    styleHead_(sh.getRange(w0, 1, 1, 2));
    sh.getRange(w0 + 1, 1, whoRows.length, 2).setValues(whoRows);
    sh.getRange(w0 + 1, 2, whoRows.length, 1).setNumberFormat('₹#,##0');
    w0 += whoRows.length + 2;
  }

  var r0 = w0 + 1;
  sh.getRange(r0, 1, 1, 9).setValues([['Date', 'Card', 'Amount', 'Kind', 'Category', 'Note', 'Cycle', 'For', 'Logged by']]);
  styleHead_(sh.getRange(r0, 1, 1, 9));
  sh.getRange(r0 + 1, 1, rows.length, 9).setValues(rows.map(function (r) { return [r[1], r[2], r[3], r[4], r[5], r[6], r[8], r[10], r[11]]; }));
  sh.getRange(r0 + 1, 1, rows.length, 1).setNumberFormat('d mmm yyyy');
  sh.getRange(r0 + 1, 3, rows.length, 1).setNumberFormat('₹#,##0');
  sh.setColumnWidth(1, 130); sh.setColumnWidth(2, 140); sh.setColumnWidth(6, 200); sh.setColumnWidth(7, 130);
}

function monthIndex_(ss, ym) {
  var sheets = ss.getSheets();
  var after = 0;
  for (var i = 0; i < sheets.length; i++) {
    var n = sheets[i].getName();
    if (FIXED_TABS.indexOf(n) >= 0) { after = i + 1; continue; }
    if (/^[A-Z][a-z]{2}-\d{4}$/.test(n) && tabYm_(n) > ym) return i;   // newest month last
    if (/^[A-Z][a-z]{2}-\d{4}$/.test(n)) after = i + 1;
  }
  return after;
}

// ---------- Import from an old tracker ----------

/**
 * Paste old rows into a tab named "Old data" with a header row: Date, Card, Amount, Category (Type optional).
 * They are added to Transactions; then in the app use Settings → Restore from Google Sheet.
 */
function importOldRows() {
  var ss = SpreadsheetApp.getActive();
  var ui = SpreadsheetApp.getUi();
  ensureTabs_(ss);
  var old = ss.getSheetByName(OLD);
  if (!old || old.getLastRow() < 2) {
    if (!old) old = ss.insertSheet(OLD);
    old.getRange(1, 1, 1, 4).setValues([['Date', 'Card', 'Amount', 'Category']]);
    ui.alert('Paste your old rows into the "Old data" tab (Date, Card, Amount, Category), then run this again.');
    return;
  }
  var tz = ss.getSpreadsheetTimeZone();
  var vals = old.getDataRange().getValues();
  var head = vals[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var col = function (re) { for (var i = 0; i < head.length; i++) if (re.test(head[i])) return i; return -1; };
  var iD = col(/^date/), iC = col(/card/), iA = col(/amount/), iCat = col(/categ/);
  if (iD < 0 || iC < 0 || iA < 0) { ui.alert('The "Old data" tab needs columns named Date, Card and Amount.'); return; }
  var existing = idIndex_(ss.getSheetByName(TX));
  var rows = [], cards = {};
  vals.slice(1).forEach(function (r, i) {
    var d = r[iD], amt = Number(String(r[iA]).replace(/[₹,\s]/g, ''));
    if (!(d instanceof Date) || !(amt > 0) || !r[iC]) return;
    var raw = iCat >= 0 ? String(r[iCat] || '').trim() : '';
    var m = CATS.indexOf(raw) >= 0 ? ['Expense', raw] : (LEGACY[raw.toLowerCase()] || ['Expense', 'Other']);
    var id = 'old' + Utilities.formatDate(d, tz, 'yyMMddHHmmss') + i;
    if (existing[id]) return;
    cards[String(r[iC]).trim()] = 1;
    rows.push([id, d, String(r[iC]).trim(), amt, m[0], m[0] === 'Expense' ? (m[1] || 'Other') : '',
      CATS.indexOf(raw) >= 0 ? '' : raw, '', '', new Date()]);
  });
  if (!rows.length) { ui.alert('No new rows to import.'); return; }
  var tx = ss.getSheetByName(TX);
  tx.getRange(tx.getLastRow() + 1, 1, rows.length, TX_HEAD.length).setValues(rows);
  formatTx_(tx);
  // Add any card names the Cards tab doesn't have yet (statement days are set later in the app).
  var cs = ss.getSheetByName(CARDS);
  var have = cs.getLastRow() > 1 ? cs.getRange(2, 1, cs.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]).toLowerCase(); }) : [];
  Object.keys(cards).forEach(function (n) {
    if (have.indexOf(n.toLowerCase()) < 0) cs.appendRow([n, /\bcc\b|credit/i.test(n) ? 'Credit' : 'Debit', '', '', '', '', '']);
  });
  ui.alert(rows.length + ' rows imported.\n\nNow open Selavu → Settings → Restore from Google Sheet, then set each credit card\'s ' +
    'statement day. The app re-sorts everything into bill months and updates this sheet.');
}
