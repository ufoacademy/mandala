function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(data.timestamp || new Date()),
    data.name || '',
    data.age || '',
    data.gender || '',
    data.email || '',
    data.contact || '',
    data.totalScore != null ? data.totalScore : '',
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
