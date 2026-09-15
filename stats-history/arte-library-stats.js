/* ==========================================================================
   arte 라이브러리 — 통계 페이지 전용
   Figma 통계 확정본(fileKey MggyO8qQHuiYJRDenEWqlL, Section 1/2, 2026-09-08 확정) 기반 재구현.
   행정통계(4항목) · 조사통계(6항목) · 자료통계 3개 탭, 항목 클릭 시 콘텐츠 전환 + GSAP 스택 리빌.
   ========================================================================== */

(function () {
  'use strict';

  /* 2026-09-09 재확정: 연도별 스택 막대(관심도/만족도/참여동기/미참여이유/향후참여/참여율)의
     5색은 레인보우가 아니라 행정통계와 같은 블루 계열 그라데이션 — Figma 실측(관심도 차트) */
  var PALETTE = ['#173bff', '#007ade', '#39d1ff', '#80f4c2', '#76aaff'];
  var BLUE_ONLY = ['#007ade'];
  var YEAR_LEGEND = ['2021년', '2022년', '2023년', '2024년', '2025년'];
  /* 2026-09-09 "통계_상단바꾼버전"(19906:62325) 재확정 색상 — 기존 레인보우 카테고리색 폐기,
     블루 계열 4색으로 통일(Figma 실측: 강사수 #007ade·수혜자수 #173bff·예산 #39d1ff·지원기관수 #80f4c2) */
  var CAT_COLOR = { 강사수: '#007ade', 수혜자수: '#173bff', 예산: '#39d1ff', 지원기관수: '#80f4c2' };

  /* --------------------------------------------------------------------
     1. 데이터 — Figma에서 실측 추출한 값(강사수/수혜자수/예산/지원기관수, 자료통계 KPI·차트)과
        PDF 예시값 기반 데이터(조사통계 5개 항목)를 함께 둔다.
        실측이 아닌 항목은 각 데이터 객체에 approximate:true 로 표시한다.
     -------------------------------------------------------------------- */

  var ADMIN_YEARS = ['2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026\n1분기'];

  var ADMIN = {
    items: [
      {
        id: 'lecturers', label: '강사 수', kpiUnit: '(명)', kpiValue: '169,635', color: CAT_COLOR.강사수, unit: '(단위: 명)', scaleMax: 16000,
        showLine: true, showValues: true, pointUnit: '명',
        values: [3086, 4091, 5087, 5412, 6116, 7494, 9883, 9032, 9527, 9422, 10194, 12164, 11666, 10681, 11093, 14049, 12577, 11994, 6071]
      },
      {
        id: 'beneficiaries', label: '수혜자 수', kpiUnit: '(명)', kpiValue: '44,017,237', color: CAT_COLOR.수혜자수, unit: '(단위: 명)', scaleMax: 3500000,
        showLine: true, showValues: true, pointUnit: '명',
        values: [1202514, 1574022, 1798883, 1916201, 1984637, 2317039, 2698324, 2805866, 3079609, 2620112, 2698324, 2727654, 2561453, 2874302, 2678771, 3108939, 2424581, 1867318, 1065642]
      },
      {
        id: 'budget', label: '예산', kpiUnit: '(백만원)', kpiValue: '2,178,013', color: CAT_COLOR.예산, unit: '(단위: 백만원)', scaleMax: 160000,
        showLine: true, showValues: true, pointUnit: '백만원',
        values: [37542, 67486, 75978, 77765, 88939, 117989, 135866, 132737, 147933, 146592, 150168, 147039, 136760, 132291, 125140, 121564, 91173, 98324, 146592]
      },
      {
        id: 'orgs', label: '지원기관 수', kpiUnit: '(개)', kpiValue: '190,986', color: CAT_COLOR.지원기관수, unit: '(단위: 개)', scaleMax: 14000,
        showLine: true, showValues: true, pointUnit: '개',
        values: [4419, 5592, 6687, 6765, 7939, 9659, 10676, 11223, 12788, 12201, 11849, 12749, 12592, 13179, 11419, 11966, 10128, 10089, 8994]
      }
    ]
  };

  var SURVEY = {
    items: [
      {
        id: 'rate', label: '문화예술교육 참여율', approximate: true,
        charts: [
          { title: '문화예술교육 참여율', subtitle: '전체', unit: '(단위:%)', cats: ['2021', '2022', '2023', '2024', '2025'], series: [[22], [16], [28], [28], [28]], colors: BLUE_ONLY, scaleMax: 100, steps: 5, showLine: true, showValues: true, pointUnit: '%' },
          /* 성별/생애주기별/분야별은 X축이 연도, 각 연도 막대는 하위 카테고리(성별/생애주기/분야)를
             누적 스택 — cats=연도, legend=카테고리로 둬야 Figma와 같은 구조가 된다(예전엔 반대로
             cats=카테고리·legend=연도라 실제로는 무의미한 조합으로 그려지고 있었음). */
          /* 성별 여성은 Figma 실측(#007ade)보다 사용자 지정색(#80f4c2, rgb(128,244,194))을
             명시적으로 우선 적용 — 2026-09-10 사용자 확정 */
          { title: '참여율', subtitle: '성별', unit: '(단위:%)', cats: ['2021', '2022', '2023', '2024', '2025'], series: [[15.4, 22.9], [13, 22.5], [15.8, 26.1], [16.2, 26.3], [16.2, 26.3]], legend: ['남성', '여성'], colors: ['#173bff', '#80f4c2'], scaleMax: 50, steps: 5 },
          { title: '참여율', subtitle: '생애주기별', unit: '(단위:%)', cats: ['2021', '2022', '2023', '2024', '2025'], series: [[63.6, 9.3, 6.9, 9.1, 9], [70.9, 25.6, 8.9, 6.7, 9.5], [72.1, 27.6, 10.8, 8.2, 9.9], [65.1, 29.1, 12, 8.7, 11.6], [65.1, 29.1, 12, 8.7, 11.6]], legend: ['아동', '청소년', '성인', '중장년', '노년'], colors: PALETTE, scaleMax: 250, steps: 5 },
          /* 분야별 10색은 Figma 범례 실측(미술/음악/무용/문학/전통문화/연극/만화/영화/사진/국악 순) */
          { title: '참여율', subtitle: '분야별', unit: '(단위:%)', cats: ['2021', '2022', '2023', '2024', '2025'], series: [[38.3, 24.5, 4.3, 2.5, 2.1, 1, 1.3, 2.3, 1, 2], [39.7, 26.5, 8.9, 3.7, 1.9, 3.9, 1.9, 1.1, 1.1, 2.5], [35.9, 29.1, 7.5, 4.5, 4.5, 2.8, 2.7, 2.5, 1.9, 1.2], [37.3, 27.8, 6.7, 4.2, 2.3, 1.5, 2.5, 1.9, 0.5, 1], [37.3, 27.8, 6.7, 4.2, 2.3, 1.5, 2.5, 1.9, 0.5, 1]], legend: ['음악', '미술', '문학', '연극/뮤지컬', '무용', '영화', '공예', '사진/디자인', '전통예술', '기타'], colors: ['#173bff', '#007ade', '#39d1ff', '#80f4c2', '#76aaff', '#b4f5a7', '#ffef75', '#173bff', '#007ade', '#39d1ff'], scaleMax: 150, steps: 3 }
        ]
      },
      {
        id: 'time-cost', label: '문화예술교육 참여 시간 및 비용',
        charts: [
          { title: '연간 참여 시간', unit: '(단위:시간)', cats: ['2021년', '2022년', '2023년', '2024년', '2025년'], series: [[78.5], [89.8], [64.5], [61.6], [61.6]], colors: BLUE_ONLY, scaleMax: 100, showValues: true, showLine: true, pointUnit: '시간' },
          { title: '연간 참여 비용', unit: '(단위:만원)', cats: ['2021년', '2022년', '2023년', '2024년', '2025년'], series: [[61.4], [53.5], [46.2], [44.7], [44.7]], colors: ['#173bff'], scaleMax: 100, showValues: true, showLine: true, pointUnit: '만원' }
        ]
      },
      {
        id: 'interest-satisfaction', label: '문화예술교육 관심도 및 만족도',
        charts: [
          { title: '관심도', subtitle: '참여자', unit: '(단위:%)', cats: ['매우 그렇다', '대체로 그렇다', '보통', '대체로 아니다', '전혀 아니다'], series: [[35, 40, 15, 6, 4], [33, 39, 15, 6, 4], [32, 38, 15, 6, 4], [31, 37, 15, 6, 4], [30, 36, 15, 6, 4]], legend: YEAR_LEGEND, colors: PALETTE, scaleMax: 200, transpose: true },
          { title: '만족도', unit: '(단위:%)', cats: ['매우 만족', '대체로 만족', '보통', '대체로 불만족', '매우 불만족'], series: [[38, 42, 13, 5, 2], [36, 41, 13, 5, 2], [35, 40, 14, 5, 2], [34, 39, 15, 5, 2], [33, 38, 16, 5, 2]], legend: YEAR_LEGEND, colors: PALETTE, scaleMax: 250, transpose: true }
        ]
      },
      {
        id: 'motivation', label: '문화예술교육 참여 동기',
        charts: [
          { title: '학교문화예술교육(정규교과/전공과정 외) 참여동기', subtitle: '복수응답', unit: '(단위:%)', cats: ['개인의 즐거움', '교양함양및지식습득', '진로직업직무능력개발', '친목도모', '추천혹은독려'], series: [[78, 65, 35, 42, 25], [75, 63, 33, 40, 24], [72, 60, 31, 38, 23], [70, 58, 30, 37, 22], [68, 56, 28, 36, 21]], legend: YEAR_LEGEND, colors: PALETTE, scaleMax: 450, transpose: true },
          /* series는 [연도][카테고리] 5x6 행렬 — transpose 없이 쓰면 cats(6)과 배열 길이(5)가
             안 맞아 6번째 막대가 통째로 비고, 앞 5개는 "한 해의 6개 카테고리값"이 통째로 한
             클러스터에 잘못 쌓이면서 색상이 5개를 넘겨 모듈로로 맨 위에 진한색이 한 번 더
             올라가 보이는 버그가 있었다. transpose로 [카테고리][연도] 6x5로 바로잡음. */
          { title: '사회문화예술교육 참여동기', subtitle: '복수응답', unit: '(단위:%)', cats: ['개인의 즐거움', '교양함양및지식습득', '건강관리', '친목도모', '추천혹은독려', '진로직업직무능력개발'], series: [[80, 60, 55, 48, 22, 20], [78, 58, 54, 47, 21, 19], [76, 57, 52, 46, 20, 18], [74, 56, 51, 45, 19, 17], [73, 55, 50, 44, 18, 16]], legend: YEAR_LEGEND, colors: PALETTE, scaleMax: 450, transpose: true }
        ]
      },
      {
        id: 'non-participation', label: '문화예술교육 미참여 이유',
        charts: [
          { title: '문화예술교육 미참여 이유', subtitle: '복수응답', unit: '(단위:%)', cats: ['시간이 없어서', '프로그램이 없어서', '정보가 부족해서', '동기,자신감 부족', '시설이 없어서'], series: [[72, 58, 45, 38, 30], [70, 57, 44, 37, 29], [68, 56, 43, 36, 28], [67, 55, 42, 35, 27], [66, 54, 41, 34, 26]], legend: YEAR_LEGEND, colors: PALETTE, scaleMax: 400, transpose: true }
        ]
      },
      {
        id: 'future', label: '향후 문화예술교육 참여 관련',
        charts: [
          { title: '향후 문화예술교육 참여 의향률 및 비용지불 의향률', unit: '(단위:%)', cats: ['향후 참여 의향률', '향후 비용지불 의향률'], series: [[22.8, 18.2], [24.5, 19.5], [26.1, 20.8], [27.8, 22.1], [29.4, 23.4]], legend: YEAR_LEGEND, colors: PALETTE, scaleMax: 150, transpose: true },
          { title: '향후 참여 희망 분야', subtitle: '복수응답', unit: '(단위:%)', cats: ['생활문화예술', '전통예술', '시각예술', '공연예술', '디자인·공예', '문학'], series: [[38, 22, 18, 15, 12, 8], [36, 21, 17, 15, 12, 8], [35, 20, 17, 14, 11, 7], [34, 20, 16, 14, 11, 7], [33, 19, 16, 13, 10, 7]], legend: YEAR_LEGEND, colors: PALETTE, scaleMax: 200, transpose: true },
          { title: '향후 문화예술교육 활성화를 위해 정부가 노력해야 할 사항', subtitle: '복수응답', unit: '(단위:%)', cats: ['교육비 지원 확대', '프로그램 다양화', '접근성 개선(장소,시간)', '정보제공 확대', '강사 전문성 강화'], series: [[52, 45, 38, 30, 25], [50, 44, 37, 29, 24], [49, 43, 36, 28, 24], [48, 42, 35, 28, 23], [46, 41, 34, 27, 22]], legend: YEAR_LEGEND, colors: PALETTE, scaleMax: 300, transpose: true }
        ]
      }
    ]
  };

  /* 2026-09-10: 자료통계 KPI 카드도 행정통계처럼 클릭해서 항목을 전환한다. Figma 기본 화면은
     "문서"가 활성 상태이고 문서 전체 차트가 보인다(19906:62982) — 추천/지역별정보는 클릭 시
     보이는 별도 화면(19906:64773)에 둘이 같이 묶여 있다. 도서/영상은 Figma에 전용 차트 화면이
     없어 자기 KPI 총합을 단일 막대로 보여주는 걸로 대체(approximate:true로 표시). */
  var DATA = {
    kpi: [
      { id: 'doc', label: '문서', value: '4,793', numValue: 4793, color: '#007ade' },
      { id: 'book', label: '도서', value: '12,374', numValue: 12374, color: '#eab308' },
      { id: 'video', label: '영상', value: '2,063', numValue: 2063, color: '#16a34a' },
      { id: 'recommend', label: '추천', value: '6,444', numValue: 6444, color: '#712eec' },
      { id: 'region', label: '지역별 정보', value: '6,314', numValue: 6314, color: '#76aaff' }
    ],
    charts: {
      doc: [
        { title: '문서', subtitle: '전체', unit: '(단위: 건)', color: '#007ade', cats: ['문화예술교육현장', '연구보고서', '연수결과자료집', '축제학술행사기록', '문화예술교육사', '연차보고서', '국제교류', '기타'], values: [2107, 1199, 2107, 1199, 2107, 1199, 2107, 1199], scaleMax: 5000, steps: 5 }
      ],
      recommend: [
        { title: '추천 전체', unit: '(단위: 건)', color: '#712eec', cats: ['주제별큐레이션', '프로그램아카이브', '최신인기자료', '북큐레이션', '추천도서'], values: [137, 137, 137, 137, 137], scaleMax: 200 },
        { title: '지역별 정보 전체', unit: '(단위: 건)', color: '#76aaff', cats: ['프로그램', '운영단체', '지역별자료'], values: [3095, 1441, 1778], scaleMax: 4000 }
      ]
    }
  };
  DATA.charts.region = DATA.charts.recommend;

  /* --------------------------------------------------------------------
     2. DOM 빌더
     -------------------------------------------------------------------- */

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }
  function txt(tag, cls, text) {
    var e = el(tag, cls);
    e.textContent = text;
    return e;
  }

  function buildBarChart(cfg) {
    var cats = cfg.cats;
    var seriesData = cfg.series ? (cfg.transpose ? transpose(cfg.series) : cfg.series) : cats.map(function (_, i) { return [cfg.values[i]]; });
    var colors = cfg.colors || [cfg.color || PALETTE[0]];
    var scaleMax = cfg.scaleMax;

    var card = el('div', 'chart-card' + (cfg.noBorder ? ' chart-card--plain' : ''));

    var head = el('div', 'chart-head');
    var titleWrap = el('span', 'chart-title-wrap');
    titleWrap.appendChild(txt('span', 'chart-title', cfg.title));
    if (cfg.subtitle) titleWrap.appendChild(txt('span', 'chart-subtitle', cfg.subtitle));
    head.appendChild(titleWrap);
    head.appendChild(txt('span', 'chart-unit', cfg.unit));
    card.appendChild(head);

    if (cfg.legend) {
      var legendRow = el('div', 'chart-legend');
      cfg.legend.forEach(function (lb, i) {
        var chip = el('span', 'legend-chip');
        var dot = el('i', 'legend-dot');
        dot.style.background = colors[i % colors.length];
        chip.appendChild(dot);
        chip.appendChild(document.createTextNode(lb));
        legendRow.appendChild(chip);
      });
      head.appendChild(legendRow);
    }

    var body = el('div', cfg.wide ? 'chart-body chart-body--wide' : 'chart-body');

    var yAxis = el('div', 'chart-yaxis');
    var steps = cfg.steps || 4;
    for (var i = steps; i >= 0; i--) {
      yAxis.appendChild(txt('span', 'yaxis-label', i === 0 ? '0' : String(Math.round((scaleMax * i) / steps))));
    }
    body.appendChild(yAxis);

    var plotWrap = el('div', 'chart-plot-wrap');
    var tooltip = buildTooltip();
    var plot = el('div', 'chart-plot');
    for (var g = 0; g <= steps; g++) {
      var gl = el('div', 'gridline');
      gl.style.bottom = (g / steps) * 100 + '%';
      plot.appendChild(gl);
    }
    var pointUnit = cfg.pointUnit || '';
    /* 항목이 2~3개뿐인 차트는 flex:1로 늘리면 막대가 지나치게 두꺼워져서(Figma는 고정폭
       80px + 가운데 정렬) 적을 때는 고정폭으로 바꾸고 가운데 정렬한다. */
    var barsRow = el('div', 'chart-bars' + (cats.length <= 3 ? ' chart-bars--narrow' : ''));
    var linePoints = [];
    cats.forEach(function (cat, ci) {
      var cluster = el('div', 'bar-cluster' + (cfg.legend ? ' bar-cluster--stacked' : ''));
      var vals = seriesData[ci] || [];
      var cumPct = 0;
      vals.forEach(function (val, si) {
        var seriesLabel = cfg.legend && cfg.legend[si] ? cfg.legend[si] : '';
        var segPct = Math.max((val / scaleMax) * 100, 0);
        var bar = el('div', 'bar');
        bar.style.bottom = cumPct + '%';
        bar.style.height = segPct + '%';
        bar.style.background = colors[si % colors.length];
        attachTooltip(bar, tooltip, plotWrap, cat, seriesLabel, formatValue(val) + pointUnit);
        cluster.appendChild(bar);
        cumPct += segPct;
        if (cfg.showValues && !cfg.showLine && si === vals.length - 1) {
          var lbl = txt('span', 'bar-value', formatValue(val));
          lbl.style.bottom = cumPct + '%';
          lbl.style.color = colors[si % colors.length];
          cluster.appendChild(lbl);
        }
      });
      barsRow.appendChild(cluster);

      if (cfg.showLine) {
        var topVal = vals[0] || 0;
        linePoints.push({
          ci: ci,
          xPct: ((ci + 0.5) / cats.length) * 100,
          yPct: 100 - Math.max((topVal / scaleMax) * 100, 0),
          val: topVal,
          cat: cat
        });
      }
    });
    plot.appendChild(barsRow);
    if (cfg.showLine && linePoints.length) {
      plot.appendChild(buildLineOverlay(linePoints, colors[0], cfg.showValues, tooltip, plotWrap, pointUnit));
    }
    plotWrap.appendChild(plot);
    plotWrap.appendChild(tooltip);
    body.appendChild(plotWrap);
    card.appendChild(body);

    var xRow = el('div', 'chart-xaxis');
    xRow.appendChild(el('span', 'xaxis-spacer'));
    var xCells = el('div', 'xaxis-cells' + (cats.length <= 3 ? ' xaxis-cells--narrow' : ''));
    cats.forEach(function (cat) {
      xCells.appendChild(txt('span', 'xaxis-label', cat));
    });
    xRow.appendChild(xCells);
    card.appendChild(xRow);

    return card;
  }

  function transpose(matrix) {
    var out = [];
    var cols = matrix[0].length;
    for (var c = 0; c < cols; c++) {
      out.push(matrix.map(function (row) { return row[c]; }));
    }
    return out;
  }
  function formatValue(v) {
    var n = Math.round(v * 10) / 10;
    return n.toLocaleString('ko-KR', { maximumFractionDigits: 1 });
  }
  /* 100만 이상 큰 수치는 점 위 상시 값라벨에서 "만" 단위로 압축 표기(Figma 수혜자수 확정 표기:
     "308만" 등). 100만 미만은 formatValue 그대로. 호버 툴팁은 압축하지 않고 formatValue+단위 전체값. */
  function formatCompact(v) {
    if (Math.abs(v) >= 1000000) return Math.round(v / 10000).toLocaleString('ko-KR') + '만';
    return formatValue(v);
  }

  /* 단일 시리즈(연도 추이) 차트 위에 얹는 꺾은선 오버레이 — SVG path(선) + 절대배치 dot/값라벨.
     bar-cluster가 전부 flex:1 균등폭이라 x좌표는 DOM 실측 없이 (index+0.5)/N로 계산 가능하다.
     path에는 points/color를 그대로 보관해두고(__linePoints/__lineColor), animateCharts()가
     실제 렌더된 픽셀 크기로 d를 다시 계산해 그린다 — %기반 viewBox+non-scaling-stroke 조합은
     차트마다 가로세로 비율이 크게 달라 일부 브라우저에서 선이 중간에 끊겨 보이는 문제가 있었다. */
  function buildLineOverlay(points, color, showValues, tooltip, plotWrap, pointUnit) {
    var frag = document.createDocumentFragment();
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'chart-line-svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    var d = points.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p.xPct + ',' + p.yPct; }).join(' ');
    path.setAttribute('d', d);
    path.setAttribute('class', 'chart-line-path');
    path.setAttribute('stroke', color);
    path.__linePoints = points;
    path.__lineColor = color;
    svg.appendChild(path);
    frag.appendChild(svg);

    points.forEach(function (p) {
      var dot = el('span', 'chart-dot');
      dot.style.left = p.xPct + '%';
      dot.style.top = p.yPct + '%';
      dot.style.borderColor = color;
      dot.__idx = p.ci;
      attachTooltip(dot, tooltip, plotWrap, p.cat, '', formatValue(p.val) + pointUnit);
      frag.appendChild(dot);
      if (showValues) {
        var lbl = txt('span', 'chart-point-value', formatCompact(p.val));
        lbl.style.left = p.xPct + '%';
        lbl.style.top = p.yPct + '%';
        lbl.style.color = color;
        lbl.__idx = p.ci;
        frag.appendChild(lbl);
      }
    });
    return frag;
  }

  /* 차트당 하나씩 두는 공용 호버 툴팁. 막대/도트에 mouseenter·mousemove·mouseleave로 값을 띄운다.
     카테고리(연도 등) 한 줄 + 색점·시리즈명·값 한 줄, Figma 호버 목업("2023년 / ● 수혜자 수 3,108,939명")과
     같은 2줄 구성. */
  function buildTooltip() {
    var tip = el('div', 'chart-tooltip');
    tip.setAttribute('aria-hidden', 'true');
    tip.appendChild(txt('span', 'chart-tooltip-cat', ''));
    var valLine = el('span', 'chart-tooltip-val');
    var dot = el('i', 'chart-tooltip-dot');
    valLine.appendChild(dot);
    valLine.appendChild(txt('span', 'chart-tooltip-val-text', ''));
    tip.appendChild(valLine);
    return tip;
  }
  function attachTooltip(target, tooltip, plotWrap, cat, seriesLabel, valueText) {
    function show(evt) {
      tooltip.querySelector('.chart-tooltip-cat').textContent = cat;
      var dotEl = tooltip.querySelector('.chart-tooltip-dot');
      dotEl.style.background = target.style.background || target.style.borderColor || '#111';
      tooltip.querySelector('.chart-tooltip-val-text').textContent = (seriesLabel ? seriesLabel + ' ' : '') + valueText;
      tooltip.classList.add('is-visible');
      position(evt);
    }
    function position(evt) {
      var rect = plotWrap.getBoundingClientRect();
      tooltip.style.left = (evt.clientX - rect.left) + 'px';
      tooltip.style.top = (evt.clientY - rect.top) + 'px';
    }
    function hide() {
      tooltip.classList.remove('is-visible');
    }
    target.addEventListener('mouseenter', show);
    target.addEventListener('mousemove', position);
    target.addEventListener('mouseleave', hide);
  }

  /* 2026-09-09 재확정: PC는 아이콘 없이 흑백(비활성 #f9f9f9 / 활성 흰바탕+검정 2px 보더)만 쓰고,
     모바일은 기존처럼 카테고리색 채움(활성)·톤다운 값색(비활성)을 유지 — --kpi-color는 두 경우 다
     써야 하므로 항상 세팅해두고 실제 배경/글자색 분기는 CSS 미디어쿼리에서 처리한다. */
  function buildKpiCard(item, activeId) {
    var isActive = item.id === activeId;
    var card = el('a', 'kpi-card' + (isActive ? ' is-active' : ''));
    card.href = '#' + item.id;
    card.style.setProperty('--kpi-color', item.color);
    card.addEventListener('click', function (e) {
      e.preventDefault();
      if (state.adminItem === item.id) return;
      state.adminItem = item.id;
      renderShell();
    });

    var stack = el('span', 'kpi-stack');
    var labelRow = el('span', 'kpi-label-row');
    labelRow.appendChild(txt('span', 'kpi-label', item.label));
    labelRow.appendChild(txt('span', 'kpi-unit', item.unit));
    stack.appendChild(labelRow);
    stack.appendChild(txt('strong', 'kpi-value', item.value));
    card.appendChild(stack);
    return card;
  }

  function buildDataKpiCard(d, activeId) {
    var isActive = d.id === activeId;
    var card = el('a', 'data-kpi-card' + (isActive ? ' is-active' : ''));
    card.href = '#' + d.id;
    card.style.setProperty('--data-kpi-color', d.color);
    card.addEventListener('click', function (e) {
      e.preventDefault();
      if (state.dataItem === d.id) return;
      state.dataItem = d.id;
      renderShell();
    });
    var body = el('div', 'data-kpi-body');
    body.appendChild(txt('span', 'data-kpi-label', d.label));
    body.appendChild(txt('strong', 'data-kpi-value', d.value));
    card.appendChild(body);
    return card;
  }

  /* --------------------------------------------------------------------
     3. 탭/항목 전환 렌더링
     -------------------------------------------------------------------- */

  var root = document.getElementById('stats-root');
  if (!root) return;

  var state = { tab: 'admin', adminItem: 'lecturers', surveyItem: 'rate', dataItem: 'doc' };
  var isFirstRender = true;

  function renderShell() {
    root.innerHTML = '';

    var tabRow = el('div', 'stat-tabs');
    [['admin', '행정통계'], ['survey', '조사통계'], ['data', '자료통계']].forEach(function (t) {
      var b = txt('button', 'stat-tab' + (state.tab === t[0] ? ' is-active' : ''), t[1]);
      b.type = 'button';
      b.addEventListener('click', function () {
        if (state.tab === t[0]) return;
        state.tab = t[0];
        renderShell();
      });
      var mask = el('div', 'reveal-mask');
      mask.appendChild(b);
      tabRow.appendChild(mask);
    });
    root.appendChild(tabRow);

    var descEl = txt('p', 'stat-desc', descFor(state.tab));
    root.appendChild(descEl);
    root.appendChild(el('div', 'stat-divider'));

    var main = el('div', 'stat-main' + (state.tab === 'data' ? ' stat-main--full' : ''));

    if (state.tab !== 'data') {
      main.appendChild(buildNav());
    }
    main.appendChild(buildContent());
    root.appendChild(main);

    revealTabs(root.querySelectorAll('.stat-tab'), isFirstRender ? 0.45 : 0);
    revealStack(root.querySelectorAll('.chart-card, .kpi-card, .data-kpi-card'));
    animateCharts(root);
    isFirstRender = false;
  }

  function descFor(tab) {
    if (tab === 'admin') return '연도별 문화예술교육 강사수, 수혜자수, 예산, 지원기관 수 통계 정보를 제공합니다.';
    if (tab === 'survey') return '우리나라 국민의 문화예술교육에 대한 수요, 인식, 참여 현황을 조사한 통계 정보를 제공합니다.';
    return '한국문화예술교육진흥원의 사업단위별 통계 정보를 제공합니다.';
  }

  function buildNav() {
    var nav = el('aside', 'stat-nav');
    var items = state.tab === 'admin' ? ADMIN.items : SURVEY.items;
    var activeId = state.tab === 'admin' ? state.adminItem : state.surveyItem;
    var activeItem = items.filter(function (it) { return it.id === activeId; })[0] || items[0];

    nav.appendChild(txt('p', 'stat-nav-label', '항목'));

    var dropdown = el('div', 'stat-nav-dropdown');

    var current = el('button', 'stat-nav-current');
    current.type = 'button';
    current.appendChild(txt('span', '', activeItem.label));
    current.appendChild(chevronSvg());
    current.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
    dropdown.appendChild(current);

    var list = el('div', 'stat-nav-list');
    items.forEach(function (it) {
      var b = txt('button', 'stat-nav-item' + (it.id === activeId ? ' is-active' : ''), it.label);
      b.type = 'button';
      b.addEventListener('click', function () {
        if (state.tab === 'admin') state.adminItem = it.id; else state.surveyItem = it.id;
        nav.classList.remove('is-open');
        renderShell();
      });
      list.appendChild(b);
    });
    dropdown.appendChild(list);
    nav.appendChild(dropdown);

    nav.appendChild(txt('p', 'stat-nav-label', '기간'));
    var periodRow = el('div', 'stat-period-row');
    ['2021년', '2025년'].forEach(function (v, i) {
      if (i === 1) periodRow.appendChild(el('span', 'stat-period-divider'));
      var f = el('button', 'stat-field');
      f.type = 'button';
      f.appendChild(txt('span', '', v));
      f.appendChild(chevronSvg());
      periodRow.appendChild(f);
    });
    nav.appendChild(periodRow);

    if (state.tab === 'admin') {
      var qtr = el('button', 'stat-field stat-field--full');
      qtr.type = 'button';
      qtr.appendChild(txt('span', '', '1분기'));
      qtr.appendChild(chevronSvg());
      nav.appendChild(qtr);
    }

    var btn = txt('button', 'stat-search-btn', '조회하기');
    btn.type = 'button';
    nav.appendChild(btn);

    return nav;
  }

  function chevronSvg() {
    var span = el('span', 'chevron-icon');
    span.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return span;
  }

  function buildContent() {
    if (state.tab === 'admin') {
      var col = el('div', 'stat-content-col');
      var kpiRow = el('div', 'kpi-row');
      ADMIN.items.forEach(function (it) {
        kpiRow.appendChild(buildKpiCard({ id: it.id, label: it.label, unit: it.kpiUnit, value: it.kpiValue, color: it.color }, state.adminItem));
      });
      col.appendChild(kpiRow);
      var active = ADMIN.items.filter(function (it) { return it.id === state.adminItem; })[0];
      col.appendChild(buildAdminChart(active));
      return col;
    }
    if (state.tab === 'survey') {
      var col2 = el('div', 'stat-content-col' + (state.surveyItem === 'rate' ? ' stat-content-col--grid' : ''));
      var active2 = SURVEY.items.filter(function (it) { return it.id === state.surveyItem; })[0];
      active2.charts.forEach(function (c) { col2.appendChild(buildBarChart(c)); });
      return col2;
    }
    // data tab
    var wrap = el('div', 'stat-content-col stat-content-col--full');
    var kpiRow2 = el('div', 'data-kpi-row');
    DATA.kpi.forEach(function (d) { kpiRow2.appendChild(buildDataKpiCard(d, state.dataItem)); });
    wrap.appendChild(kpiRow2);
    var chartsRow = el('div', 'data-charts-row');
    var activeKpi = DATA.kpi.filter(function (d) { return d.id === state.dataItem; })[0];
    var charts = DATA.charts[state.dataItem] || [
      { title: activeKpi.label, subtitle: '전체', unit: '(단위: 건)', color: activeKpi.color, cats: [activeKpi.label], values: [activeKpi.numValue], scaleMax: Math.ceil(activeKpi.numValue * 1.3 / 1000) * 1000 }
    ];
    charts.forEach(function (c, ci) {
      if (ci > 0) chartsRow.appendChild(el('div', 'data-chart-divider'));
      chartsRow.appendChild(buildBarChart({ title: c.title, subtitle: c.subtitle, unit: c.unit, cats: c.cats, values: c.values, color: c.color, scaleMax: c.scaleMax, steps: c.steps, showValues: true, noBorder: true }));
    });
    wrap.appendChild(chartsRow);
    return wrap;
  }

  function buildAdminChart(item) {
    var wrap = el('div', 'admin-chart-scroll');
    var chart = buildBarChart({
      title: item.label, unit: item.unit, cats: ADMIN_YEARS,
      values: item.values, color: item.color, scaleMax: item.scaleMax,
      showLine: item.showLine, showValues: item.showValues, pointUnit: item.pointUnit
    });
    chart.classList.add('chart-card--admin');
    wrap.appendChild(chart);
    return wrap;
  }

  /* --------------------------------------------------------------------
     4-a. 탭 리빌 — arte-motion.js의 titleReveal() 서브탭과 완전히 동일한 방식.
     각 탭은 .reveal-mask(overflow:hidden)에 담겨 있고, 오퍼시티는 건드리지 않고
     yPercent 100→0 마스크 슬라이드만 쓴다 (duration 0.5 / ease expo.out / stagger 0.15).
     delay는 titleReveal()의 tabMasks 실제 시작 시점(딜레이 0.1 + 타이틀 마스크 0.6s와
     '-=0.25' 겹침 = 0.45s)과 맞춘 값을 최초 렌더에만 넘긴다 — 그래야 통계 타이틀이
     슬라이드되는 도중에 탭이 뒤이어 나오는 다른 서브페이지와 같은 박자가 된다.
     탭/항목 클릭으로 다시 그릴 때는 delay 없이 즉시 반응해야 하므로 0을 넘긴다.
     -------------------------------------------------------------------- */

  function revealTabs(nodeList, delay) {
    var nodes = Array.prototype.slice.call(nodeList);
    if (!nodes.length) return;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || typeof gsap === 'undefined') return;
    gsap.killTweensOf(nodes);
    gsap.fromTo(
      nodes,
      { yPercent: 100 },
      { yPercent: 0, duration: 0.5, ease: 'expo.out', stagger: 0.15, delay: delay || 0, clearProps: 'transform' }
    );
  }

  /* --------------------------------------------------------------------
     4. GSAP 스택 리빌 — 위에서부터 순서대로 착착 나타남
     -------------------------------------------------------------------- */

  function revealStack(nodeList) {
    var nodes = Array.prototype.slice.call(nodeList);
    if (!nodes.length) return;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || typeof gsap === 'undefined') {
      nodes.forEach(function (n) { n.style.opacity = 1; n.style.transform = 'none'; });
      return;
    }
    gsap.killTweensOf(nodes);
    gsap.fromTo(
      nodes,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.09, clearProps: 'transform' }
    );
  }

  /* --------------------------------------------------------------------
     5. GSAP 차트 모션 — 막대 아래→위로 차오르기, 꺾은선 좌→우로 그려지기, 점/값 라벨 페이드인.
        renderShell()이 매번 #stats-root를 통째로 새로 그리므로(정적 마크업 없음), 공통
        arte-motion.js의 DOMContentLoaded 훅으로는 잡을 수 없다 — revealStack과 같은 이유로
        이 페이지 로컬에 둔다.
     -------------------------------------------------------------------- */

  function animateCharts(scopeEl) {
    var cards = scopeEl.querySelectorAll('.chart-card');
    if (!cards.length) return;

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasGsap = typeof gsap !== 'undefined';

    Array.prototype.forEach.call(cards, function (card) {
      var clusters = card.querySelectorAll('.bar-cluster');
      var path = card.querySelector('.chart-line-path');
      var dots = card.querySelectorAll('.chart-dot');
      var pointValues = card.querySelectorAll('.chart-point-value');
      if (!clusters.length) return;

      /* 각 bar-cluster의 실제 렌더 중심(%)을 측정한다 — flex gap 때문에 (index+0.5)/N 같은
         단순 계산은 gap이 클수록 실제 막대 중심에서 어긋난다. 점/값라벨/꺾은선 전부 이 실측
         중심에 맞춰 다시 배치한다. */
      var plot = card.querySelector('.chart-plot');
      var plotRect = plot ? plot.getBoundingClientRect() : null;
      var centers = [];
      if (plotRect && plotRect.width) {
        Array.prototype.forEach.call(clusters, function (c) {
          var r = c.getBoundingClientRect();
          centers.push(((r.left + r.width / 2) - plotRect.left) / plotRect.width * 100);
        });
      }
      function centerPctFor(idx) {
        return (idx != null && centers[idx] != null) ? centers[idx] : null;
      }

      Array.prototype.forEach.call(dots, function (d) {
        var pct = centerPctFor(d.__idx);
        if (pct != null) d.style.left = pct + '%';
      });
      Array.prototype.forEach.call(pointValues, function (l) {
        var pct = centerPctFor(l.__idx);
        if (pct != null) l.style.left = pct + '%';
      });

      /* 꺾은선을 %기반 viewBox 대신 실제 렌더 픽셀 크기로 다시 그린다 — 차트마다 가로세로
         비율이 크게 다른 상태에서 %+non-scaling-stroke를 쓰면 선이 중간에 끊겨 보이는
         브라우저 렌더링 문제가 있어, 레이아웃이 끝난 뒤(clientWidth/Height) 정확한 좌표로 교체.
         x좌표도 위에서 측정한 실제 막대 중심을 그대로 쓴다. */
      if (path && path.__linePoints) {
        var w = plot ? plot.clientWidth : 0;
        var h = plot ? plot.clientHeight : 0;
        if (w > 0 && h > 0) {
          path.parentNode.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
          path.parentNode.removeAttribute('preserveAspectRatio');
          path.removeAttribute('vector-effect');
          path.setAttribute('d', path.__linePoints.map(function (p, i) {
            var xPct = centerPctFor(p.ci);
            if (xPct == null) xPct = p.xPct;
            return (i === 0 ? 'M' : 'L') + ((xPct / 100) * w) + ',' + ((p.yPct / 100) * h);
          }).join(' '));
        }
      }

      if (reduceMotion || !hasGsap) {
        Array.prototype.forEach.call(clusters, function (c) { c.style.transform = 'none'; });
        if (path) { path.style.strokeDasharray = 'none'; path.style.strokeDashoffset = '0'; }
        Array.prototype.forEach.call(dots, function (d) { d.style.opacity = 1; });
        Array.prototype.forEach.call(pointValues, function (l) { l.style.opacity = 1; });
        return;
      }

      gsap.killTweensOf(clusters);
      if (path) gsap.killTweensOf(path);
      gsap.killTweensOf(dots);
      gsap.killTweensOf(pointValues);

      /* 막대 리빌과 꺾은선 드로잉이 항목 개수와 무관하게 같은 시점에 끝나도록, 카드마다
         스태거 총 시간을 계산해 꺾은선 duration을 그 값에 맞춘다. 스택 막대는 세그먼트별이
         아니라 클러스터(카테고리) 단위로 통째로 아래→위로 올라오고, 카테고리 간에만 좌→우로
         순차 등장한다. */
      var barDuration = 0.6;
      var stagger = clusters.length > 1 ? Math.min(0.4, 0.4 / clusters.length) : 0;
      var finishAt = stagger * (clusters.length - 1) + barDuration;

      gsap.fromTo(clusters, { scaleY: 0 }, { scaleY: 1, duration: barDuration, ease: 'power2.out', stagger: stagger });

      if (path && typeof path.getTotalLength === 'function') {
        var len = path.getTotalLength();
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        gsap.to(path, { strokeDashoffset: 0, duration: finishAt, ease: 'power1.inOut' });
      }

      if (dots.length) {
        gsap.fromTo(
          dots,
          { opacity: 0, scale: 0 },
          { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)', stagger: stagger, delay: finishAt - 0.35, transformOrigin: 'center' }
        );
      }
      /* opacity만 애니메이션 — pointValues는 CSS transform(translate)으로 위치를 고정하고 있어
         GSAP가 x/y로 transform을 건드리면 그 위치 고정이 깨진다 */
      if (pointValues.length) {
        gsap.fromTo(
          pointValues,
          { opacity: 0 },
          { opacity: 1, duration: 0.35, ease: 'power1.out', stagger: stagger, delay: finishAt - 0.3 }
        );
      }
    });
  }

  document.addEventListener('DOMContentLoaded', renderShell);
})();
