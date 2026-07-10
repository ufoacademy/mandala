const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    greeting: { type: 'string' },
    coreInsights: {
      type: 'array',
      items: { type: 'string' },
      minItems: 4,
      maxItems: 4,
    },
    areaInterpretations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          areaId: { type: 'integer' },
          summary: { type: 'string' },
        },
        required: ['areaId', 'summary'],
        additionalProperties: false,
      },
    },
    pairedSections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          leftNarrative: { type: 'string' },
          rightNarrative: { type: 'string' },
          executionTranslation: { type: 'string' },
          monthlyMission: { type: 'string' },
        },
        required: ['title', 'leftNarrative', 'rightNarrative', 'executionTranslation', 'monthlyMission'],
        additionalProperties: false,
      },
      minItems: 4,
      maxItems: 4,
    },
    priorityExplanation: { type: 'string' },
    roadmap12Week: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          week: { type: 'string' },
          action: { type: 'string' },
        },
        required: ['week', 'action'],
        additionalProperties: false,
      },
    },
    finalConclusion: {
      type: 'object',
      properties: {
        oneLineSummary: { type: 'string' },
        whyStrong: { type: 'string' },
        finalProposal: { type: 'string' },
      },
      required: ['oneLineSummary', 'whyStrong', 'finalProposal'],
      additionalProperties: false,
    },
  },
  required: [
    'greeting',
    'coreInsights',
    'areaInterpretations',
    'pairedSections',
    'priorityExplanation',
    'roadmap12Week',
    'finalConclusion',
  ],
  additionalProperties: false,
};

module.exports = { REPORT_SCHEMA };
