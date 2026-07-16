const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ageToHiraBracket,
  filterChronicDiseases,
  fetchAgeGroupDiseaseStats,
  CHRONIC_DISEASE_KCD_PREFIXES,
} = require('../lib/hiraAgeGroupStats');

test('ageToHiraBracket buckets ages into 10-year brackets', () => {
  assert.equal(ageToHiraBracket('45'), '40~49세');
  assert.equal(ageToHiraBracket('40'), '40~49세');
  assert.equal(ageToHiraBracket('49'), '40~49세');
  assert.equal(ageToHiraBracket('9'), '0~9세');
  assert.equal(ageToHiraBracket('72'), '70~79세');
});

test('ageToHiraBracket returns null for missing or invalid age', () => {
  assert.equal(ageToHiraBracket(''), null);
  assert.equal(ageToHiraBracket(undefined), null);
  assert.equal(ageToHiraBracket('abc'), null);
  assert.equal(ageToHiraBracket('-5'), null);
});

test('filterChronicDiseases keeps only codes matching the chronic-disease allowlist', () => {
  const raw = [
    { name: '급성 비인두염(감기)', code: 'J00', count: 500 },
    { name: '2형 당뇨병', code: 'E11', count: 300 },
    { name: '본태성(원발성) 고혈압', code: 'I10', count: 450 },
    { name: '치은염 및 치주질환', code: 'K05', count: 200 },
  ];
  const result = filterChronicDiseases(raw);
  const names = result.map((d) => d.name);
  assert.ok(names.includes('2형 당뇨병'));
  assert.ok(names.includes('본태성(원발성) 고혈압'));
  assert.ok(!names.includes('급성 비인두염(감기)'));
  assert.ok(!names.includes('치은염 및 치주질환'));
});

test('filterChronicDiseases sorts remaining items by count descending', () => {
  const raw = [
    { name: '2형 당뇨병', code: 'E11', count: 100 },
    { name: '본태성(원발성) 고혈압', code: 'I10', count: 450 },
  ];
  const result = filterChronicDiseases(raw);
  assert.equal(result[0].name, '본태성(원발성) 고혈압');
  assert.equal(result[1].name, '2형 당뇨병');
});

test('filterChronicDiseases returns empty array for empty or missing input', () => {
  assert.deepEqual(filterChronicDiseases([]), []);
  assert.deepEqual(filterChronicDiseases(null), []);
  assert.deepEqual(filterChronicDiseases(undefined), []);
});

test('CHRONIC_DISEASE_KCD_PREFIXES includes core metabolic/lifestyle disease codes', () => {
  assert.ok(CHRONIC_DISEASE_KCD_PREFIXES.some((p) => p.startsWith('E1')), 'should cover diabetes (E10-E14)');
  assert.ok(CHRONIC_DISEASE_KCD_PREFIXES.some((p) => p.startsWith('I1')), 'should cover hypertension (I10-I15)');
});

test('fetchAgeGroupDiseaseStats returns null when apiKey is not configured', async () => {
  const result = await fetchAgeGroupDiseaseStats({ age: '45', gender: 'm', apiKey: null });
  assert.equal(result, null);
});

test('fetchAgeGroupDiseaseStats returns null when age is missing or invalid (even with apiKey)', async () => {
  const result = await fetchAgeGroupDiseaseStats({ age: '', gender: 'm', apiKey: 'fake-key' });
  assert.equal(result, null);
});
