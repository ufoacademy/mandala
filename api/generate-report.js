const Anthropic = require('@anthropic-ai/sdk');
const { validateLead } = require('../lib/validateLead');
const { buildPrompt } = require('../lib/buildPrompt');
const { REPORT_SCHEMA } = require('../lib/reportSchema');

function getWeakestAreas(areaScores, count = 3) {
  return [...areaScores]
    .sort((a, b) => a.pctVal - b.pctVal)
    .slice(0, count)
    .map((a) => `${a.name} ${a.pctVal}%`);
}

function createHandler({ createAnthropicClient, postLead, sheetsWebhookUrl }) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method_not_allowed' });
      return;
    }

    const body = req.body || {};
    const { id, name, age, gender, contact, email, consent, honeypot, areaScores, checkupSummary, totalScore, lowScoreItems } = body;

    const lead = validateLead({ name, age, gender, contact, email, consent, honeypot });
    if (!lead.valid) {
      res.status(400).json({ error: 'invalid_input', details: lead.errors });
      return;
    }

    let prompt;
    try {
      prompt = buildPrompt({ name: lead.name, areaScores, checkupSummary, totalScore, lowScoreItems });
    } catch (err) {
      res.status(400).json({ error: 'invalid_scores', message: err.message });
      return;
    }

    if (sheetsWebhookUrl) {
      // Awaited (not fire-and-forget): an un-awaited fetch here previously got cut off when
      // the serverless invocation ended, silently dropping the sheet write. Still best-effort —
      // a webhook failure is caught and logged, not surfaced to the client or allowed to block
      // report generation below.
      const weakAreas = Array.isArray(areaScores) ? getWeakestAreas(areaScores) : [];
      try {
        await postLead(sheetsWebhookUrl, {
          type: 'premium_lead',
          id: id || '',
          name: lead.name,
          age: lead.age,
          gender: lead.gender,
          contact: lead.contact,
          email: lead.email,
          timestamp: new Date().toISOString(),
          totalScore: totalScore ?? null,
          weakArea1: weakAreas[0] || '',
          weakArea2: weakAreas[1] || '',
          weakArea3: weakAreas[2] || '',
        });
      } catch (err) {
        console.error('lead webhook failed', err);
      }
    }

    try {
      const client = createAnthropicClient();
      // max_tokens is large enough that the SDK requires streaming (it refuses non-streaming
      // calls it estimates could run past 10 minutes) — stream() avoids that guard, then
      // finalMessage() gives us back the fully assembled response same as create() would.
      const stream = client.messages.stream({
        model: 'claude-sonnet-5',
        max_tokens: 32000,
        system: prompt.system,
        messages: prompt.messages,
        output_config: { format: { type: 'json_schema', schema: REPORT_SCHEMA } },
      });
      const response = await stream.finalMessage();
      const textBlock = response.content.find((b) => b.type === 'text');
      const report = JSON.parse(textBlock.text);
      // Claude's structured output (json_schema) doesn't support minItems/maxItems on arrays,
      // so exact counts are prompt-instructed only — clamp defensively in case the model overshoots.
      if (Array.isArray(report.coreInsights)) {
        report.coreInsights = report.coreInsights.slice(0, 4);
      }
      if (Array.isArray(report.pairedSections)) {
        report.pairedSections = report.pairedSections.slice(0, 4);
      }
      if (report.nutritionPlan && Array.isArray(report.nutritionPlan.recommendations)) {
        report.nutritionPlan.recommendations = report.nutritionPlan.recommendations.slice(0, 5);
      }
      if (Array.isArray(report.messagingExamples)) {
        report.messagingExamples = report.messagingExamples.slice(0, 4);
      }
      if (Array.isArray(report.grayZoneInsights)) {
        report.grayZoneInsights = report.grayZoneInsights.slice(0, 10);
      }
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
// Large max_tokens can push real generations past Vercel's default function duration.
// Observed a real generation take 117s against a 120s cap — too little margin, raised to 300s.
module.exports.config = { maxDuration: 300 };
