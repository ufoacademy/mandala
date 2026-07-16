const test = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('../api/log-diagnosis');

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
  const handler = createHandler({ postLead: async () => {}, sheetsWebhookUrl: null });
  const req = { method: 'GET', body: {} };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 405);
});

test('rejects request with missing areaScores as 400', async () => {
  const handler = createHandler({ postLead: async () => {}, sheetsWebhookUrl: null });
  const req = { method: 'POST', body: { id: 'x1', totalScore: 100 } };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
});

test('rejects request with areaScores that does not have exactly 8 items as 400', async () => {
  const handler = createHandler({ postLead: async () => {}, sheetsWebhookUrl: null });
  const req = { method: 'POST', body: { id: 'x1', areaScores: makeAreaScores().slice(0, 3), totalScore: 60 } };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
});

test('returns 200 without calling postLead when sheetsWebhookUrl is not configured', async () => {
  let called = false;
  const handler = createHandler({
    postLead: async () => { called = true; },
    sheetsWebhookUrl: null,
  });
  const req = { method: 'POST', body: { id: 'x1', areaScores: makeAreaScores(), lowScoreItems: [], totalScore: 160 } };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(called, false);
});

test('posts type "diagnosis" with id, areaScores, lowScoreItems, totalScore to sheets webhook', async () => {
  let postedPayload = null;
  const handler = createHandler({
    postLead: async (url, payload) => {
      postedPayload = payload;
    },
    sheetsWebhookUrl: 'https://example.com/webhook',
  });
  const req = {
    method: 'POST',
    body: {
      id: 'x1',
      areaScores: makeAreaScores(),
      lowScoreItems: [{ code: '1-A-1', question: '나는 채소 반찬이나 쌈과 함께 식사한다.' }],
      totalScore: 160,
    },
  };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(postedPayload.type, 'diagnosis');
  assert.equal(postedPayload.id, 'x1');
  assert.equal(postedPayload.totalScore, 160);
  assert.deepEqual(postedPayload.areaScores, makeAreaScores());
  assert.deepEqual(postedPayload.lowScoreItems, [{ code: '1-A-1', question: '나는 채소 반찬이나 쌈과 함께 식사한다.' }]);
});

test('defaults lowScoreItems to empty array when omitted', async () => {
  let postedPayload = null;
  const handler = createHandler({
    postLead: async (url, payload) => {
      postedPayload = payload;
    },
    sheetsWebhookUrl: 'https://example.com/webhook',
  });
  const req = { method: 'POST', body: { id: 'x1', areaScores: makeAreaScores(), totalScore: 160 } };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(postedPayload.lowScoreItems, []);
});

test('webhook failure does not block the 200 response (best-effort)', async () => {
  const handler = createHandler({
    postLead: async () => { throw new Error('network error'); },
    sheetsWebhookUrl: 'https://example.com/webhook',
  });
  const req = { method: 'POST', body: { id: 'x1', areaScores: makeAreaScores(), totalScore: 160 } };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
});

test('awaits postLead before responding (regression: fire-and-forget got cut off by the serverless runtime before the sheet write completed)', async () => {
  let webhookResolved = false;
  const handler = createHandler({
    postLead: async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      webhookResolved = true;
    },
    sheetsWebhookUrl: 'https://example.com/webhook',
  });
  const req = { method: 'POST', body: { id: 'x1', areaScores: makeAreaScores(), totalScore: 160 } };
  const res = mockRes();
  await handler(req, res);
  assert.equal(webhookResolved, true, 'handler must await postLead, not fire-and-forget it');
  assert.equal(res.statusCode, 200);
});
