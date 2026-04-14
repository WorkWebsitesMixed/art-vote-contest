// ══════════════════════════════════════════════
// Code.gs — Art Contest Voting Backend
// Google Apps Script Web App
//
// Deploy settings:
//   Execute as: Me (your Google account)
//   Who has access: Anyone (even anonymous)
// ══════════════════════════════════════════════

// ── Sheet names ──────────────────────────────
var SHEET_CONFIG = "Config";
var SHEET_VOTES  = "Votes";

// ── Vote column headers (in order) ───────────
var VOTE_HEADERS = [
  "timestamp", "name", "email", "school",
  "cat1_1st", "cat1_2nd", "cat1_3rd",
  "cat2_1st", "cat2_2nd", "cat2_3rd"
];

/* ─────────────────────────────────────────────
   doGet — handles GET requests
   ?action=get_results → return vote tallies
   (no action)         → return voting_open status
───────────────────────────────────────────── */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || "";

    if (action === "get_results") {
      return handleGetResults_();
    }

    // Default: return voting open/closed status
    var votingOpen = getVotingOpen_();
    return jsonResponse_({ voting_open: votingOpen });

  } catch (err) {
    return jsonResponse_({ status: "error", message: err.message });
  }
}

/* ─────────────────────────────────────────────
   doPost — handles POST requests
   Body (JSON string, Content-Type: text/plain):
     { action: "check_email",  email: "..." }
     { action: "submit_vote",  name, email, school, cat1_1st, ... }
     { action: "get_results" }
───────────────────────────────────────────── */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ status: "error", message: "Empty request body." });
    }

    var data   = JSON.parse(e.postData.contents);
    var action = data.action || "";

    if (action === "check_email") {
      return handleCheckEmail_(data.email);
    }

    if (action === "submit_vote") {
      return handleSubmitVote_(data);
    }

    if (action === "get_results") {
      return handleGetResults_();
    }

    return jsonResponse_({ status: "error", message: "Unknown action: " + action });

  } catch (err) {
    return jsonResponse_({ status: "error", message: err.message });
  }
}

/* ─────────────────────────────────────────────
   Action: check_email
   Returns {status:"ok"} or {status:"already_voted"}
───────────────────────────────────────────── */
function handleCheckEmail_(email) {
  if (!email || !email.trim()) {
    return jsonResponse_({ status: "error", message: "Email is required." });
  }

  var sheet = getVotesSheet_();
  var lastRow = sheet.getLastRow();

  if (lastRow >= 2) {
    var emails = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
    var normalized = email.trim().toLowerCase();

    for (var i = 0; i < emails.length; i++) {
      if (emails[i][0].toString().trim().toLowerCase() === normalized) {
        return jsonResponse_({ status: "already_voted" });
      }
    }
  }

  return jsonResponse_({ status: "ok" });
}

