function createHandler({ postLead, sheetsWebhookUrl }) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method_not_allowed' });
      return;
    }

    const body = req.body || {};
    const { id, areaScores, lowScoreItems, totalScore } = body;

    if (!Array.isArray(areaScores) || areaScores.length !== 8) {
      res.status(400).json({ error: 'invalid_area_scores' });
      return;
    }

    if (sheetsWebhookUrl) {
      // Must be awaited: this function has no other async work to keep it alive, so an
      // un-awaited fetch can get cut off when the serverless invocation ends right after
      // the response is sent (verified in production — logged success, no sheet row).
      try {
        await postLead(sheetsWebhookUrl, {
          type: 'diagnosis',
          id: id || '',
          timestamp: new Date().toISOString(),
          totalScore: totalScore ?? null,
          areaScores,
          lowScoreItems: Array.isArray(lowScoreItems) ? lowScoreItems : [],
        });
      } catch (err) {
        console.error('diagnosis log webhook failed', err);
      }
    }

    res.status(200).json({ ok: true });
  };
}

async function realPostLead(url, payload) {
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

const defaultHandler = createHandler({
  postLead: realPostLead,
  sheetsWebhookUrl: process.env.SHEETS_WEBHOOK_URL,
});

module.exports = defaultHandler;
module.exports.createHandler = createHandler;
