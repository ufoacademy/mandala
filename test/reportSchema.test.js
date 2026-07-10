const test = require('node:test');
const assert = require('node:assert/strict');
const { REPORT_SCHEMA } = require('../lib/reportSchema');

test('schema type is object', () => {
  assert.equal(REPORT_SCHEMA.type, 'object');
});

test('schema requires all top-level report fields', () => {
  const expected = [
    'greeting',
    'coreInsights',
    'areaInterpretations',
    'pairedSections',
    'priorityExplanation',
    'roadmap12Week',
    'finalConclusion',
  ];
  for (const field of expected) {
    assert.ok(REPORT_SCHEMA.required.includes(field), `missing required field: ${field}`);
    assert.ok(REPORT_SCHEMA.properties[field], `missing property definition: ${field}`);
  }
});

test('coreInsights requires exactly 4 items', () => {
  assert.equal(REPORT_SCHEMA.properties.coreInsights.minItems, 4);
  assert.equal(REPORT_SCHEMA.properties.coreInsights.maxItems, 4);
});

test('pairedSections requires exactly 4 items with all narrative fields', () => {
  const paired = REPORT_SCHEMA.properties.pairedSections;
  assert.equal(paired.minItems, 4);
  assert.equal(paired.maxItems, 4);
  const requiredFields = ['title', 'leftNarrative', 'rightNarrative', 'executionTranslation', 'monthlyMission'];
  for (const field of requiredFields) {
    assert.ok(paired.items.required.includes(field), `missing paired section field: ${field}`);
  }
});

test('finalConclusion requires oneLineSummary, whyStrong, finalProposal', () => {
  const fc = REPORT_SCHEMA.properties.finalConclusion;
  assert.deepEqual(fc.required.sort(), ['finalProposal', 'oneLineSummary', 'whyStrong'].sort());
});

test('additionalProperties is false at top level to keep output predictable', () => {
  assert.equal(REPORT_SCHEMA.additionalProperties, false);
});
