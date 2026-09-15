/* ==========================================================================
   arte 라이브러리 — AI 검색 인터랙션 + 모션 (GSAP)
   main[data-state="initial|result"] 토글은 그대로 두되(실제 검색/AI 로직 없음),
   페이지 진입 시 "검색어 + 로딩(점 4개 콩콩콩 + 스켈레톤 쉬머)"을 보여주고 일정
   시간 뒤 자동으로 결과를 열어 보여주는 데모 흐름이다. 검색창에 새로 입력해
   제출해도 같은 흐름(로딩→결과)이 다시 재생된다.

   전부 GSAP(gsap.fromTo/timeline, ScrollTrigger)로 직접 opacity/transform/
   clip-path/backgroundPosition을 건다 — CSS transition + 클래스 토글 방식은
   쓰지 않는다(스크롤로 이미 진입 조건을 만족한 요소에 싱크가 안 맞고 트랜지션이
   씹히는 문제가 있었음). prefers-reduced-motion이면 트윈 자체를 만들지 않고
   마크업의 최종 상태를 그대로 둔다.
   ========================================================================== */
(function () {
  'use strict';

  var main = document.getElementById('main');
  var form = document.getElementById('aiForm');
  var input = document.getElementById('aiInput');
  var panel = document.querySelector('.ais-panel');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined';
  var hasScrollTrigger = hasGsap && typeof ScrollTrigger !== 'undefined';
  if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  var LOADING_MS = 2200; /* AI가 답변을 만드는 것처럼 보이는 대기 시간 */
  var KEYWORD_MS = 1000; /* 키워드 검색 결과는 AI 생성 없이 바로 조회되는 값이라 더 짧게 */
  var demoTimer = null;

  /* --------------------------------------------------------------------
     1. 검색창 진입 — 인풋 rise, 검색 버튼 zoom, 언더라인 좌→우로 draw
     -------------------------------------------------------------------- */
  function playSearchIntro() {
    if (reduceMotion || !hasGsap) return;
    var btn = document.querySelector('.ais-search button');
    var line = document.querySelector('.ais-search-line');
    if (input) gsap.fromTo(input, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.733, ease: 'expo.out' });
    if (btn) gsap.fromTo(btn, { scale: 1.15, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: 'expo.out', delay: 0.1 });
    if (line) gsap.fromTo(line, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.143, ease: 'none', delay: 0.2 });
  }

  /* --------------------------------------------------------------------
     2. 로딩 인디케이터 — 점 4개가 순서대로 튀어오르는 콩콩콩 루프 +
        스켈레톤 위 딤드 그라데이션이 좌→우로 흐르는 쉬머 루프.
     -------------------------------------------------------------------- */
  function playLoadingDots() {
    if (reduceMotion || !hasGsap) return;
    var dots = document.querySelectorAll('.ais-loading-dots .dot');
    dots.forEach(function (dot, i) {
      gsap.fromTo(dot, { y: 0, opacity: 0.3 }, {
        y: -5, opacity: 1, duration: 0.4, ease: 'sine.inOut',
        repeat: -1, yoyo: true, delay: i * 0.15
      });
    });
  }

  function playSkeletonShimmer() {
    if (reduceMotion || !hasGsap) return;
    var shines = document.querySelectorAll('.skel-shine');
    shines.forEach(function (el) {
      gsap.fromTo(el, { backgroundPosition: '150% 0' }, { backgroundPosition: '-50% 0', duration: 1.6, ease: 'sine.inOut', repeat: -1 });
    });
  }

  /* --------------------------------------------------------------------
     3. AI 패널 높이 — 스켈레톤/결과 콘텐츠 높이에 맞춰 0→auto, 또는
        스켈레톤 높이→결과 높이로 부드럽게 키운다.
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
    var rows = Array.prototype.slice.call(document.querySelectorAll('.ais-skeleton .skel'));
    if (!reduceMotion && hasGsap && rows.length) {
      gsap.fromTo(rows, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.733, ease: 'expo.out', stagger: 0.27, delay: 0.4 });
    }
    growPanel(0, 0.867);
    playLoadingDots();
    playSkeletonShimmer();
  }

  function playResultReveal() {
    var fromHeight = panel ? panel.offsetHeight : 0;
    main.setAttribute('data-state', 'result');
    growPanel(fromHeight, 0.933);

    if (reduceMotion || !hasGsap) return;

    var desc = document.querySelector('.ais-desc[data-when="result"]');
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.ais-result .lst-cat [role="tab"]'));
    var cards = Array.prototype.slice.call(document.querySelectorAll('.ais-ev'));
    var moreBtn = document.querySelector('.ais-all');

    var tl = gsap.timeline();
    if (desc) tl.fromTo(desc, { opacity: 0 }, { opacity: 1, duration: 1.067, ease: 'power1.out' }, 0);
    if (tabs.length) tl.fromTo(tabs, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.733, ease: 'expo.out', stagger: 0.15 }, 0.2);

    var cardStart = 0.2 + tabs.length * 0.15 + 0.2;
    var cardGap = 0.47;

    cards.forEach(function (card, i) {
      var d = cardStart + i * cardGap;
      var thumb = card.querySelector('.ais-ev-thumb, .ais-ev-thumb--vid');
      var title = card.querySelector('.ais-ev-t');
      var badge = card.querySelector('.ais-ev-badge');
      var body = card.querySelector('.ais-ev-x p, .ais-ev-x--plain');

      if (thumb) tl.fromTo(thumb, { scale: 1.15, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: 'expo.out' }, d);
      if (title) tl.fromTo(title, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.733, ease: 'expo.out' }, d + 0.53);
      if (badge) tl.fromTo(badge, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.733, ease: 'expo.out' }, d + 0.7);
      if (body) tl.fromTo(body, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.733, ease: 'expo.out' }, d + 0.87);
    });

    var afterCards = cardStart + cards.length * cardGap + 0.3;
    if (moreBtn) tl.fromTo(moreBtn, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.733, ease: 'expo.out' }, afterCards);
  }

  /* 검색어 + 로딩 상태를 보여준 뒤, 일정 시간이 지나면 자동으로 결과를 연다.
     — 최초 진입/홈에서 ?q=로 들어온 경우/검색창에 다시 제출한 경우 모두 동일 흐름. */
  function startDemo() {
    if (demoTimer) { clearTimeout(demoTimer); demoTimer = null; }
    main.setAttribute('data-state', 'initial');
    playSearchIntro();
    playSkeletonIntro();
    demoTimer = window.setTimeout(function () {
      demoTimer = null;
      playResultReveal();
    }, reduceMotion ? 0 : LOADING_MS);
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (input && !input.value.trim()) input.value = '예술강사의 역할은 무엇인가요?';
      startDemo();
    });
  }

  var q = new URLSearchParams(window.location.search).get('q');
  if (q && q.trim() && input) input.value = q.trim();

  /* --------------------------------------------------------------------
     4. 키워드 검색 결과 탭 — "전체"만 제자리 페이드, 나머지는 "전체" 자리에
        겹쳐 있다가 다같이 제자리로 슬라이드. 실제 렌더 폭이 고정폭이 아니라서
        각 탭의 오프셋을 실측(offsetLeft 차) 해서 시작 x로 넘긴다.
     -------------------------------------------------------------------- */
  function playKwTabsUnfurl() {
    if (reduceMotion || !hasGsap) return;
    var tabs = document.querySelector('.kw-tabs');
    if (!tabs) return;
    /* .kw-ext("국가학술정보 검색")도 같은 tablist 안의 button이라 querySelectorAll('button')에
       이미 포함된다 — 전체~지역뿐 아니라 국가학술정보 검색까지 전부 "전체" 위치로 모였다가
       제자리로 슬라이드된다. */
    var buttons = Array.prototype.slice.call(tabs.querySelectorAll('button'));
    if (buttons.length < 2) return;

    var first = buttons[0];
    var rest = buttons.slice(1);
    var firstLeft = first.offsetLeft;

    var tl = gsap.timeline();
    tl.fromTo(first, { opacity: 0 }, { opacity: 1, duration: 1.067, ease: 'power1.out' }, 0.1);
    rest.forEach(function (b) {
      gsap.set(b, { x: firstLeft - b.offsetLeft, opacity: 0 });
    });
    tl.to(rest, { x: 0, opacity: 1, duration: 1.067, ease: 'expo.out' }, 0.233);
  }

  /* --------------------------------------------------------------------
     4-1. 키워드 검색 결과 섹션 전체 — AI 답변(로딩 콩콩콩+쉬머)이 도는 동안
        숨겨뒀다가, AI 생성 없이 바로 조회되는 값이라 더 짧은 시간(1초) 뒤에
        먼저 열린다. 여기서 열리면서 위 kw-tabs 모으기 모션도 같이 재생한다.
     -------------------------------------------------------------------- */
  function playKwSectionReveal() {
    var kw = document.querySelector('.kw');
    if (!kw) return;
    if (reduceMotion || !hasGsap) { playKwTabsUnfurl(); return; }
    gsap.set(kw, { opacity: 0, y: 28 });
    window.setTimeout(function () {
      gsap.to(kw, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' });
      playKwTabsUnfurl();
    }, KEYWORD_MS);
  }

  /* --------------------------------------------------------------------
     5. 아래쪽 키워드 블록 — 스크롤 진입 시 썸네일 zoom + 텍스트 rise 스태거.
        GSAP 타임라인에 scrollTrigger를 바로 물려서, 페이지 로드 시점에 이미
        조건을 만족한 블록(예: 첫 블록)도 트랜지션 없이 순간 스냅되지 않고
        정상적으로 처음부터 재생된다.
     -------------------------------------------------------------------- */
  function playKwBlocksScrollReveal() {
    if (reduceMotion || !hasGsap) return;
    var blocks = Array.prototype.slice.call(document.querySelectorAll('.kw-block'));
    if (!blocks.length) return;

    blocks.forEach(function (block) {
      var head = block.querySelector('.kw-block-head');
      var thumb = block.querySelector('.kw-thumb, .kw-thumb--vid, .kw-thumb--plain');
      var crumb = block.querySelector('.kw-crumb');
      var title = block.querySelector('.kw-item-t');
      var date = block.querySelector('.kw-date');
      var desc = block.querySelector('.kw-item-d');

      var tl = gsap.timeline({
        paused: true,
        scrollTrigger: hasScrollTrigger ? { trigger: block, start: 'top 88%', once: true } : undefined
      });

      if (head) tl.fromTo(head, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.733, ease: 'expo.out' }, 0);
      if (thumb) tl.fromTo(thumb, { scale: 1.15, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: 'expo.out' }, 0.08);
      if (crumb) tl.fromTo(crumb, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.733, ease: 'expo.out' }, 0.05);
      if (title) tl.fromTo(title, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.733, ease: 'expo.out' }, 0.22);
      if (date) tl.fromTo(date, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.733, ease: 'expo.out' }, 0.38);
      if (desc) tl.fromTo(desc, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.733, ease: 'expo.out' }, 0.55);

      if (!hasScrollTrigger) tl.play();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    startDemo();
    playKwSectionReveal();
    playKwBlocksScrollReveal();
  });

  /* --------------------------------------------------------------------
     6. 탭 그룹 (AI 결과 분류 / 키워드 결과 분류) — 기존 접근성 로직 그대로
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
