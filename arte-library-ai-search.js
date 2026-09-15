/* ==========================================================================
   arte 라이브러리 — AI 검색 인터랙션 + 모션
   main[data-state="initial|result"] 토글은 그대로 두되(실제 검색/AI 로직 없음),
   상태 전환과 최초 진입에 uxui-test-1.github.io/arte-main/arte-search.html 의
   모션을 참고해 이식한다. 그 사이트는 정적 스크린샷 두 장을 마스크 윈도우로
   잘라 움직이는 방식(실제 콘텐츠가 없어서)이었지만, 이 페이지는 진짜 콘텐츠라
   요소 자체에 직접 트랜지션을 건다 — 어휘(rise/zoom/fade/draw)와 타이밍/이징은
   그대로 가져오고, 구현 방식만 이 페이지에 맞게 바꿨다.

   전부 "CSS transition + .in 클래스 토글" 구조(참고 사이트와 동일): 각 요소가
   자기 --d(지연)를 인라인으로 갖고, 여기서는 다음 프레임에 .in을 한꺼번에
   붙이기만 한다 — 스태거는 --d가 담당한다.
   ========================================================================== */
(function () {
  'use strict';

  var main = document.getElementById('main');
  var form = document.getElementById('aiForm');
  var input = document.getElementById('aiInput');
  var panel = document.querySelector('.ais-panel');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined';

  /* --------------------------------------------------------------------
     0. 유틸 — reduceMotion이면 아무 것도 안 건드리고 최종 상태 그대로 둔다.
     -------------------------------------------------------------------- */
  function prep(el, cls, delay) {
    if (!el || reduceMotion) return;
    if (cls) el.classList.add(cls);
    if (delay != null) el.style.setProperty('--d', delay + 's');
  }
  function reveal(els) {
    if (reduceMotion || !els.length) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        els.forEach(function (el) { el.classList.add('in'); });
      });
    });
  }

  /* --------------------------------------------------------------------
     1. 검색창 진입 — 인풋 rise, 검색 버튼 zoom, 언더라인 좌→우로 draw
     -------------------------------------------------------------------- */
  function playSearchIntro() {
    var btn = document.querySelector('.ais-search button');
    var line = document.querySelector('.ais-search-line');
    prep(input, 'rv-rise', 0);
    prep(btn, 'rv-zoom', 0.1);
    prep(line, '', 0.2); /* .ais-search-line은 기본 클래스에 이미 draw 트랜지션이 있음 */
    reveal([input, btn, line].filter(Boolean));
  }

  /* --------------------------------------------------------------------
     2. AI 패널 — 높이는 GSAP로 0→auto(진입)/스켈레톤높이→auto(결과 전환)로
        키우고(참고 사이트의 패널 grow), 안쪽 콘텐츠는 rv-* 스태거로 등장한다.
     -------------------------------------------------------------------- */
  function growPanel(fromHeight, duration, onDone) {
    if (reduceMotion || !hasGsap || !panel) { if (onDone) onDone(); return; }
    gsap.killTweensOf(panel);
    gsap.set(panel, { height: fromHeight, overflow: 'hidden' });
    gsap.to(panel, {
      height: 'auto', duration: duration, ease: 'expo.out',
      onComplete: function () { panel.style.overflow = ''; panel.style.height = ''; if (onDone) onDone(); }
    });
  }

  function playSkeletonIntro() {
    var lines = Array.prototype.slice.call(document.querySelectorAll('.ais-skeleton .skel'));
    lines.forEach(function (el, i) { prep(el, 'rv-rise', 0.4 + i * 0.27); });
    growPanel(0, 0.867);
    reveal(lines);
  }

  function playResultReveal() {
    var fromHeight = panel ? panel.offsetHeight : 0;
    main.setAttribute('data-state', 'result');

    var desc = document.querySelector('.ais-desc[data-when="result"]');
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.ais-result .lst-cat [role="tab"]'));
    var cards = Array.prototype.slice.call(document.querySelectorAll('.ais-ev'));
    var moreBtn = document.querySelector('.ais-all');

    prep(desc, 'rv-fade', 0);
    tabs.forEach(function (t, i) { prep(t, 'rv-rise', 0.2 + i * 0.15); });

    var cardStart = 0.2 + tabs.length * 0.15 + 0.2;
    var cardGap = 0.47;
    var toReveal = [desc].concat(tabs);

    cards.forEach(function (card, i) {
      var d = cardStart + i * cardGap;
      var thumb = card.querySelector('.ais-ev-thumb, .ais-ev-thumb--vid');
      var title = card.querySelector('.ais-ev-t');
      var badge = card.querySelector('.ais-ev-badge');
      var body = card.querySelector('.ais-ev-x p, .ais-ev-x--plain');

      prep(thumb, 'rv-zoom', d);
      prep(title, 'rv-rise', d + 0.53);
      prep(badge, 'rv-rise', d + 0.7);
      prep(body, 'rv-rise', d + 0.87);
      toReveal.push(thumb, title, badge, body);
    });

    var afterCards = cardStart + cards.length * cardGap + 0.3;
    prep(moreBtn, 'rv-rise', afterCards);
    toReveal.push(moreBtn);

    var finalHeight = panel ? (function () {
      // 결과 콘텐츠가 이미 표시된 상태의 자연 높이를 재기 위해 잠깐 height를 비운다
      var prevInline = panel.style.height;
      panel.style.height = 'auto';
      var h = panel.offsetHeight;
      panel.style.height = prevInline;
      return h;
    })() : 0;

    if (reduceMotion || !hasGsap) {
      reveal(toReveal.filter(Boolean));
      return;
    }
    growPanel(fromHeight, 0.933);
    reveal(toReveal.filter(Boolean));
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (input && !input.value.trim()) input.value = '예술강사의 역할은 무엇인가요?';
      if (main.getAttribute('data-state') === 'result') return;
      playResultReveal();
    });
  }

  /* 홈 검색창에서 ?q= 로 넘어온 경우 바로 결과 상태로 (모션 없이) */
  var q = new URLSearchParams(window.location.search).get('q');
  var startedAsResult = !!(q && q.trim());
  if (startedAsResult) {
    if (input) input.value = q.trim();
    main.setAttribute('data-state', 'result');
  }

  /* --------------------------------------------------------------------
     3. 키워드 검색 결과 탭 — "전체"만 제자리 페이드, 나머지는 "전체" 자리에
        겹쳐 있다가 다같이 제자리로 슬라이드. 실제 렌더 폭이 고정폭이 아니라서
        각 탭의 오프셋을 실측(offsetLeft 차) 해서 --dx로 넘긴다.
     -------------------------------------------------------------------- */
  function playKwTabsUnfurl() {
    var tabs = document.querySelector('.kw-tabs');
    if (!tabs || reduceMotion) return;
    var buttons = Array.prototype.slice.call(tabs.querySelectorAll('button'));
    if (buttons.length < 2) return;
    var firstLeft = buttons[0].offsetLeft;
    buttons.forEach(function (b, i) {
      if (i === 0) return;
      var dx = firstLeft - b.offsetLeft;
      b.style.transform = 'translateX(' + dx + 'px)';
    });
    tabs.classList.add('is-unfurling');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        tabs.classList.add('in');
        buttons.forEach(function (b) { b.style.transform = ''; });
      });
    });
  }

  /* --------------------------------------------------------------------
     4. 아래쪽 키워드 블록 — 스크롤 진입 시 썸네일 zoom + 텍스트 rise 스태거
     -------------------------------------------------------------------- */
  function playKwBlocksScrollReveal() {
    if (reduceMotion) return;
    var blocks = Array.prototype.slice.call(document.querySelectorAll('.kw-block'));
    if (!blocks.length) return;

    var hasScrollTrigger = typeof ScrollTrigger !== 'undefined';
    if (hasGsap && hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    blocks.forEach(function (block) {
      var head = block.querySelector('.kw-block-head');
      var thumb = block.querySelector('.kw-thumb, .kw-thumb--vid, .kw-thumb--plain');
      var crumb = block.querySelector('.kw-crumb');
      var title = block.querySelector('.kw-item-t');
      var date = block.querySelector('.kw-date');
      var desc = block.querySelector('.kw-item-d');

      prep(head, 'rv-rise', 0);
      prep(thumb, 'rv-zoom', 0.08);
      prep(crumb, 'rv-rise', 0.05);
      prep(title, 'rv-rise', 0.22);
      prep(date, 'rv-rise', 0.38);
      prep(desc, 'rv-rise', 0.55);

      var els = [head, thumb, crumb, title, date, desc].filter(Boolean);
      if (!els.length) return;

      if (hasGsap && hasScrollTrigger) {
        ScrollTrigger.create({
          trigger: block, start: 'top 88%', once: true,
          onEnter: function () { els.forEach(function (el) { el.classList.add('in'); }); }
        });
      } else {
        els.forEach(function (el) { el.classList.add('in'); });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!startedAsResult) {
      playSearchIntro();
      playSkeletonIntro();
    }
    playKwTabsUnfurl();
    playKwBlocksScrollReveal();
  });

  /* --------------------------------------------------------------------
     5. 탭 그룹 (AI 결과 분류 / 키워드 결과 분류) — 기존 접근성 로직 그대로
     -------------------------------------------------------------------- */
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.setAttribute('aria-selected', 'false'); });
        tab.setAttribute('aria-selected', 'true');
      });
    });

    list.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var n = e.key === 'ArrowRight' ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
      tabs[n].focus();
      tabs[n].click();
    });
  });
})();
