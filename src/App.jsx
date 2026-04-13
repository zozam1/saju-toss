import { useState, useEffect, useRef } from 'react';
import { GoogleAdMob, TossAds } from '@apps-in-toss/web-bridge';

// ─── Ad IDs (콘솔에서 발급받은 ID로 교체) ────────────────────────────────────
const BANNER_AD_ID = 'YOUR_BANNER_AD_ID';
const REWARDED_AD_ID = 'YOUR_REWARDED_AD_ID';
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const USER_KEY = 'saju_user_v1';
const UNLOCK_KEY = 'saju_unlock_v1';

// ─── 사주 상수 ────────────────────────────────────────────────────────────────
const STEMS = ['갑','을','병','정','무','기','경','신','임','계'];
const BRANCHES = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
const ZODIAC = ['쥐','소','호랑이','토끼','용','뱀','말','양','원숭이','닭','개','돼지'];
const ELEM_BY_STEM = [0,0,1,1,2,2,3,3,4,4];
const ELEM_BY_BRANCH = [4,2,0,0,2,1,1,2,3,3,2,4];
const ELEM_NAMES = ['목(木)','화(火)','토(土)','금(金)','수(水)'];
const ELEM_COLORS = ['#2E7D32','#B71C1C','#6D4C41','#F9A825','#1565C0'];

const HOUR_OPTIONS = [
  { label: '자시  23:00 ~ 01:00', b: 0 },
  { label: '축시  01:00 ~ 03:00', b: 1 },
  { label: '인시  03:00 ~ 05:00', b: 2 },
  { label: '묘시  05:00 ~ 07:00', b: 3 },
  { label: '진시  07:00 ~ 09:00', b: 4 },
  { label: '사시  09:00 ~ 11:00', b: 5 },
  { label: '오시  11:00 ~ 13:00', b: 6 },
  { label: '미시  13:00 ~ 15:00', b: 7 },
  { label: '신시  15:00 ~ 17:00', b: 8 },
  { label: '유시  17:00 ~ 19:00', b: 9 },
  { label: '술시  19:00 ~ 21:00', b: 10 },
  { label: '해시  21:00 ~ 23:00', b: 11 },
  { label: '모름', b: -1 },
];

const LVL_LABEL = ['대길', '길', '평', '주의', '흉'];
const LVL_COLOR = ['#C9A84C', '#3a8e3a', '#78909C', '#E65100', '#C62828'];
const LVL_BG    = ['#FFFBEB', '#F1F8F1', '#F5F5F5', '#FFF3E0', '#FFF5F5'];

