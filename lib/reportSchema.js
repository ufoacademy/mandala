const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    greeting: { type: 'string' },
    coreInsights: {
      type: 'array',
      items: { type: 'string' },
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
    },
    priorityExplanation: { type: 'string' },
    nutritionPlan: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              evidenceSource: { type: 'string' },
            },
            required: ['title', 'description', 'evidenceSource'],
            additionalProperties: false,
          },
        },
      },
      required: ['summary', 'recommendations'],
      additionalProperties: false,
    },
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
    'nutritionPlan',
    'roadmap12Week',
    'finalConclusion',
  ],
  additionalProperties: false,
};

module.exports = { REPORT_SCHEMA };
