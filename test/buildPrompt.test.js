const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPrompt } = require('../lib/buildPrompt');

function makeAreaScores() {
  return Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `영역${i + 1}`,
    sub: `서브${i + 1}`,
    score: 20,
    pctVal: 63,
  }));
}

test('throws when areaScores is missing', () => {
  assert.throws(() => buildPrompt({ name: '홍길동', totalScore: 160 }), /areaScores/);
});

test('throws when areaScores does not have exactly 8 items', () => {
  assert.throws(
    () => buildPrompt({ name: '홍길동', areaScores: makeAreaScores().slice(0, 3), totalScore: 60 }),
    /areaScores/,
  );
});

test('includes the person name in the user message', () => {
  const result = buildPrompt({ name: '홍길동', areaScores: makeAreaScores(), totalScore: 160 });
  assert.match(result.messages[0].content, /홍길동/);
});

test('includes all 8 area score lines', () => {
  const result = buildPrompt({ name: '홍길동', areaScores: makeAreaScores(), totalScore: 160 });
  for (let i = 1; i <= 8; i++) {
    assert.match(result.messages[0].content, new RegExp(`영역${i}`));
  }
});

test('shows placeholder text when checkupSummary is empty', () => {
  const result = buildPrompt({ name: '홍길동', areaScores: makeAreaScores(), checkupSummary: [], totalScore: 160 });
  assert.match(result.messages[0].content, /검진수치 데이터 없음/);
});

test('shows placeholder text when checkupSummary is null', () => {
  const result = buildPrompt({ name: '홍길동', areaScores: makeAreaScores(), checkupSummary: null, totalScore: 160 });
  assert.match(result.messages[0].content, /검진수치 데이터 없음/);
});

test('includes checkup lines when checkupSummary has items', () => {
  const result = buildPrompt({
    name: '홍길동',
    areaScores: makeAreaScores(),
    checkupSummary: [{ key: 'fbg', name: '공복혈당', value: 107, unit: 'mg/dL', status: 'gz' }],
    totalScore: 160,
  });
  assert.match(result.messages[0].content, /공복혈당/);
  assert.match(result.messages[0].content, /107/);
});

test('includes nutrition hint (supp) in checkup lines when present', () => {
  const result = buildPrompt({
    name: '홍길동',
    areaScores: makeAreaScores(),
    checkupSummary: [{ key: 'fbg', name: '공복혈당', value: 107, unit: 'mg/dL', status: 'gz', supp: '베르베린, 마그네슘, 크롬' }],
    totalScore: 160,
  });
  assert.match(result.messages[0].content, /영양 힌트/);
  assert.match(result.messages[0].content, /베르베린/);
});

test('system prompt instructs not to invent numbers', () => {
  const result = buildPrompt({ name: '홍길동', areaScores: makeAreaScores(), totalScore: 160 });
  assert.match(result.system, /숫자/);
});

test('system prompt instructs nutritionPlan to cite official evidence sources', () => {
  const result = buildPrompt({ name: '홍길동', areaScores: makeAreaScores(), totalScore: 160 });
  assert.match(result.system, /evidenceSource/);
  assert.match(result.system, /WHO/);
});

test('system prompt instructs evidence-based, motivation-driven tone across all sections', () => {
  const result = buildPrompt({ name: '홍길동', areaScores: makeAreaScores(), totalScore: 160 });
  assert.match(result.system, /오늘|이번 주/);
  assert.match(result.system, /동기부여/);
  assert.match(result.system, /finalConclusion/);
});