// ─── 운세 텍스트 ──────────────────────────────────────────────────────────────
const FT = {
  total: [
    ['사주의 기운이 오늘과 완벽하게 조화를 이룹니다. 새로운 시작이나 중요한 결정을 내리기에 더없이 좋은 날입니다.',
     '막혀있던 일들이 자연스럽게 풀리는 날입니다. 오래 기다려온 기회가 드디어 문을 두드립니다.'],
    ['안정적인 흐름이 이어지는 하루입니다. 계획한 일을 차근차근 추진하면 예상보다 좋은 결과를 얻을 수 있습니다.',
     '집중력이 높아지고 대인관계에서 좋은 기운이 감돕니다. 서두르지 않아도 원하는 결과를 얻을 수 있습니다.'],
    ['크게 좋지도 나쁘지도 않은 평온한 하루입니다. 무리한 계획보다는 기본에 충실한 하루를 보내세요.',
     '잔잔한 흐름이 이어지는 날입니다. 새로운 도전보다 현재 진행 중인 일을 점검하는 데 집중하세요.'],
    ['기운이 다소 무거운 날입니다. 중요한 결정이나 큰 지출은 내일로 미루고, 말과 행동에 신중을 기하세요.',
     '작은 실수가 이어질 수 있는 날입니다. 서두르지 말고 한 번 더 확인하는 습관을 들이세요.'],
    ['여러 방면에서 걸림돌이 생기기 쉬운 날입니다. 새로운 일 시작은 피하고 기존 업무를 지키는 데 집중하세요.',
     '기운이 뒤틀리는 날입니다. 자신의 주장보다는 한 발 물러서 상황을 관망하는 것이 현명합니다.'],
  ],
  love: [
    ['사랑의 기운이 넘치는 날입니다. 마음을 전하면 통하는 날이니 고백이나 중요한 감정 표현을 하기에 좋습니다.',
     '새로운 인연을 만날 가능성이 높습니다. 커플이라면 관계가 한 단계 더 깊어지는 특별한 하루가 됩니다.'],
    ['따뜻한 감정의 교류가 이루어지는 날입니다. 평소보다 먼저 연락하거나 다가가 보세요.',
     '가까운 사람과의 유대감이 강해지는 날입니다. 진솔한 대화가 관계를 더욱 단단하게 만들어 줍니다.'],
    ['연애운은 무난한 편입니다. 특별한 변화보다 일상적인 교감을 유지하는 하루가 될 것입니다.',
     '소소한 배려로 관계를 가꾸기 좋은 날입니다. 큰 이벤트보다 작은 관심이 더 마음에 닿습니다.'],
    ['감정적인 오해가 생기기 쉬운 날입니다. 상대의 말을 있는 그대로 받아들이고 필요 이상의 의미를 부여하지 마세요.',
     '사소한 불협화음이 생길 수 있습니다. 자신의 의견보다 상대의 입장을 먼저 들어보세요.'],
    ['감정의 기복이 심해지기 쉬운 날입니다. 중요한 감정 표현이나 결정은 오늘 하루 보류하는 것이 좋습니다.',
     '오해와 갈등이 생기기 쉬운 날입니다. 작은 말 한마디가 큰 상처로 이어질 수 있음을 기억하세요.'],
  ],
  money: [
    ['재물의 기운이 강하게 흐르는 날입니다. 투자나 중요한 재무 상담을 진행하기에 좋은 타이밍입니다.',
     '예상치 못한 수입이나 좋은 기회가 찾아올 수 있습니다. 재물과 관련된 제안에 귀를 열어두세요.'],
    ['금전 흐름이 원활한 날입니다. 미뤄뒀던 재정 정리나 저축 계획을 세우기에 좋습니다.',
     '수고에 걸맞은 보상이 돌아오는 날입니다. 작은 노력도 금전적으로 이어질 수 있습니다.'],
    ['재물운은 잔잔한 편입니다. 불필요한 지출을 줄이고 예산 범위 안에서 소비하는 것이 이롭습니다.',
     '큰 이익도 큰 손실도 없는 평온한 흐름입니다. 충동구매는 피하고 계획된 지출만 하세요.'],
    ['돈이 나가기 쉬운 날입니다. 큰 결제나 투자는 며칠 뒤로 미루고 지갑 사정을 꼼꼼히 확인하세요.',
     '예상치 못한 지출이 생길 수 있습니다. 타인의 부탁으로 인한 금전 손실에 특히 주의하세요.'],
    ['재물 손실이 우려되는 날입니다. 투자나 계약, 보증 등 금전이 오가는 모든 결정을 오늘은 피하세요.',
     '지갑이 가벼워지기 쉬운 날입니다. 충동구매와 도박성 활동을 삼가고 빌려주는 것도 자제하세요.'],
  ],
  health: [
    ['몸과 마음이 활력으로 충만한 날입니다. 새로운 운동을 시작하거나 건강 검진을 받기에 좋습니다.',
     '강한 생명력이 감도는 날입니다. 평소 무리했던 부분이 회복되고 에너지가 넘치는 하루가 됩니다.'],
    ['컨디션이 좋은 날입니다. 가볍게 땀 흘리는 운동이 기력을 보충해 줄 것입니다.',
     '몸의 균형이 잘 잡히는 날입니다. 규칙적인 식사와 충분한 수면을 챙기면 더욱 활력이 넘칩니다.'],
    ['건강은 무난한 상태입니다. 무리하지 않고 적당한 휴식을 취하면서 일과를 유지하세요.',
     '큰 이상은 없지만 지나친 무리는 금물입니다. 수분 보충과 스트레칭으로 컨디션을 유지하세요.'],
    ['피로감이 쌓이기 쉬운 날입니다. 무리한 일정을 조정하고 충분한 휴식을 우선순위에 두세요.',
     '소화기와 관절에 주의가 필요한 날입니다. 자극적인 음식과 과음은 피하고 몸의 신호에 귀 기울이세요.'],
    ['몸의 저항력이 약해지기 쉬운 날입니다. 무리한 활동을 삼가고 급격한 기온 변화에 대비하세요.',
     '오래된 증상이 재발하거나 새로운 이상이 나타날 수 있습니다. 이상 신호가 느껴지면 빠르게 확인하세요.'],
  ],
};

const ADVICE = [
  '말보다 행동이 더 큰 신뢰를 만듭니다.',
  '서두름이 실수를 만듭니다. 한 박자 늦추세요.',
  '오늘의 작은 준비가 내일의 큰 차이를 만듭니다.',
  '주변의 도움에 감사하는 마음을 잊지 마세요.',
  '결과보다 과정에 집중하는 하루가 되세요.',
  '지금 이 순간에 충실한 것이 최선입니다.',
  '흘려보낼 것은 흘려보내야 새것이 들어옵니다.',
  '오늘의 피로는 오늘 풀어야 내일이 가볍습니다.',
  '작은 친절이 오늘의 운을 바꿉니다.',
  '무리한 욕심보다 균형이 더 큰 성취를 가져옵니다.',
  '오늘 하루도 나다운 하루를 만들어 가세요.',
  '남과 비교하지 말고 어제의 나와 비교하세요.',
];

const LUCKY_COLORS = ['빨간색','파란색','흰색','노란색','초록색','보라색','주황색','하늘색','분홍색','금색','검은색','베이지색'];