/* ─────────────────────────────────────────────
   Action: submit_vote
   Validates open state + duplicate, then appends row.
   Uses LockService to prevent race conditions.
───────────────────────────────────────────── */
function handleSubmitVote_(data) {
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(12000);

    // 1. Voting open?
    if (!getVotingOpen_()) {
      return jsonResponse_({
        status: "error",
        message: "La votación está cerrada en este momento."
      });
    }

    // 2. Validate required fields
    var required = ["name", "email", "school",
                    "cat1_1st", "cat1_2nd", "cat1_3rd",
                    "cat2_1st", "cat2_2nd", "cat2_3rd"];

    for (var i = 0; i < required.length; i++) {
      if (!data[required[i]] || !data[required[i]].toString().trim()) {
        return jsonResponse_({
          status: "error",
          message: "Campo requerido faltante: " + required[i]
        });
      }
    }

    // 3. Re-check duplicate (inside lock to prevent race)
    var sheet    = getVotesSheet_();
    var lastRow  = sheet.getLastRow();
    var normalized = data.email.trim().toLowerCase();

    if (lastRow >= 2) {
      var emails = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
      for (var j = 0; j < emails.length; j++) {
        if (emails[j][0].toString().trim().toLowerCase() === normalized) {
          return jsonResponse_({
            status: "already_voted",
            message: "Este correo ya emitió un voto."
          });
        }
      }
    }

    // 4. Append vote row
    sheet.appendRow([
      new Date(),
      data.name.trim(),
      data.email.trim(),
      data.school.trim(),
      data.cat1_1st.trim(),
      data.cat1_2nd.trim(),
      data.cat1_3rd.trim(),
      data.cat2_1st.trim(),
      data.cat2_2nd.trim(),
      data.cat2_3rd.trim()
    ]);

    return jsonResponse_({ status: "ok", message: "Voto registrado correctamente." });

  } catch (err) {
    return jsonResponse_({ status: "error", message: err.message });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

/* ─────────────────────────────────────────────
   Action: get_results
   Returns tallied scores per piece ID.
   Scoring: 1st=3pts, 2nd=2pts, 3rd=1pt
───────────────────────────────────────────── */
function handleGetResults_() {
  var votingOpen = getVotingOpen_();
  var sheet      = getVotesSheet_();
  var lastRow    = sheet.getLastRow();
  var totalVotes = Math.max(0, lastRow - 1);

  // tally[pieceId] = { first:N, second:N, third:N, total:N }
  var tally = {};

  if (lastRow >= 2) {
    // Columns 5-10 (1-indexed): cat1_1st…cat2_3rd
    var rows = sheet.getRange(2, 5, lastRow - 1, 6).getValues();

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      // [cat1_1st, cat1_2nd, cat1_3rd, cat2_1st, cat2_2nd, cat2_3rd]
      var entries = [
        { id: r[0], pos: "first",  pts: 3 },
        { id: r[1], pos: "second", pts: 2 },
        { id: r[2], pos: "third",  pts: 1 },
        { id: r[3], pos: "first",  pts: 3 },
        { id: r[4], pos: "second", pts: 2 },
        { id: r[5], pos: "third",  pts: 1 }
      ];

      for (var k = 0; k < entries.length; k++) {
        var pieceId = (entries[k].id || "").toString().trim();
        if (!pieceId) continue;

        if (!tally[pieceId]) {
          tally[pieceId] = { first: 0, second: 0, third: 0, total: 0 };
        }
        tally[pieceId][entries[k].pos]++;
        tally[pieceId].total += entries[k].pts;
      }
    }
  }

  return jsonResponse_({
    status:      "ok",
    voting_open: votingOpen,
    total_votes: totalVotes,
    results:     tally
  });
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

/**
 * Read voting_open flag from Config sheet B1.
 * Accepts boolean TRUE or the string "TRUE" (case-insensitive).
 */
function getVotingOpen_() {
  var ss          = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = ss.getSheetByName(SHEET_CONFIG);

  if (!configSheet) {
    // Auto-create Config sheet with default value
    configSheet = ss.insertSheet(SHEET_CONFIG);
    configSheet.getRange("A1").setValue("voting_open");
    configSheet.getRange("B1").setValue(true);
    return true;
  }

  var val = configSheet.getRange("B1").getValue();
  return (val === true || String(val).toUpperCase() === "TRUE");
}

/**
 * Get or create the Votes sheet with proper headers.
 */
function getVotesSheet_() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_VOTES);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_VOTES);
    sheet.getRange(1, 1, 1, VOTE_HEADERS.length).setValues([VOTE_HEADERS]);

    // Style headers
    var headerRange = sheet.getRange(1, 1, 1, VOTE_HEADERS.length);
    headerRange.setBackground("#1B2A6B");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);  // timestamp
    sheet.setColumnWidth(2, 180);  // name
    sheet.setColumnWidth(3, 200);  // email
  }

  return sheet;
}

/**
 * Wrap a JS object as a JSON ContentService response.
 */
function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ─────────────────────────────────────────────
   Manual setup helper — run once from the editor
   to initialise both sheets before going live.
───────────────────────────────────────────── */
function setupSheets() {
  getVotesSheet_();
  getVotingOpen_(); // also triggers Config sheet creation if missing
  Logger.log("Sheets initialised. Ready to deploy as Web App.");
}
