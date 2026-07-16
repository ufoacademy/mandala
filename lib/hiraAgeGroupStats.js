// 건강보험심사평가원(HIRA) 질병정보서비스 Open API 연동.
// 데이터 출처: https://www.data.go.kr/data/15119055/openapi.do
//
// HIRA의 "다빈도 질병" 원본 데이터는 감기·치과질환 등 습관 개선과 무관한 항목까지
// 모두 포함하므로, 건강만다라가 다루는 습관성 만성질환(대사증후군 계열)으로만 좁혀서 쓴다.
const CHRONIC_DISEASE_KCD_PREFIXES = [
  'E10', 'E11', 'E12', 'E13', 'E14', // 당뇨병
  'I10', 'I11', 'I12', 'I13', 'I15', // 고혈압
  'E78', // 이상지질혈증(고지혈증)
  'E66', // 비만
  'K76.0', // 비알코올성 지방간
  'E88.81', // 대사증후군
];

function isChronicDiseaseCode(code) {
  if (!code) return false;
  return CHRONIC_DISEASE_KCD_PREFIXES.some((prefix) => code.startsWith(prefix));
}

// 만 나이를 HIRA 통계가 쓰는 10세 구간(예: "40~49세")으로 변환한다.
function ageToHiraBracket(age) {
  const n = parseInt(age, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  const bracketStart = Math.floor(n / 10) * 10;
  return `${bracketStart}~${bracketStart + 9}세`;
}

// raw: [{ name, code, count }, ...] — HIRA 응답을 이 형태로 정규화한 뒤 넘긴다.
// 만성질환 코드만 남기고 환자 수(count) 내림차순으로 정렬해서 반환한다.
function filterChronicDiseases(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && isChronicDiseaseCode(item.code))
    .sort((a, b) => (b.count || 0) - (a.count || 0));
}

// 실제 HIRA API 호출부. 서비스키(HIRA_API_KEY)가 없으면 항상 null을 반환해
// 이 기능 전체가 조용히 비활성화된다 (리포트 생성 자체는 영향받지 않음).
//
// TODO: data.go.kr에서 서비스키 발급 후, 실제 API를 한 번 호출해 정확한
// 엔드포인트 URL·요청 파라미터·응답 필드명을 확인하고 아래 본문을 완성한다.
// 현재는 요청 자체를 보내지 않고 항상 null을 반환한다 — 추측으로 잘못된
// 엔드포인트/파라미터를 만들어내지 않기 위함.
async function fetchAgeGroupDiseaseStats({ age, gender, apiKey }) {
  if (!apiKey) return null;
  const bracket = ageToHiraBracket(age);
  if (!bracket) return null;

  // 실제 구현 전까지는 항상 null (기능 비활성 상태).
  return null;
}

module.exports = {
  ageToHiraBracket,
  filterChronicDiseases,
  fetchAgeGroupDiseaseStats,
  isChronicDiseaseCode,
  CHRONIC_DISEASE_KCD_PREFIXES,
};