// 카테고리별 구체적 팁
const FT_TIP = {
  total: [
    '중요한 결정이나 미팅을 오늘 잡으세요. 무엇을 시작해도 좋은 날입니다.',
    '하고 싶었던 일을 추진하기에 좋습니다. 적극적으로 나서세요.',
    '평소 루틴을 유지하는 것이 가장 좋습니다. 무리하지 마세요.',
    '중요한 약속은 내일로 미루고 조용히 하루를 보내는 것을 권합니다.',
    '새로운 시도보다 기존 업무에만 집중하고 큰 결정은 피하세요.',
  ],
  love: [
    '좋아하는 사람에게 먼저 연락하거나 고백해보세요. 통할 가능성이 높습니다.',
    '가까운 사람과 따뜻한 시간을 보내보세요. 먼저 다가가는 것이 좋습니다.',
    '일상적인 안부 연락으로 관계를 유지하세요. 큰 변화보다 꾸준함이 중요합니다.',
    '감정적인 대화나 중요한 고백은 내일로 미루는 것이 좋습니다.',
    '혼자만의 시간을 갖고 감정을 정리해보세요. 표현은 나중에 하세요.',
  ],
  money: [
    '투자나 재테크 관련 결정을 내리기 좋은 날입니다. 과감하게 움직여보세요.',
    '미뤄둔 재정 정리나 저축 계획을 세우기에 좋습니다.',
    '예산 범위 안에서만 소비하고 불필요한 지출을 점검해보세요.',
    '큰 결제나 충동구매는 오늘 참는 것이 좋습니다. 카드를 꺼내기 전에 한번 더 생각하세요.',
    '오늘은 지갑을 닫는 날로 정하세요. 모든 금전 결정을 최소 3일 뒤로 미루세요.',
  ],
  health: [
    '새로운 운동을 시작하거나 건강검진을 예약하기 좋은 날입니다.',
    '가벼운 유산소 운동과 충분한 수면으로 컨디션을 더 높여보세요.',
    '규칙적인 식사와 수분 섭취를 잊지 마세요. 스트레칭을 자주 해주세요.',
    '무리한 운동은 피하고 충분한 휴식을 취하세요. 몸의 신호를 무시하지 마세요.',
    '오늘은 몸을 쉬게 하는 날로 정하세요. 무리한 일정과 야식을 피해주세요.',
  ],
};

// 일간별 특성
const STEM_DESC = [
  { name: '갑(甲)목', trait: '강한 추진력과 리더십을 가진 기질입니다. 새로운 시작에 강하고 성장 지향적입니다.' },
  { name: '을(乙)목', trait: '유연하고 섬세한 감수성을 지닙니다. 적응력이 뛰어나고 조화를 중시합니다.' },
  { name: '병(丙)화', trait: '밝고 활동적인 에너지가 넘칩니다. 사교성이 좋고 주변을 환하게 만드는 기질입니다.' },
  { name: '정(丁)화', trait: '따뜻하고 섬세한 감성을 지닙니다. 집중력과 예술적 감각이 뛰어납니다.' },
  { name: '무(戊)토', trait: '듬직하고 포용력이 큽니다. 안정감을 주고 신뢰받는 성격입니다.' },
  { name: '기(己)토', trait: '세심하고 현실적인 판단력이 강합니다. 꼼꼼하고 실용적인 기질입니다.' },
  { name: '경(庚)금', trait: '결단력이 강하고 의리를 중시합니다. 원칙적이고 카리스마 있는 성격입니다.' },
  { name: '신(辛)금', trait: '예리한 분석력과 심미안을 지닙니다. 완벽주의 성향이 강하고 세련됩니다.' },
  { name: '임(壬)수', trait: '지혜롭고 적응력이 탁월합니다. 다양한 분야에 재능이 있고 유연합니다.' },
  { name: '계(癸)수', trait: '깊은 통찰력과 감수성을 지닙니다. 내면이 풍부하고 직관력이 뛰어납니다.' },
];

// 오늘의 키워드 (fortune seed 기반)
const KEYWORDS = [
  ['집중','결단','전진'], ['소통','화합','인연'], ['절약','계획','준비'],
  ['휴식','회복','충전'], ['도전','변화','시작'], ['인내','신중','점검'],
  ['창의','표현','열정'], ['감사','나눔','배려'], ['정리','마무리','완성'],
  ['학습','성장','발전'],
];

// ─── 사주 계산 ────────────────────────────────────────────────────────────────
function getJDN(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) - 32045;
}

function calcDayPillar(year, month, day) {
  const idx = ((getJDN(year, month, day) - 2415021 + 10) % 60 + 60) % 60;
  return { stem: idx % 10, branch: idx % 12 };
}

function calcSaju(birthYear, birthMonth, birthDay, hourBranch) {
  const yearStem   = ((birthYear - 4) % 10 + 10) % 10;
  const yearBranch = ((birthYear - 4) % 12 + 12) % 12;

  const MONTH_BRANCHES = [1,2,3,4,5,6,7,8,9,10,11,0];
  const mb = MONTH_BRANCHES[birthMonth - 1];
  const ms = ([2,4,6,8,0][yearStem % 5] + ((mb - 2 + 12) % 12)) % 10;

  const dp = calcDayPillar(birthYear, birthMonth, birthDay);

  let hour = null;
  if (hourBranch >= 0) {
    const hs = ([0,2,4,6,8][dp.stem % 5] + hourBranch) % 10;
    hour = { stem: hs, branch: hourBranch };
  }

  return {
    year:  { stem: yearStem,   branch: yearBranch },
    month: { stem: ms,         branch: mb },
    day:   { stem: dp.stem,    branch: dp.branch },
    hour,
  };
}

