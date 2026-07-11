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

test('coreInsights has no minItems/maxItems (Claude structured output does not support array length constraints; exact count of 4 is enforced via prompt instructions)', () => {
  assert.equal(REPORT_SCHEMA.properties.coreInsights.minItems, undefined);
  assert.equal(REPORT_SCHEMA.properties.coreInsights.maxItems, undefined);
});

test('pairedSections has all narrative fields and no length constraints', () => {
  const paired = REPORT_SCHEMA.properties.pairedSections;
  assert.equal(paired.minItems, undefined);
  assert.equal(paired.maxItems, undefined);
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
