var LOWSCORE_SHEET_NAME = '1점문항추적';
var DIM_LETTERS = ['A', 'B', 'C', 'D'];
var AREA_LABELS = ['식', '동', '휴', '심', '환', '연', '지', '락'];

function buildLowScoreCodes() {
  var codes = [];
  for (var areaId = 1; areaId <= 8; areaId++) {
    for (var li = 0; li < DIM_LETTERS.length; li++) {
      for (var qi = 1; qi <= 2; qi++) {
        codes.push(areaId + '-' + DIM_LETTERS[li] + '-' + qi);
      }
    }
  }
  return codes;
}

function getOrCreateLowScoreSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(LOWSCORE_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(LOWSCORE_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    var header = ['ID', '날짜', '총점'];
    for (var i = 0; i < AREA_LABELS.length; i++) {
      header.push(AREA_LABELS[i] + '(%)');
    }
    header = header.concat(buildLowScoreCodes());
    sheet.appendRow(header);
  }
  return sheet;
}

function appendDiagnosisRow(data) {
  var sheet = getOrCreateLowScoreSheet();
  var codes = buildLowScoreCodes();

  var questionByCode = {};
  var lowScoreItems = data.lowScoreItems || [];
  for (var i = 0; i < lowScoreItems.length; i++) {
    var item = lowScoreItems[i];
    if (item && item.code) {
      questionByCode[item.code] = item.question || '';
    }
  }

  var pctByAreaId = {};
  var areaScores = data.areaScores || [];
  for (var j = 0; j < areaScores.length; j++) {
    pctByAreaId[areaScores[j].id] = areaScores[j].pctVal;
  }

  var row = [
    data.id || '',
    new Date(data.timestamp || new Date()),
    data.totalScore != null ? data.totalScore : '',
  ];
  for (var areaId = 1; areaId <= 8; areaId++) {
    row.push(pctByAreaId[areaId] != null ? pctByAreaId[areaId] : '');
  }
  for (var k = 0; k < codes.length; k++) {
    row.push(questionByCode[codes[k]] || '');
  }

  sheet.appendRow(row);
}

function appendPremiumLeadRow(data) {
  // 활성 탭(getActiveSheet)에 의존하면, 사용자가 마지막으로 어느 탭을 보고 있었는지에 따라
  // 엉뚱한 탭에 기록될 수 있다. 인적사항 탭은 항상 첫 번째 탭(스프레드시트 생성 시 기본 탭)이라고
  // 가정하고 위치로 고정 참조한다.
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.appendRow([
    new Date(data.timestamp || new Date()),
    data.name || '',
    data.age || '',
    data.gender || '',
    data.email || '',
    data.contact || '',
    data.totalScore != null ? data.totalScore : '',
    data.weakArea1 || '',
    data.weakArea2 || '',
    data.weakArea3 || '',
    data.id || '',
  ]);
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  if (data.type === 'diagnosis') {
    appendDiagnosisRow(data);
  } else {
    appendPremiumLeadRow(data);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
