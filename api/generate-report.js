const Anthropic = require('@anthropic-ai/sdk');
const { validateLead } = require('../lib/validateLead');
const { buildPrompt } = require('../lib/buildPrompt');
const { REPORT_SCHEMA } = require('../lib/reportSchema');

function createHandler({ createAnthropicClient, postLead, sheetsWebhookUrl }) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method_not_allowed' });
      return;
    }

    const body = req.body || {};
    const { name, contact, honeypot, areaScores, checkupSummary, totalScore } = body;

    const lead = validateLead({ name, contact, honeypot });
    if (!lead.valid) {
      res.status(400).json({ error: 'invalid_input', details: lead.errors });
      return;
    }

    let prompt;
    try {
      prompt = buildPrompt({ name: lead.name, areaScores, checkupSummary, totalScore });
    } catch (err) {
      res.status(400).json({ error: 'invalid_scores', message: err.message });
      return;
    }

    if (sheetsWebhookUrl) {
      postLead(sheetsWebhookUrl, {
        name: lead.name,
        contact: lead.contact,
        timestamp: new Date().toISOString(),
        totalScore: totalScore ?? null,
      }).catch((err) => {
        console.error('lead webhook failed', err);
      });
    }

    try {
      const client = createAnthropicClient();
      const response = await client.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 8000,
        system: prompt.system,
        messages: prompt.messages,
        output_config: { format: { type: 'json_schema', schema: REPORT_SCHEMA } },
      });
      const textBlock = response.content.find((b) => b.type === 'text');
      const report = JSON.parse(textBlock.text);
      res.status(200).json({ report });
    } catch (err) {
      console.error('claude request failed', err);
      res.status(502).json({ error: 'report_generation_failed' });
    }
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
  createAnthropicClient: () => new Anthropic(),
  postLead: realPostLead,
  sheetsWebhookUrl: process.env.SHEETS_WEBHOOK_URL,
});

module.exports = defaultHandler;
module.exports.createHandler = createHandler;
