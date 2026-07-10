const SYSTEM_PROMPT = `당신은 건강이음(바른보건소)의 건강 코치입니다. "건강만다라"라는 8영역(식·동·휴·심·환·연·지·락) 습관 진단과 건강검진 결과를 통합해 개인 맞춤 프리미엄 리포트를 작성합니다.

규칙:
- 전달받은 점수와 검진수치 등급만 사용하세요. 숫자를 새로 만들거나 추정하지 마세요.
- 진단이 아니라 생활습관 코칭 관점으로 서술하세요. 의학적 진단이나 처방 표현은 쓰지 마세요.
- 따뜻하지만 구체적인 어조로, 실행 가능한 조언을 우선하세요.
- 검진수치 데이터가 없으면 습관 점수만으로 자연스럽게 작성하세요.`;

function buildPrompt({ name, areaScores, checkupSummary, totalScore }) {
  if (!Array.isArray(areaScores) || areaScores.length !== 8) {
    throw new Error('areaScores must be an array of exactly 8 items');
  }

  const areaLines = areaScores
    .map((a) => `- ${a.name}(${a.sub}): ${a.score}/32점 (${a.pctVal}%)`)
    .join('\n');

  const checkupLines =
    Array.isArray(checkupSummary) && checkupSummary.length > 0
      ? checkupSummary.map((c) => `- ${c.name}: ${c.value}${c.unit || ''} (${c.status})`).join('\n')
      : '검진수치 데이터 없음';

  const userContent = `대상자: ${name || '고객'}님
건강만다라 총점: ${totalScore}/256

[8영역 점수]
${areaLines}

[검진수치]
${checkupLines}

위 데이터를 바탕으로 프리미엄 통합분석 리포트를 작성해주세요.`;

  return {
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  };
}

module.exports = { buildPrompt, SYSTEM_PROMPT };