function getOhang(saju) {
  const counts = [0,0,0,0,0];
  [saju.year, saju.month, saju.day, saju.hour].filter(Boolean).forEach(p => {
    counts[ELEM_BY_STEM[p.stem]]++;
    counts[ELEM_BY_BRANCH[p.branch]]++;
  });
  return counts;
}

// ─── 운세 생성 ────────────────────────────────────────────────────────────────
function fortuneSeed(user, today) {
  const n = user.birthYear * 10000 + user.birthMonth * 100 + user.birthDay;
  const d = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
  let h = (Math.imul(n, 1664525) + 1013904223) | 0;
  h ^= (Math.imul(d, 22695477) + 1) | 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x45d9f3b | 0);
  h ^= h >>> 16;
  return Math.abs(h) % 10000;
}

function getFortune(user, today) {
  const seed = fortuneSeed(user, today);
  const pick = (cat, offset) => {
    const level = (seed + offset) % 5;
    const texts = FT[cat][level];
    return { level, text: texts[Math.floor(seed / 10) % texts.length] };
  };
  return {
    total:  pick('total', 0),
    love:   pick('love', 3),
    money:  pick('money', 7),
    health: pick('health', 11),
    advice:      ADVICE[seed % ADVICE.length],
    luckyColor:  LUCKY_COLORS[seed % LUCKY_COLORS.length],
    luckyNumber: (seed % 9) + 1,
  };
}

// ─── Gemini AI ────────────────────────────────────────────────────────────────
async function askGemini(saju, ohang, today, question) {
  const p = (pillar) => pillar ? `${STEMS[pillar.stem]}${BRANCHES[pillar.branch]}` : '미상';
  const todayPillar = calcDayPillar(today.getFullYear(), today.getMonth()+1, today.getDate());
  const sajuStr = `연주 ${p(saju.year)} / 월주 ${p(saju.month)} / 일주 ${p(saju.day)} / 시주 ${p(saju.hour)}`;
  const ohangStr = ELEM_NAMES.map((n, i) => `${n} ${ohang[i]}개`).join(', ');
  const todayStr = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일 (${STEMS[todayPillar.stem]}${BRANCHES[todayPillar.branch]}일)`;

  const prompt = `당신은 30년 경력의 사주 전문가입니다. 아래 정보를 바탕으로 질문에 답해주세요.

[사주 정보]
사주: ${sajuStr}
일간(자아): ${STEMS[saju.day.stem]} — ${ELEM_NAMES[ELEM_BY_STEM[saju.day.stem]]}
오행 분포: ${ohangStr}
오늘: ${todayStr}

[질문]
${question}

답변은 한국어로 3~4문장, 200자 이내로 간결하게 작성해주세요. 사주 관점에서 구체적으로 조언해주세요.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '답변을 가져오지 못했습니다.';
}

// ─── 헬퍼 컴포넌트 ────────────────────────────────────────────────────────────
function Stars({ level }) {
  const filled = 5 - level;
  return (
    <span style={{ fontSize: 14, letterSpacing: 1 }}>
      <span style={{ color: LVL_COLOR[level] }}>{'★'.repeat(filled)}</span>
      <span style={{ color: '#D0D0D0' }}>{'★'.repeat(level)}</span>
    </span>
  );
}

function Pillar({ label, stem, branch }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{label}</div>
      <div style={{
        background: '#fff', border: '1px solid #E0E0EC', borderRadius: 8,
        padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      }}>
        <span style={{
          fontSize: 18, fontWeight: 700,
          color: ELEM_COLORS[ELEM_BY_STEM[stem]],
        }}>{STEMS[stem]}</span>
        <span style={{
          fontSize: 18, fontWeight: 700,
          color: ELEM_COLORS[ELEM_BY_BRANCH[branch]],
        }}>{BRANCHES[branch]}</span>
      </div>
    </div>
  );
}

