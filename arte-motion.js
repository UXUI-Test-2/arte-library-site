/* ==========================================================================
   arte 라이브러리 — 사이트 공통 모션 (GSAP)
   범위: 사용자 승인 — 페이지 전환 + 스크롤 리빌까지 (tokens.md의 "모션 없음" 규칙에 대한
   이 프로젝트 한정 예외. 승인 근거는 projects/arte/CLAUDE.md 참조)

   모든 페이지 공통 로드: gsap.min.js, ScrollTrigger.min.js 다음에 이 파일을 defer로 로드.
   prefers-reduced-motion: reduce 인 경우 전 구간 모션을 끄고 최종 상태만 즉시 렌더한다.
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typeof gsap === 'undefined') return;
  if (!reduceMotion && typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

  /* --------------------------------------------------------------------
     1. 히어로 KV 등장 모션
     Figma get_motion_context 원본값(노드 19388:792 "Main KV - Search"):
       opacity 0→1, translateY 60px→0, 2s 타임라인 중 0~7.5% 홀드 후 42.5%까지
       cubic-bezier(0.16, 1, 0.3, 1) 로 도달 = 지연 0.15s + 지속 0.7s.
     GSAP 코어에는 커스텀 베지어 이징이 없어 가장 가까운 내장 이징(expo.out)으로 근사했다.
     -------------------------------------------------------------------- */
  function heroReveal() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    var targets = hero.querySelectorAll('.eyebrow, .display, .concept-copy, .search, .prompts');
    if (!targets.length) return;

    if (reduceMotion) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      targets,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 0.7, delay: 0.15, ease: 'expo.out', stagger: 0.08 }
    );
  }

  /* --------------------------------------------------------------------
     1-b. 히어로 KV 축소 인터렉션 — 진입 모션이 끝나고 잠시 뒤 타이틀/검색 간격을 축소
     Figma 노드 20516:22073(초기진입) → 20516:23920(축소인터렉션):
       타이틀 100px→80px, kv-search 여백 120px→60px, 검색어 44px→36px,
       검색 인풋 하단 패딩 26px→16px (letter-spacing은 em 단위라 자동 비례, 값 그대로).
     실제 축소는 CSS transition(arte-library-line.css .kv.is-compact)이 담당하고,
     여기서는 홈 진입 후 한 번만 트리거 클래스를 붙인다.
     -------------------------------------------------------------------- */
  function heroShrink() {
    var kv = document.querySelector('.kv');
    if (!kv || reduceMotion) return;
    window.setTimeout(function () {
      kv.classList.add('is-compact');
    }, 2200);
  }

  /* --------------------------------------------------------------------
     2. 서브페이지 타이틀 등장 모션 (영상 · 추천)
     참고: uxui-test-1.github.io/arte-main/arte-location.html
     .title-reveal 스코프: 브레드크럼은 정적으로 두고, h1과 (있다면) 상단 분류
     탭(.sub-tabs a)만 각각 .reveal-mask(overflow:hidden)에 담아 아래→위로
     슬라이드해 등장시킨다 — 오퍼시티는 건드리지 않고 마스크로만 영역을 가린다.
     이어서 본문 영역(.sub-content)이 페이드인한다.
     -------------------------------------------------------------------- */
  function titleReveal() {
    var scopes = document.querySelectorAll('.title-reveal');
    if (!scopes.length) return;

    scopes.forEach(function (scope) {
      var titleMask = scope.querySelector('.sub-h1') && scope.querySelector('.sub-h1').closest('.reveal-mask');
      var tabMasks = scope.querySelectorAll('.sub-tabs .reveal-mask');
      var content = scope.nextElementSibling;

      if (reduceMotion) {
        if (content) gsap.set(content, { opacity: 1 });
        return;
      }

      var tl = gsap.timeline({ delay: 0.1 });

      if (titleMask) {
        tl.fromTo(titleMask.firstElementChild, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: 'expo.out' });
      }

      if (tabMasks.length) {
        var tabEls = Array.prototype.map.call(tabMasks, function (m) { return m.firstElementChild; });
        tl.fromTo(tabEls, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: 'expo.out', stagger: 0.15 }, '-=0.25');
      }

      if (content) {
        gsap.set(content, { opacity: 0 });
        tl.to(content, { opacity: 1, duration: 0.5, ease: 'power1.out' }, '-=0.1');
      }
    });
  }

  /* --------------------------------------------------------------------
     3. 스크롤 리빌 — 섹션 헤드 + 카드형 컴포넌트
     -------------------------------------------------------------------- */
  function scrollReveal() {
    if (reduceMotion || typeof ScrollTrigger === 'undefined') return;

    var groupSelectors = [
      '.sec-head',
      '.rail .doc',
      '.books .book',
      '.region-row',
      '.reco-left > a',
      '.bookcur',
      '.bookcur-list > a',
      '.ev-card',
      '.notices li',
      '.linebox.grid-3 > .cell',
      '.stats-grid > .cell',
      '.res-card',
      '.filters > *'
    ];

    groupSelectors.forEach(function (sel) {
      var els = document.querySelectorAll(sel);
      if (!els.length) return;
      gsap.set(els, { opacity: 0, y: 24 });
      ScrollTrigger.batch(els, {
        start: 'top 88%',
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08 });
        }
      });
    });
  }

  /* --------------------------------------------------------------------
     4. 페이지 전환 — 사이트 내부 링크 클릭 시 페이드 아웃 후 이동, 도착 시 페이드 인
     -------------------------------------------------------------------- */
  function pageTransitions() {
    var overlay = document.createElement('div');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9999', 'background:#ffffff',
      'pointer-events:none', 'opacity:0'
    ].join(';');
    document.body.appendChild(overlay);

    if (reduceMotion) return;

    gsap.fromTo(overlay, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: 'power1.out' });

    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (!href.endsWith('.html') && href.indexOf('.html#') === -1) return;

      e.preventDefault();
      overlay.style.pointerEvents = 'auto';
      gsap.fromTo(
        overlay,
        { opacity: 0 },
        {
          opacity: 1, duration: 0.28, ease: 'power1.in',
          onComplete: function () { window.location.href = href; }
        }
      );
    });

    window.addEventListener('pageshow', function (evt) {
      if (evt.persisted) {
        gsap.set(overlay, { opacity: 0, pointerEvents: 'none' });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    heroReveal();
    heroShrink();
    titleReveal();
    scrollReveal();
    pageTransitions();
  });
})();
