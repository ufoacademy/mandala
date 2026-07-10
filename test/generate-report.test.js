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
  return Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `영역${i + 1}`,
    sub: `서브${i + 1}`,
    score: 20,
    pctVal: 63,
  }));
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
  const req = {
    method: 'POST',
    body: { name: '홍길동', contact: '010-1234-5678', honeypot: 'bot', areaScores: makeAreaScores(), totalScore: 160 },
  };
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
  const req = {
    method: 'POST',
    body: { name: '홍길동', contact: 'not-a-phone', honeypot: '', areaScores: makeAreaScores(), totalScore: 160 },
  };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.details.includes('invalid_contact'));
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
  const req = {
    method: 'POST',
    body: {
      name: '홍길동',
      contact: '010-1234-5678',
      honeypot: '',
      areaScores: makeAreaScores(),
      checkupSummary: null,
      totalScore: 160,
    },
  };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.report, fakeReport);
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
  const req = {
    method: 'POST',
    body: { name: '홍길동', contact: '010-1234-5678', honeypot: '', areaScores: makeAreaScores(), totalScore: 160 },
  };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(postedPayload.name, '홍길동');
  assert.equal(postedPayload.contact, '010-1234-5678');
  assert.equal(postedPayload.totalScore, 160);
});

test('returns 502 when Claude call fails', async () => {
  const handler = createHandler({
    createAnthropicClient: () => ({
      messages: { create: async () => { throw new Error('network error'); } },
    }),
    postLead: async () => {},
    sheetsWebhookUrl: null,
  });
  const req = {
    method: 'POST',
    body: { name: '홍길동', contact: '010-1234-5678', honeypot: '', areaScores: makeAreaScores(), totalScore: 160 },
  };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 502);
});