function FortuneCard({ title, catKey, data }) {
  return (
    <div style={{
      background: LVL_BG[data.level],
      border: `1px solid ${LVL_COLOR[data.level]}33`,
      borderRadius: 12, padding: '16px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1C1C5E' }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Stars level={data.level} />
          <span style={{
            fontSize: 11, fontWeight: 700, color: LVL_COLOR[data.level],
            background: `${LVL_COLOR[data.level]}22`, padding: '2px 8px', borderRadius: 20,
          }}>{LVL_LABEL[data.level]}</span>
        </div>
      </div>
      <p style={{ fontSize: 13.5, lineHeight: 1.75, color: '#333', marginBottom: 10 }}>{data.text}</p>
      <div style={{
        borderTop: `1px solid ${LVL_COLOR[data.level]}22`,
        paddingTop: 10, display: 'flex', gap: 8, alignItems: 'flex-start',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: LVL_COLOR[data.level],
          background: `${LVL_COLOR[data.level]}18`, padding: '2px 7px',
          borderRadius: 6, whiteSpace: 'nowrap', marginTop: 1,
        }}>오늘의 팁</span>
        <p style={{ fontSize: 12.5, color: '#555', lineHeight: 1.65 }}>
          {FT_TIP[catKey][data.level]}
        </p>
      </div>
    </div>
  );
}

// ─── 앱 컴포넌트 ──────────────────────────────────────────────────────────────
export default function App() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // 유저 & 설정 상태
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [showSetup, setShowSetup] = useState(false);

  // 입력 폼 상태
  const [formYear,  setFormYear]  = useState(1995);
  const [formMonth, setFormMonth] = useState(1);
  const [formDay,   setFormDay]   = useState(1);
  const [formHour,  setFormHour]  = useState(-1);

  // 잠금 해제 상태 (하루 단위 리셋)
  const [unlocks, setUnlocks] = useState(() => {
    try {
      const d = JSON.parse(localStorage.getItem(UNLOCK_KEY));
      if (d?.date === todayStr) return d;
    } catch { /* noop */ }
    return { date: todayStr, detail: false, ai: false };
  });

  // AI 상태
  const [aiQ, setAiQ]           = useState('');
  const [aiA, setAiA]           = useState('');
  const [aiError, setAiError]   = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // 오행 설명 팝업
  const [showOhangInfo, setShowOhangInfo] = useState(false);

  // 광고 상태
  const [adLoaded, setAdLoaded] = useState(false);
  const bannerRef = useRef(null);

  // 폼 초기화 (편집 모드 진입 시)
  useEffect(() => {
    if (showSetup && user) {
      setFormYear(user.birthYear);
      setFormMonth(user.birthMonth);
      setFormDay(user.birthDay);
      setFormHour(user.hourBranch);
    }
  }, [showSetup]);

  // 광고 로드
  useEffect(() => {
    if (!user) return;

    if (bannerRef.current) {
      try {
        TossAds.initialize();
        TossAds.attachBanner(BANNER_AD_ID, bannerRef.current);
      } catch { /* 개발환경에서는 무시 */ }
    }

    try {
      if (GoogleAdMob.loadAppsInTossAdMob.isSupported?.()) {
        GoogleAdMob.loadAppsInTossAdMob({
          options: { adGroupId: REWARDED_AD_ID },
          onEvent: (e) => {
            if (e.type === 'loaded') setAdLoaded(true);
            if (e.type === 'failedToLoad') setAdLoaded(false);
          },
        });
      }
    } catch { /* 개발환경에서는 무시 */ }
  }, [user]);

  // 계산
  const saju   = user ? calcSaju(user.birthYear, user.birthMonth, user.birthDay, user.hourBranch) : null;
  const ohang  = saju ? getOhang(saju) : null;
  const fortune = user ? getFortune(user, today) : null;
  const todayPillar = calcDayPillar(today.getFullYear(), today.getMonth()+1, today.getDate());

  function saveUser() {
    const u = { birthYear: formYear, birthMonth: formMonth, birthDay: formDay, hourBranch: formHour };
    setUser(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setShowSetup(false);
    // 잠금 리셋 (새 유저면)
    const newUnlocks = { date: todayStr, detail: false, ai: false };
    setUnlocks(newUnlocks);
    localStorage.setItem(UNLOCK_KEY, JSON.stringify(newUnlocks));
  }

  function doUnlock(type) {
    const newUnlocks = { ...unlocks, [type]: true };
    setUnlocks(newUnlocks);
    localStorage.setItem(UNLOCK_KEY, JSON.stringify(newUnlocks));
  }

  function reloadAd() {
    try {
      if (GoogleAdMob.loadAppsInTossAdMob.isSupported?.()) {
        setAdLoaded(false);
        GoogleAdMob.loadAppsInTossAdMob({
          options: { adGroupId: REWARDED_AD_ID },
          onEvent: (e) => { if (e.type === 'loaded') setAdLoaded(true); },
        });
      }
    } catch { /* noop */ }
  }

  function showRewardedAd(type) {
    try {
      if (!adLoaded || !GoogleAdMob.showAppsInTossAdMob.isSupported?.()) {
        doUnlock(type);
        return;
      }
      GoogleAdMob.showAppsInTossAdMob({
        options: { adUnitId: REWARDED_AD_ID },
        onEvent: (e) => {
          if (e.type === 'userEarnedReward') doUnlock(type);
          if (e.type === 'closed' || e.type === 'failedToShow') reloadAd();
        },
      });
    } catch {
      doUnlock(type); // 개발환경 fallback
    }
  }

  async function handleAskAI() {
    if (!aiQ.trim() || aiLoading) return;
    setAiLoading(true);
    setAiA('');
    setAiError('');
    try {
      const answer = await askGemini(saju, ohang, today, aiQ);
      setAiA(answer);
    } catch (err) {
      console.error('Gemini error:', err);
      setAiError('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
    setAiLoading(false);
  }

  // ── 날짜 포맷 ──
  const DAYS_KO = ['일','월','화','수','목','금','토'];
  const dateLabel = `${today.getMonth()+1}월 ${today.getDate()}일 (${DAYS_KO[today.getDay()]})`;

  // ── 설정 화면 ──
  if (!user || showSetup) {
    const years = Array.from({ length: 81 }, (_, i) => 1940 + i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    return (
      <div style={{ padding: '0 20px 100px' }}>
        {/* 헤더 */}
        <div style={{
          padding: '24px 0 20px', textAlign: 'center',
          borderBottom: '1px solid #DDD8F0',
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1C1C5E', letterSpacing: -0.5 }}>오늘의 운세</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>사주 정보를 입력하면 매일 운세를 알려드립니다.</div>
        </div>

        {/* 폼 */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 8 }}>생년월일</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <select value={formYear} onChange={e => setFormYear(+e.target.value)}
              style={selectStyle}>
              {years.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
            <select value={formMonth} onChange={e => setFormMonth(+e.target.value)}
              style={{ ...selectStyle, flex: '0 0 72px' }}>
              {months.map(m => <option key={m} value={m}>{m}월</option>)}
            </select>
            <select value={formDay} onChange={e => setFormDay(+e.target.value)}
              style={{ ...selectStyle, flex: '0 0 72px' }}>
              {days.map(d => <option key={d} value={d}>{d}일</option>)}
            </select>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 8 }}>태어난 시</div>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 10 }}>모르는 경우 '모름'을 선택하세요.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 28 }}>
            {HOUR_OPTIONS.map(opt => (
              <button key={opt.b} onClick={() => setFormHour(opt.b)}
                style={{
                  padding: '10px 8px', borderRadius: 10, fontSize: 12.5,
                  border: formHour === opt.b ? '2px solid #1C1C5E' : '1px solid #DDD',
                  background: formHour === opt.b ? '#1C1C5E' : '#fff',
                  color: formHour === opt.b ? '#fff' : '#333',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}>
                {opt.label}
              </button>
            ))}
          </div>

          <button onClick={saveUser} style={primaryBtn}>
            운세 보기
          </button>

          {showSetup && (
            <button onClick={() => setShowSetup(false)} style={{ ...secondaryBtn, marginTop: 10 }}>
              취소
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── 메인 화면 ──
  const zodiacIdx = saju.year.branch;
  const dayStemElem = ELEM_BY_STEM[saju.day.stem];

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* 상단 헤더 */}
      <div style={{
        background: '#1C1C5E', padding: '20px 20px 24px', color: '#fff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 2 }}>{dateLabel}</div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>오늘의 운세</div>
          </div>
          <button onClick={() => setShowSetup(true)} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            color: '#fff', fontSize: 12, padding: '6px 12px', borderRadius: 20,
          }}>
            정보 수정
          </button>
        </div>

        {/* 사주 4주 */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>
            {ZODIAC[zodiacIdx]}띠 · 일간 {STEMS[saju.day.stem]}({ELEM_NAMES[dayStemElem]})
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Pillar label="연주" stem={saju.year.stem} branch={saju.year.branch} />
            <Pillar label="월주" stem={saju.month.stem} branch={saju.month.branch} />
            <Pillar label="일주" stem={saju.day.stem} branch={saju.day.branch} />
            {saju.hour
              ? <Pillar label="시주" stem={saju.hour.stem} branch={saju.hour.branch} />
              : <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>시주</div>
                  <div style={{
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8, padding: '10px 0', color: 'rgba(255,255,255,0.3)', fontSize: 12,
                  }}>미상</div>
                </div>
            }
          </div>
        </div>

        {/* 오늘 일진 */}
        <div style={{
          marginTop: 14, padding: '8px 12px',
          background: 'rgba(255,255,255,0.1)', borderRadius: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>오늘 일진</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {STEMS[todayPillar.stem]}{BRANCHES[todayPillar.branch]}일
          </span>
        </div>

        {/* 오행 분포 */}
        <div style={{
          marginTop: 10, padding: '8px 12px',
          background: 'rgba(255,255,255,0.1)', borderRadius: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>오행 분포</span>
            <button onClick={() => setShowOhangInfo(true)} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
              borderRadius: '50%', width: 18, height: 18, fontSize: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>?</button>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {ELEM_NAMES.map((n, i) => (
              <div key={i} style={{ textAlign: 'center', opacity: ohang[i] === 0 ? 0.3 : 1 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{n}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: ohang[i] === 0 ? '#ff8a80' : '#fff' }}>
                  {ohang[i] === 0 ? '✕' : ohang[i]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 오행 설명 팝업 */}
        {showOhangInfo && (
          <div onClick={() => setShowOhangInfo(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200,
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: '#fff', borderRadius: '20px 20px 0 0',
              padding: '24px 20px 40px', width: '100%', maxWidth: 480,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1C1C5E' }}>오행 분포란?</span>
                <button onClick={() => setShowOhangInfo(false)} style={{
                  background: '#F0F0F0', border: 'none', borderRadius: '50%',
                  width: 28, height: 28, fontSize: 14, cursor: 'pointer', color: '#555',
                }}>✕</button>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.75, color: '#444', marginBottom: 16 }}>
                사주팔자(연·월·일·시 4개 기둥)에 담긴 <strong>목·화·토·금·수</strong> 5가지 기운의 개수입니다.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[
                  { name: '목(木)', color: '#2E7D32', desc: '성장, 발전, 창의력' },
                  { name: '화(火)', color: '#B71C1C', desc: '열정, 표현력, 인기' },
                  { name: '토(土)', color: '#6D4C41', desc: '안정, 신뢰, 중재력' },
                  { name: '금(金)', color: '#F9A825', desc: '결단력, 의리, 추진력' },
                  { name: '수(水)', color: '#1565C0', desc: '지혜, 유연함, 감수성' },
                ].map(e => (
                  <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: e.color,
                      background: `${e.color}18`, padding: '3px 8px', borderRadius: 6, minWidth: 52, textAlign: 'center',
                    }}>{e.name}</span>
                    <span style={{ fontSize: 13, color: '#555' }}>{e.desc}</span>
                  </div>
                ))}
              </div>
              <div style={{
                background: '#FFF8F0', border: '1px solid #FFE0CC',
                borderRadius: 10, padding: '12px 14px',
              }}>
                <p style={{ fontSize: 13, color: '#C84B00', lineHeight: 1.7 }}>
                  <strong>✕ 표시 = 부족한 기운</strong><br />
                  해당 오행의 기운이 0개로, 삶에서 그 특성이 약하게 나타날 수 있습니다. AI 선생님께 부족한 기운을 어떻게 보완하면 좋을지 물어보세요.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 본문 */}
      <div style={{ padding: '20px 16px 0' }}>

        {/* 일간 특성 카드 */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 10,
        }}>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>나의 일간 특성</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 22, fontWeight: 800, color: ELEM_COLORS[ELEM_BY_STEM[saju.day.stem]],
              background: `${ELEM_COLORS[ELEM_BY_STEM[saju.day.stem]]}15`,
              width: 44, height: 44, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{STEMS[saju.day.stem]}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1C5E', marginBottom: 2 }}>
                {STEM_DESC[saju.day.stem].name}
              </div>
              <p style={{ fontSize: 12.5, color: '#666', lineHeight: 1.6 }}>
                {STEM_DESC[saju.day.stem].trait}
              </p>
            </div>
          </div>
        </div>

        {/* 오늘의 키워드 */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 10,
        }}>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 10 }}>오늘의 키워드</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {KEYWORDS[fortuneSeed(user, today) % KEYWORDS.length].map((kw, i) => (
              <span key={i} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                background: ['#EEF2FF','#F0FDF4','#FFFBEB'][i],
                color: ['#3730A3','#166534','#92400E'][i],
                border: `1px solid ${['#C7D2FE','#BBF7D0','#FDE68A'][i]}`,
              }}># {kw}</span>
            ))}
          </div>
        </div>

        {/* 운세 항목 별점 미리보기 */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 10,
        }}>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 12 }}>오늘의 운세 요약</div>
          {[
            { label: '총운', data: fortune.total },
            { label: '애정운', data: fortune.love },
            { label: '금전운', data: fortune.money },
            { label: '건강운', data: fortune.health },
          ].map(({ label, data }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: '1px solid #F0F0F0',
            }}>
              <span style={{ fontSize: 13.5, color: '#333', fontWeight: 500 }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Stars level={data.level} />
                <span style={{
                  fontSize: 11, fontWeight: 700, color: LVL_COLOR[data.level],
                  background: `${LVL_COLOR[data.level]}18`,
                  padding: '2px 8px', borderRadius: 20, minWidth: 28, textAlign: 'center',
                }}>{LVL_LABEL[data.level]}</span>
              </div>
            </div>
          ))}

          {/* 총평 */}
          {(() => {
            const cats = [
              { name: '총운', data: fortune.total },
              { name: '애정운', data: fortune.love },
              { name: '금전운', data: fortune.money },
              { name: '건강운', data: fortune.health },
            ];
            const avg = Math.round(cats.reduce((s, c) => s + c.data.level, 0) / 4);
            const best = cats.reduce((a, b) => a.data.level < b.data.level ? a : b);
            const worst = cats.reduce((a, b) => a.data.level > b.data.level ? a : b);
            const overallWord = ['매우 좋은','좋은','평범한','다소 주의가 필요한','어려운'][avg];
            const hasDiff = best.name !== worst.name && best.data.level !== worst.data.level;
            return (
              <div style={{
                marginTop: 12, background: '#F8F6FF',
                border: '1px solid #DDD8F0', borderRadius: 10, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>오늘의 총평</div>
                <p style={{ fontSize: 13.5, color: '#333', lineHeight: 1.75 }}>
                  오늘은 전반적으로 <strong style={{ color: LVL_COLOR[avg] }}>{overallWord}</strong> 기운이 흐르는 날입니다.
                  {hasDiff && ` 특히 ${best.name}에서 좋은 흐름이 보이며, ${worst.name}에는 다소 주의가 필요합니다.`}
                  {' '}상세한 내용과 오늘의 팁은 아래에서 확인해보세요.
                </p>
              </div>
            );
          })()}
        </div>

        {/* 자세히 보기 버튼 or 상세 운세 */}
        {!unlocks.detail ? (
          <button onClick={() => showRewardedAd('detail')} style={{
            ...primaryBtn, marginBottom: 16,
            background: 'linear-gradient(135deg, #1C1C5E, #3a3a8c)',
          }}>
            전체 운세 보기
            <span style={{ fontSize: 11, opacity: 0.75, marginLeft: 6 }}>(광고 시청 후 무료)</span>
          </button>
        ) : (
          <div style={{ marginBottom: 4 }}>
            <FortuneCard title="총운" catKey="total" data={fortune.total} />
            <FortuneCard title="애정운" catKey="love" data={fortune.love} />
            <FortuneCard title="금전운" catKey="money" data={fortune.money} />
            <FortuneCard title="건강운" catKey="health" data={fortune.health} />

            {/* 오늘의 조언 */}
            <div style={{
              background: '#F8F6FF', border: '1px solid #DDD8F0',
              borderRadius: 12, padding: '14px 16px', marginBottom: 10,
            }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>오늘의 조언</div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#1C1C5E', lineHeight: 1.6 }}>
                "{fortune.advice}"
              </p>
            </div>

            {/* 행운 아이템 */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 8, marginBottom: 16,
            }}>
              <div style={{
                background: '#fff', border: '1px solid #E8E8F0',
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>행운의 색</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{fortune.luckyColor}</div>
              </div>
              <div style={{
                background: '#fff', border: '1px solid #E8E8F0',
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>행운의 숫자</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#C9A84C' }}>{fortune.luckyNumber}</div>
              </div>
            </div>
          </div>
        )}

        {/* AI 질문 섹션 */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '18px 16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 12,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1C1C5E', marginBottom: 4 }}>사주 선생님께 질문</div>
          <div style={{ fontSize: 12.5, color: '#999', marginBottom: 14 }}>
            내 사주를 기반으로 AI가 직접 답해드립니다. (하루 1회)
          </div>

          {!unlocks.ai ? (
            <button onClick={() => showRewardedAd('ai')} style={{
              ...primaryBtn,
              background: 'linear-gradient(135deg, #C9A84C, #a07830)',
            }}>
              질문하기
              <span style={{ fontSize: 11, opacity: 0.8, marginLeft: 6 }}>(광고 시청 후 무료)</span>
            </button>
          ) : (
            <div>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <textarea
                  value={aiQ}
                  onChange={e => setAiQ(e.target.value.slice(0, 50))}
                  placeholder="질문을 입력하세요. (최대 50자)"
                  disabled={!!aiA}
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1px solid #DDD', borderRadius: 10,
                    fontSize: 13.5, resize: 'none', background: aiA ? '#F9F9F9' : '#fff',
                  }}
                />
                <div style={{ fontSize: 11, color: '#BBB', textAlign: 'right' }}>
                  {aiQ.length}/50
                </div>
              </div>

              {!aiA && (
                <button
                  onClick={handleAskAI}
                  disabled={!aiQ.trim() || aiLoading}
                  style={{
                    ...primaryBtn,
                    opacity: (!aiQ.trim() || aiLoading) ? 0.5 : 1,
                  }}>
                  {aiLoading ? '답변 생성 중...' : '답변 받기'}
                </button>
              )}

              {aiError && (
                <div style={{ marginTop: 10 }}>
                  <p style={{
                    fontSize: 13, color: '#E53935', marginBottom: 8,
                    background: '#FFF5F5', padding: '10px 12px', borderRadius: 8,
                  }}>{aiError}</p>
                  <button onClick={handleAskAI} style={{ ...primaryBtn }}>
                    다시 시도
                  </button>
                </div>
              )}

              {aiA && (
                <div style={{
                  background: '#F8F6FF', border: '1px solid #DDD8F0',
                  borderRadius: 10, padding: '14px', marginTop: 10,
                }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>사주 선생님의 답변</div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.75, color: '#333' }}>{aiA}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 면책 문구 */}
        <p style={{ fontSize: 11, color: '#BBB', textAlign: 'center', lineHeight: 1.6, padding: '4px 8px 16px' }}>
          본 운세는 사주 이론에 기반한 참고 정보이며,<br />
          실제 결과를 보장하지 않습니다.
        </p>
      </div>

      {/* 배너 광고 */}
      <div ref={bannerRef} style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, zIndex: 100, background: '#fff',
      }} />
    </div>
  );
}

// ─── 공용 스타일 ──────────────────────────────────────────────────────────────
const selectStyle = {
  flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 14,
  border: '1px solid #DDD', background: '#fff', color: '#333', appearance: 'auto',
};

const primaryBtn = {
  width: '100%', padding: '14px', borderRadius: 12, fontSize: 15,
  fontWeight: 600, color: '#fff', background: '#1C1C5E',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const secondaryBtn = {
  width: '100%', padding: '13px', borderRadius: 12, fontSize: 14,
  fontWeight: 500, color: '#555', background: '#F0F0F0',
};
