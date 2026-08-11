/**
 * Apartment HQ — Apps Script backend.
 *
 * SETUP:
 * 1. Open the Apartment-HQ-Data Google Sheet.
 * 2. Extensions > Apps Script.
 * 3. Delete any starter code, paste this whole file in, save.
 * 4. Deploy > New deployment > type "Web app".
 *      Execute as: Me
 *      Who has access: Anyone
 * 5. Copy the /exec URL it gives you — paste it into API_URL in index.html.
 * 6. Re-deploy (Deploy > Manage deployments > edit > New version) any time you change this file.
 */

var SHEET_NAMES = ['Chores', 'ManagementItems', 'ChecklistItems', 'History', 'CommunalItems', 'CommunalItemHistory', 'Bills', 'Payments'];

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetParam = e && e.parameter && e.parameter.sheet;
  var names = sheetParam ? [sheetParam] : SHEET_NAMES;
  var out = {};
  names.forEach(function (name) {
    out[name] = readSheet(ss, name);
  });
  return jsonOut(out);
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut({ error: 'Bad JSON body' });
  }
  var action = body.action;
  var sheetName = body.sheet;
  if (SHEET_NAMES.indexOf(sheetName) === -1) {
    return jsonOut({ error: 'Unknown sheet: ' + sheetName });
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return jsonOut({ error: 'Sheet not found: ' + sheetName });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (action === 'append') {
      return jsonOut({ ok: true, row: appendRow(sheet, body.data || {}) });
    }
    if (action === 'update') {
      var updated = updateRow(sheet, body.id, body.data || {});
      if (!updated) return jsonOut({ error: 'Row not found: ' + body.id });
      return jsonOut({ ok: true, row: updated });
    }
    if (action === 'delete') {
      return jsonOut({ ok: deleteRow(sheet, body.id) });
    }
    return jsonOut({ error: 'Unknown action: ' + action });
  } finally {
    lock.releaseLock();
  }
}

function readSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var rowVals = values[r];
    if (rowVals.join('') === '') continue;
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var v = rowVals[c];
      if (v instanceof Date) v = Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      obj[headers[c]] = v;
    }
    rows.push(obj);
  }
  return rows;
}

function appendRow(sheet, data) {
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idCol = headers.indexOf('ID');
  var maxId = 0;
  for (var r = 1; r < values.length; r++) {
    var idVal = parseInt(values[r][idCol], 10);
    if (!isNaN(idVal) && idVal > maxId) maxId = idVal;
  }
  var newId = String(maxId + 1);
  var row = headers.map(function (h) {
    if (h === 'ID') return newId;
    return data.hasOwnProperty(h) ? data[h] : '';
  });
  sheet.appendRow(row);
  var obj = {};
  headers.forEach(function (h, i) { obj[h] = row[i]; });
  return obj;
}

function updateRow(sheet, id, data) {
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idCol = headers.indexOf('ID');
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][idCol]) === String(id)) {
      headers.forEach(function (h, c) {
        if (data.hasOwnProperty(h)) {
          sheet.getRange(r + 1, c + 1).setValue(data[h]);
          values[r][c] = data[h];
        }
      });
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = values[r][i]; });
      return obj;
    }
  }
  return null;
}

function deleteRow(sheet, id) {
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idCol = headers.indexOf('ID');
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][idCol]) === String(id)) {
      sheet.deleteRow(r + 1);
      return true;
    }
  }
  return false;
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
