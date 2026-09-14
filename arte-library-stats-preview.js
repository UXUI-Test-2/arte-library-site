/* ==========================================================================
   arte 라이브러리 — 홈 "통계" 섹션 미리보기 차트
   Figma 'main'(20425:126638 PC / 20425:138866 모바일, 2026-09-11) 실측값 기반.
   arte-library-stats.js(통계 서브페이지)와는 별개 — 이 파일은 홈 미리보기 3종
   (행정통계 막대+꺾은선 / 조사통계 누적막대 / 자료통계 원그래프)만 그린다.
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined';

  /* 2026-09-14: 통계 서브페이지(arte-library-stats.js animateCharts)와 같은 등장 모션 —
     막대는 아래→위로 차오르고, 값/점은 좌→우로 순서대로 나타난다. 다만 여기서는 스크롤로
     이 섹션이 화면에 들어올 때 재생해야 하므로, 각 차트는 만들어질 때 최종 상태 대신
     "접힌" 상태로 그려두고 재생 함수를 등록해둔다 — 실제 재생은 IntersectionObserver가
     .statprev-grid가 뷰포트에 들어오는 걸 감지한 시점에 한 번만 실행한다. */
  var pendingReveals = [];
  function registerReveal(fn) {
    if (reduceMotion || !hasGsap) return;
    pendingReveals.push(fn);
  }
  function initScrollReveal() {
    var grid = document.querySelector('.statprev-grid');
    if (!grid || !pendingReveals.length) return;
    if (!('IntersectionObserver' in window)) {
      pendingReveals.forEach(function (fn) { fn(); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        pendingReveals.forEach(function (fn) { fn(); });
        observer.disconnect();
      });
    }, { threshold: 0.3 });
    observer.observe(grid);
  }

  var ADMIN = {
    color: '#173bff',
    max: 16000,
    steps: [16000, 14000, 12000, 10000, 8000, 6000, 4000, 2000, 0],
    points: [
      { year: '2010', value: 5087 },
      { year: '2011', value: 5412 },
      { year: '2012', value: 6116 },
      { year: '2013', value: 7484 },
      { year: '2014', value: 9882 },
      { year: '2015', value: 9032 },
      { year: '2016', value: 9527 },
      { year: '2017', value: 9422 },
      { year: '2018', value: 10196 },
      { year: '2019', value: 12164 },
      { year: '2020', value: 11666 },
      { year: '2021', value: 10681 },
      { year: '2022', value: 11098 },
      { year: '2023', value: 14049 },
      { year: '2024', value: 12577 },
      { year: '2025', value: 11994 },
      { year: '2026\n2분기', value: 8487 }
    ]
  };

  var SURVEY = {
    colors: ['#173bff', '#007ade', '#39d1ff', '#80f4c2'],
    max: 100,
    steps: [100, 80, 60, 40, 20, 0],
    years: ['2021', '2022', '2023', '2024', '2025'],
    series: [
      [17, 10, 43, 15],
      [20, 12, 38, 18],
      [22, 14, 41, 16],
      [19, 11, 45, 14],
      [25, 13, 40, 17]
    ]
  };

  /* 2026-09-14: Figma 실측(20516:21158, 자료통계 원그래프) 확인 결과 레인보우 팔레트가
     아니라 행정통계/조사통계와 같은 블루 계열 그라데이션이다 — 색상을 실측값으로 교체.
     textColor는 각 라벨 전용 색(20516:21721 실측) — 조각 원색을 텍스트로 그대로 쓰면
     밝은 색(문서/영상/지역별 정보)은 흰 배경에서 잘 안 읽혀서 더 진한 톤을 따로 쓴다. */
  var PIE = [
    { label: '문서', value: 4793, color: '#76aaff', textColor: '#5e88cc' },
    { label: '도서', value: 12374, color: '#173bff', textColor: '#173bff' },
    { label: '영상', value: 2063, color: '#18daa3', textColor: '#66c39b' },
    { label: '추천', value: 6444, color: '#007ade', textColor: '#007ade' },
    { label: '지역별 정보', value: 6314, color: '#39d1ff', textColor: '#2da7cc' }
  ];

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  /* 2026-09-14: 통계 서브페이지(arte-library-stats.js)의 호버 툴팁을 홈 미리보기에도 반영.
     차트 하나당 하나씩 두고 막대/도트/조각에 mouseenter·mousemove·mouseleave로 값을 띄운다. */
  function buildTooltip() {
    var tip = el('div', 'pchart-tooltip');
    tip.setAttribute('aria-hidden', 'true');
    tip.appendChild(txt('span', 'pchart-tooltip-cat', ''));
    var valLine = el('span', 'pchart-tooltip-val');
    var dot = el('i', 'pchart-tooltip-dot');
    valLine.appendChild(dot);
    valLine.appendChild(txt('span', 'pchart-tooltip-val-text', ''));
    tip.appendChild(valLine);
    return tip;
  }

  function attachTooltip(target, tooltip, wrap, cat, valueText, dotColor) {
    function show(evt) {
      tooltip.querySelector('.pchart-tooltip-cat').textContent = cat;
      tooltip.querySelector('.pchart-tooltip-dot').style.background = dotColor || '#fff';
      tooltip.querySelector('.pchart-tooltip-val-text').textContent = valueText;
      tooltip.classList.add('is-visible');
      position(evt);
    }
    function position(evt) {
      var rect = wrap.getBoundingClientRect();
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

  function txt(tag, cls, text) {
    var e = el(tag, cls);
    e.textContent = text;
    return e;
  }

  function buildYAxis(steps) {
    var yaxis = el('div', 'pchart-yaxis');
    steps.forEach(function (s) {
      var d = el('div');
      d.textContent = s.toLocaleString();
      yaxis.appendChild(d);
    });
    return yaxis;
  }

  function buildGridlines(plot, steps, max) {
    steps.forEach(function (s) {
      var g = el('div', 'pchart-grid');
      g.style.top = (100 - (s / max) * 100) + '%';
      plot.appendChild(g);
    });
  }

  function buildXAxis(labels) {
    var xaxis = el('div', 'pchart-xaxis');
    labels.forEach(function (label) {
      var s = el('span');
      s.textContent = label;
      xaxis.appendChild(s);
    });
    return xaxis;
  }

  /* x축 라벨은 y축 폭만큼 왼쪽에 여백을 줘야 막대와 정렬된다(y축은 텍스트 길이에 따라
     폭이 가변적이라 고정 px로 맞출 수 없음) — .pchart-body의 gap도 함께 보정한다. */
  function alignXAxis(yaxis, xaxis) {
    var gap = 8;
    xaxis.style.paddingLeft = yaxis.getBoundingClientRect().width + gap + 'px';
  }

  function renderAdmin(root) {
    var chart = el('div', 'pchart');
    var body = el('div', 'pchart-body');
    var plot = el('div', 'pchart-plot');
    buildGridlines(plot, ADMIN.steps, ADMIN.max);
    var tooltip = buildTooltip();

    var bars = el('div', 'pchart-bars');
    var barEls = [];
    ADMIN.points.forEach(function (p) {
      var col = el('div', 'pchart-col');
      var bar = el('div', 'pchart-bar');
      bar.style.height = (p.value / ADMIN.max) * 100 + '%';
      if (!reduceMotion && hasGsap) { bar.style.transformOrigin = 'bottom'; bar.style.transform = 'scaleY(0)'; }
      attachTooltip(bar, tooltip, plot, p.year, p.value.toLocaleString(), ADMIN.color);
      barEls.push(bar);
      col.appendChild(bar);
      bars.appendChild(col);
    });
    plot.appendChild(bars);
    plot.appendChild(tooltip);

    var yaxis = buildYAxis(ADMIN.steps);
    var xaxis = buildXAxis(ADMIN.points.map(function (p) { return p.year; }));
    body.appendChild(yaxis);
    body.appendChild(plot);
    chart.appendChild(body);
    chart.appendChild(xaxis);
    root.appendChild(chart);
    alignXAxis(yaxis, xaxis);

    /* 선/점 오버레이는 레이아웃이 끝난 뒤 실제 픽셀 크기로 계산한다 — 퍼센트 viewBox로
       그리면 좁고 넓은 카드에서 선이 비율에 안 맞게 늘어나는 문제가 arte-library-stats.js
       개발 중 이미 한 번 발견됐다(같은 원인 재발 방지). */
    requestAnimationFrame(function () {
      var rect = bars.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      /* 막대 사이 10px 갭(.pchart-bars gap)이 생기면서 컬럼 폭이 더는 균등폭
         나누기(rect.width/n)로 안 맞는다 — 실제 렌더된 컬럼의 위치를 그대로 읽는다 */
      var cols = bars.querySelectorAll('.pchart-col');
      var svgNS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'pchart-line');
      svg.setAttribute('width', rect.width);
      svg.setAttribute('height', rect.height);
      var d = '';
      var points = [];
      ADMIN.points.forEach(function (p, i) {
        var colRect = cols[i].getBoundingClientRect();
        var x = (colRect.left - rect.left) + colRect.width / 2;
        var y = rect.height - (p.value / ADMIN.max) * rect.height;
        d += (i === 0 ? 'M' : 'L') + x + ',' + y + ' ';
        points.push({ x: x, y: y, value: p.value });
      });
      var path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', d.trim());
      svg.appendChild(path);
      var circles = [];
      points.forEach(function (pt, i) {
        var circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('class', 'pchart-point');
        circle.setAttribute('cx', pt.x);
        circle.setAttribute('cy', pt.y);
        circle.setAttribute('r', 2);
        attachTooltip(circle, tooltip, plot, ADMIN.points[i].year, pt.value.toLocaleString(), ADMIN.color);
        circles.push(circle);
        svg.appendChild(circle);
      });
      plot.appendChild(svg);

      /* Figma 실측은 17개년 값이 전부 표시되어 있다 — 일부만 보이던 것을 전부 표시로 수정 */
      var labels = [];
      points.forEach(function (pt) {
        var label = el('span', 'pchart-value');
        label.textContent = pt.value.toLocaleString();
        label.style.left = pt.x + 'px';
        label.style.top = pt.y + 'px';
        labels.push(label);
        plot.appendChild(label);
      });

      /* 등장 모션 — 막대 아래→위로, 꺾은선 좌→우로 그려지기, 점/값은 뒤이어 순서대로 페이드인.
         통계 서브페이지(animateCharts)와 동일한 스태거 계산: 막대 전체가 끝나는 시점(finishAt)에
         맞춰 꺾은선 duration을 맞추고, 점/값은 그 직전에 시작해 거의 동시에 끝나게 한다. */
      if (reduceMotion || !hasGsap) return;
      gsap.set(circles, { opacity: 0, scale: 0, transformOrigin: 'center' });
      gsap.set(labels, { opacity: 0 });
      var len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;

      registerReveal(function () {
        var barDuration = 0.4;
        var stagger = Math.min(0.15, 1.1 / barEls.length);
        var finishAt = stagger * (barEls.length - 1) + barDuration;
        gsap.to(barEls, { scaleY: 1, duration: barDuration, ease: 'power2.out', stagger: stagger });
        gsap.to(path, { strokeDashoffset: 0, duration: finishAt, ease: 'power1.inOut' });
        gsap.to(circles, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)', stagger: stagger, delay: finishAt - 0.25 });
        gsap.to(labels, { opacity: 1, duration: 0.25, ease: 'power1.out', stagger: stagger, delay: finishAt - 0.2 });
      });
    });
  }

  function renderSurvey(root) {
    var chart = el('div', 'pchart');
    var title = el('p', 'pchart-title');
    title.textContent = '문화예술교육 관심도';
    chart.appendChild(title);
    var body = el('div', 'pchart-body');
    var plot = el('div', 'pchart-plot');
    buildGridlines(plot, SURVEY.steps, SURVEY.max);
    var tooltip = buildTooltip();

    var bars = el('div', 'pchart-bars');
    var cols = [];
    SURVEY.series.forEach(function (row, ri) {
      var col = el('div', 'pchart-col');
      if (!reduceMotion && hasGsap) { col.style.transformOrigin = 'bottom'; col.style.transform = 'scaleY(0)'; }
      row.forEach(function (value, i) {
        var seg = el('div', 'pchart-seg');
        seg.style.height = (value / SURVEY.max) * 100 + '%';
        seg.style.background = SURVEY.colors[i];
        attachTooltip(seg, tooltip, plot, SURVEY.years[ri], value + '%', SURVEY.colors[i]);
        if (value >= 12) {
          var span = el('span');
          span.textContent = value;
          seg.appendChild(span);
        }
        col.appendChild(seg);
      });
      cols.push(col);
      bars.appendChild(col);
    });
    plot.appendChild(bars);
    plot.appendChild(tooltip);

    var yaxis = buildYAxis(SURVEY.steps);
    var xaxis = buildXAxis(SURVEY.years);
    body.appendChild(yaxis);
    body.appendChild(plot);
    chart.appendChild(body);
    chart.appendChild(xaxis);
    root.appendChild(chart);
    alignXAxis(yaxis, xaxis);

    /* 스택 막대는 세그먼트별이 아니라 컬럼(연도) 단위로 통째로 아래→위로 올라오고,
       연도 사이에서만 좌→우로 순차 등장한다 (통계 서브페이지와 동일 규칙) */
    registerReveal(function () {
      gsap.to(cols, { scaleY: 1, duration: 0.4, ease: 'power2.out', stagger: Math.min(0.15, 0.6 / cols.length) });
    });
  }

  /* 2026-09-14: conic-gradient의 각도 기반 흰 여백은 반지름이 커질수록 벌어지는
     쐐기 모양이라 "사선으로 어긋나 보이는" 문제가 있었다 — 실제 SVG path arc + 균일
     stroke-width로 다시 그려서 반지름과 무관하게 두께가 일정한 직선 경계선을 쓴다. */
  function renderPie(root) {
    var wrap = el('div', 'pchart-pie-wrap');
    var total = PIE.reduce(function (sum, d) { return sum + d.value; }, 0);

    /* 2026-09-14: Figma 20516:21721 확인 결과 값 라벨은 옆에 쌓인 범례 목록이 아니라
       각 조각 바깥에 각도에 맞춰 흩어진 텍스트다 — 점(dot) 없이 조각별 텍스트 색으로만
       구분하고, 파이 중심에서 조각 중간각도 방향으로 뻗어나가는 위치에 배치한다. */
    var size = 132, r = size / 2, labelR = r + 20;
    var stage = el('div', 'pchart-pie-stage');
    stage.style.width = size + 'px';
    stage.style.height = size + 'px';

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'pchart-pie');
    svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);

    var labels = el('div', 'pchart-pie-labels');
    var tooltip = buildTooltip();
    var labelEls = [];

    if (!reduceMotion && hasGsap) {
      svg.style.transformOrigin = 'center'; svg.style.transform = 'scale(0.8)'; svg.style.opacity = 0;
    }

    var acc = 0;
    PIE.forEach(function (d) {
      var a0 = (acc / total) * Math.PI * 2 - Math.PI / 2;
      acc += d.value;
      var a1 = (acc / total) * Math.PI * 2 - Math.PI / 2;
      var x0 = r + r * Math.cos(a0), y0 = r + r * Math.sin(a0);
      var x1 = r + r * Math.cos(a1), y1 = r + r * Math.sin(a1);
      var largeArc = (a1 - a0) > Math.PI ? 1 : 0;
      var path = document.createElementNS(svgNS, 'path');
      path.setAttribute(
        'd',
        'M' + r + ',' + r + ' L' + x0 + ',' + y0 + ' A' + r + ',' + r + ' 0 ' + largeArc + ' 1 ' + x1 + ',' + y1 + ' Z'
      );
      path.setAttribute('fill', d.color);
      path.setAttribute('stroke', '#fff');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('stroke-linejoin', 'round');
      attachTooltip(path, tooltip, stage, d.label, d.value.toLocaleString(), d.color);
      svg.appendChild(path);

      var mid = (a0 + a1) / 2;
      var onRight = Math.cos(mid) >= 0;
      var lx = r + labelR * Math.cos(mid);
      var ly = r + labelR * Math.sin(mid);
      var label = el('span', 'pchart-pie-label');
      label.style.color = d.textColor || d.color;
      label.style.left = lx + 'px';
      label.style.top = ly + 'px';
      label.style.textAlign = onRight ? 'left' : 'right';
      label.style.transform = 'translate(' + (onRight ? '0' : '-100%') + ', -50%)';
      label.textContent = d.label + ', ' + d.value.toLocaleString();
      if (!reduceMotion && hasGsap) label.style.opacity = 0;
      labelEls.push(label);
      labels.appendChild(label);
    });

    stage.appendChild(svg);
    stage.appendChild(labels);
    stage.appendChild(tooltip);
    wrap.appendChild(stage);
    root.appendChild(wrap);

    /* 등장 모션 — 파이 전체가 팝업하듯 스케일+페이드로 들어오고, 조각을 그린 순서(문서→도서→
       영상→추천→지역별 정보) 그대로 라벨이 순차적으로 나타난다. 라벨은 이미 정렬용
       transform(translate)을 쓰고 있어 GSAP가 x/y로 건드리면 위치가 깨지므로 opacity만 애니메이션. */
    registerReveal(function () {
      gsap.to(svg, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.7)' });
      gsap.to(labelEls, { opacity: 1, duration: 0.22, ease: 'power1.out', stagger: 0.07, delay: 0.15 });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var renderers = { admin: renderAdmin, survey: renderSurvey, data: renderPie };
    document.querySelectorAll('[data-chart]').forEach(function (root) {
      var render = renderers[root.getAttribute('data-chart')];
      if (render) render(root);
    });
    /* admin은 rAF 이후에 reveal을 등록하므로, 옵저버 설치도 한 프레임 미뤄서 등록이 끝난
       뒤에 잡는다 */
    requestAnimationFrame(initScrollReveal);
  });
})();
