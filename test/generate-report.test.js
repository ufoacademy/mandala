const test = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('../api/generate-report');

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function makeAreaScores() {
  const pctVals = [63, 40, 90, 25, 75, 50, 85, 60];
  return Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `영역${i + 1}`,
    sub: `서브${i + 1}`,
    score: 20,
    pctVal: pctVals[i],
  }));
}

function validBody(overrides = {}) {
  return {
    name: '홍길동',
    age: '35',
    gender: 'm',
    contact: '010-1234-5678',
    email: 'hong@example.com',
    consent: true,
    honeypot: '',
    areaScores: makeAreaScores(),
    checkupSummary: null,
    totalScore: 160,
    ...overrides,
  };
}

test('rejects non-POST requests with 405', async () => {
  const handler = createHandler({
    createAnthropicClient: () => ({}),
    postLead: async () => {},
    sheetsWebhookUrl: null,
  });
  const req = { method: 'GET', body: {} };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 405);
});

test('rejects request with filled honeypot as 400 without calling Claude', async () => {
  let claudeCalled = false;
  const handler = createHandler({
    createAnthropicClient: () => ({
      messages: { create: async () => { claudeCalled = true; throw new Error('should not be called'); } },
    }),
    postLead: async () => {},
    sheetsWebhookUrl: null,
  });
  const req = { method: 'POST', body: validBody({ honeypot: 'bot' }) };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(claudeCalled, false);
});

test('rejects invalid contact as 400', async () => {
  const handler = createHandler({
    createAnthropicClient: () => ({}),
    postLead: async () => {},
    sheetsWebhookUrl: null,
  });
  const req = { method: 'POST', body: validBody({ contact: 'not-a-phone' }) };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.details.includes('invalid_contact'));
});

test('rejects missing consent as 400', async () => {
  const handler = createHandler({
    createAnthropicClient: () => ({}),
    postLead: async () => {},
    sheetsWebhookUrl: null,
  });
  const req = { method: 'POST', body: validBody({ consent: false }) };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.details.includes('consent_required'));
});

test('returns generated report JSON on success', async () => {
  const fakeReport = {
    greeting: '안녕하세요',
    coreInsights: ['a', 'b', 'c', 'd'],
    areaInterpretations: [],
    pairedSections: [],
    priorityExplanation: 'x',
    roadmap12Week: [],
    finalConclusion: { oneLineSummary: 's', whyStrong: 'w', finalProposal: 'f' },
  };
  const handler = createHandler({
    createAnthropicClient: () => ({
      messages: {
        create: async () => ({ content: [{ type: 'text', text: JSON.stringify(fakeReport) }] }),
      },
    }),
    postLead: async () => {},
    sheetsWebhookUrl: null,
  });
  const req = { method: 'POST', body: validBody() };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.report, fakeReport);
});

test('requests enough max_tokens headroom for thinking + full report (regression: 8000 truncated real responses)', async () => {
  const fakeReport = {
    greeting: 'g', coreInsights: ['a', 'b', 'c', 'd'], areaInterpretations: [], pairedSections: [],
    priorityExplanation: 'x', roadmap12Week: [], finalConclusion: { oneLineSummary: 's', whyStrong: 'w', finalProposal: 'f' },
  };
  let capturedParams = null;
  const handler = createHandler({
    createAnthropicClient: () => ({
      messages: {
        create: async (params) => {
          capturedParams = params;
          return { content: [{ type: 'text', text: JSON.stringify(fakeReport) }] };
        },
      },
    }),
    postLead: async () => {},
    sheetsWebhookUrl: null,
  });
  const req = { method: 'POST', body: validBody() };
  const res = mockRes();
  await handler(req, res);
  assert.ok(capturedParams.max_tokens >= 16000, `max_tokens too low: ${capturedParams.max_tokens}`);
});

test('clamps coreInsights and pairedSections to 4 items when Claude overshoots (schema cannot enforce minItems/maxItems)', async () => {
  const oversizedReport = {
    greeting: '안녕하세요',
    coreInsights: ['a', 'b', 'c', 'd', 'stray extra item'],
    areaInterpretations: [],
    pairedSections: [
      { title: '1', leftNarrative: '', rightNarrative: '', executionTranslation: '', monthlyMission: '' },
      { title: '2', leftNarrative: '', rightNarrative: '', executionTranslation: '', monthlyMission: '' },
      { title: '3', leftNarrative: '', rightNarrative: '', executionTranslation: '', monthlyMission: '' },
      { title: '4', leftNarrative: '', rightNarrative: '', executionTranslation: '', monthlyMission: '' },
      { title: '5 stray', leftNarrative: '', rightNarrative: '', executionTranslation: '', monthlyMission: '' },
    ],
    priorityExplanation: 'x',
    roadmap12Week: [],
    finalConclusion: { oneLineSummary: 's', whyStrong: 'w', finalProposal: 'f' },
  };
  const handler = createHandler({
    createAnthropicClient: () => ({
      messages: { create: async () => ({ content: [{ type: 'text', text: JSON.stringify(oversizedReport) }] }) },
    }),
    postLead: async () => {},
    sheetsWebhookUrl: null,
  });
  const req = { method: 'POST', body: validBody() };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.report.coreInsights.length, 4);
  assert.deepEqual(res.body.report.coreInsights, ['a', 'b', 'c', 'd']);
  assert.equal(res.body.report.pairedSections.length, 4);
  assert.equal(res.body.report.pairedSections[3].title, '4');
});

test('posts lead to sheets webhook when configured (best-effort, does not block response)', async () => {
  let postedPayload = null;
  const fakeReport = {
    greeting: 'g', coreInsights: ['a', 'b', 'c', 'd'], areaInterpretations: [], pairedSections: [],
    priorityExplanation: 'x', roadmap12Week: [], finalConclusion: { oneLineSummary: 's', whyStrong: 'w', finalProposal: 'f' },
  };
  const handler = createHandler({
    createAnthropicClient: () => ({
      messages: { create: async () => ({ content: [{ type: 'text', text: JSON.stringify(fakeReport) }] }) },
    }),
    postLead: async (url, payload) => {
      postedPayload = payload;
    },
    sheetsWebhookUrl: 'https://example.com/webhook',
  });
  const req = { method: 'POST', body: validBody() };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(postedPayload.name, '홍길동');
  assert.equal(postedPayload.contact, '010-1234-5678');
  assert.equal(postedPayload.email, 'hong@example.com');
  assert.equal(postedPayload.age, '35');
  assert.equal(postedPayload.gender, 'm');
  assert.equal(postedPayload.totalScore, 160);
  assert.equal(postedPayload.weakArea1, '영역4 25%');
  assert.equal(postedPayload.weakArea2, '영역2 40%');
  assert.equal(postedPayload.weakArea3, '영역6 50%');
});

test('returns 502 when Claude call fails', async () => {
  const handler = createHandler({
    createAnthropicClient: () => ({
      messages: { create: async () => { throw new Error('network error'); } },
    }),
    postLead: async () => {},
    sheetsWebhookUrl: null,
  });
  const req = { method: 'POST', body: validBody() };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 502);
});
