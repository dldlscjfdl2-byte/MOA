/* MOA — 함께하는 기부 · 인터랙션 */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const motion = hasGsap && !reduce;

  /* ---------- 숫자 포맷 / 카운트업 ---------- */
  const fmt = (v, d) => v.toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d });
  function countUp(el, attr = 'count', dur = 1.4) {
    const target = parseFloat(el.dataset[attr]);
    const d = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    if (!motion) { el.textContent = fmt(target, d) + suffix; return; }
    const o = { v: 0 };
    gsap.to(o, { v: target, duration: dur, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(o.v, d) + suffix; } });
  }

  /* ---------- 컬러칩 복사 (모션과 무관) ---------- */
  $$('.chip').forEach(chip => {
    chip.addEventListener('click', async () => {
      const hex = chip.dataset.hex;
      try { await navigator.clipboard.writeText(hex); } catch (e) {
        const t = document.createElement('textarea'); t.value = hex; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); } catch (_) {} t.remove();
      }
      chip.classList.add('is-copied');
      clearTimeout(chip._t); chip._t = setTimeout(() => chip.classList.remove('is-copied'), 1400);
    });
  });

  /* ---------- 06 메인 기능: 화면 크게 보기 (GSAP 없이도 동작) ---------- */
  const lb = $('.lightbox'), lbImg = $('.lightbox__img'), lbCap = $('.lightbox__cap'), lbScroll = $('.lightbox__scroll');
  let lbList = [], lbIdx = 0, lbReturn = null;
  function lbShow(i) {
    lbIdx = (i + lbList.length) % lbList.length;
    const shot = lbList[lbIdx];
    const name = shot.querySelector('.shot__cap').textContent;
    lbImg.src = shot.dataset.full;
    const lbBar = $('.lightbox__bar');
    if (shot.dataset.bar) { lbBar.src = shot.dataset.bar; lbBar.hidden = false; } else { lbBar.hidden = true; lbBar.removeAttribute('src'); }
    lbImg.alt = name + ' 화면 전체';
    lbCap.textContent = name + '  ·  ' + (lbIdx + 1) + ' / ' + lbList.length;
    lbScroll.scrollTop = 0;
    if (window.gsap && !reduce) gsap.fromTo(lbScroll, { opacity: 0, y: 24, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .45, ease: 'power3.out' });
  }
  function lbOpen(shot) {
    lbList = $$('.shot', shot.closest('.fn__gallery'));
    lbReturn = shot;
    lb.hidden = false; document.body.style.overflow = 'hidden';
    if (window.__lenis) window.__lenis.stop();
    lbShow(lbList.indexOf(shot));
    $('.lightbox__close').focus();
  }
  function lbClose() {
    lb.hidden = true; document.body.style.overflow = '';
    if (window.__lenis) window.__lenis.start();
    if (lbReturn) lbReturn.focus();
  }
  $$('.shot').forEach(s => s.addEventListener('click', () => lbOpen(s)));
  $$('[data-close]', lb).forEach(b => b.addEventListener('click', lbClose));
  $('.lightbox__prev').addEventListener('click', () => lbShow(lbIdx - 1));
  $('.lightbox__next').addEventListener('click', () => lbShow(lbIdx + 1));
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') lbClose();
    if (e.key === 'ArrowLeft') lbShow(lbIdx - 1);
    if (e.key === 'ArrowRight') lbShow(lbIdx + 1);
  });

  if (!hasGsap || reduce) {
    // 모션 없이 최종 상태로 표시
    $$('.ending__icons img').forEach((img, i, all) => placeOnRing(img, i, all.length, 1));
    return;
  }

  /* =========================================================
     이하 GSAP 모션
     ========================================================= */
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis 부드러운 스크롤 ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { offset: -40, duration: 1.4 }) : (target === 0 ? scrollTo(0, 0) : target.scrollIntoView({ behavior: 'smooth' }));
  }));

  /* ---------- 진행 게이지 ---------- */
  const gFill = $('.gauge__fill'), gNum = $('.gauge__num'), gLabel = $('.gauge__label'), toast = $('.toast');
  let toastShown = false;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      const p = self.progress;
      gFill.style.transform = `scaleX(${p})`;
      gNum.textContent = Math.round(p * 100);
      gLabel.classList.toggle('is-show', p > 0.03 && p < 0.995);
      if (p >= 0.995 && !toastShown) { toastShown = true; toast.classList.add('is-show'); setTimeout(() => toast.classList.remove('is-show'), 2600); }
      if (p < 0.9) toastShown = false;
    }
  });

  /* ---------- 네비게이션 ---------- */
  const nav = $('.nav');
  ScrollTrigger.create({
    trigger: '.hero', start: 'bottom top+=70',
    onEnter: () => nav.classList.add('is-light'), onLeaveBack: () => nav.classList.remove('is-light')
  });

  /* ---------- HERO 인트로: 퍼즐 조각이 모여 로고 완성 ---------- */
  const word = $('.hero__word');
  word.innerHTML = [...word.textContent].map(c => `<span class="ch" style="display:inline-block">${c}</span>`).join('');
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro
    .from('.hero__logo .piece--a', { x: -60, y: 18, rotation: -35, opacity: 0, duration: 1, transformOrigin: '50% 50%' }, 0.2)
    .from('.hero__logo .piece--b', { x: 60, y: -18, rotation: 35, opacity: 0, duration: 1, transformOrigin: '50% 50%' }, 0.2)
    .to('.hero__logo', { scale: 1.08, duration: .16, ease: 'power1.out', transformOrigin: '50% 50%' }, 1.12)
    .to('.hero__logo', { scale: 1, duration: .5, ease: 'back.out(3)' }, 1.28)
    .from('.hero__word .ch', { yPercent: 110, opacity: 0, stagger: .07, duration: .7 }, 1.1)
    .from('.hero__eyebrow', { y: 20, opacity: 0, duration: .7 }, .1)
    .from(['.hero__headline', '.hero__desc', '.hero__credit'], { y: 28, opacity: 0, stagger: .12, duration: .8 }, 1.3)
    .from('.hero__phones', { y: 120, rotation: 6, opacity: 0, duration: 1.4, ease: 'expo.out' }, .5)
    .from('.hero__scroll', { opacity: 0, duration: .6 }, 2);

  // 마우스에 반응하는 폰 입체감
  const hero = $('.hero'), phones = $('.hero__phones');
  if (window.matchMedia('(pointer: fine)').matches) {
    const rx = gsap.quickTo(phones, 'rotationX', { duration: .8, ease: 'power3' });
    const ry = gsap.quickTo(phones, 'rotationY', { duration: .8, ease: 'power3' });
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - .5) * 14);
      rx(-((e.clientY - r.top) / r.height - .5) * 10);
    });
    hero.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }
  // 스크롤 패럴랙스
  gsap.to('.hero__visual', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__copy', { y: 80, opacity: .2, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- HERO 파티클: 흩어진 점들이 로고로 모여듦 ---------- */
  (function particles() {
    const cv = $('.hero__particles'), ctx = cv.getContext('2d');
    let w, h, dpr, pts = [], target = { x: 0, y: 0 }, running = false, raf;
    const logo = $('.hero__logo');
    function spawn(p, anywhere) {
      if (anywhere) { p.x = Math.random() * w; p.y = Math.random() * h; }
      else {
        const side = Math.random() * 4 | 0;
        p.x = side === 0 ? -10 : side === 1 ? w + 10 : Math.random() * w;
        p.y = side === 2 ? -10 : side === 3 ? h + 10 : Math.random() * h;
      }
      p.r = Math.random() * 2.2 + .8;
      p.s = Math.random() * .5 + .25;
      p.a = Math.random() * .5 + .25;
      p.wob = Math.random() * Math.PI * 2;
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const lr = logo.getBoundingClientRect(), hr = cv.getBoundingClientRect();
      target.x = lr.left - hr.left + lr.width / 2; target.y = lr.top - hr.top + lr.height / 2;
      const n = Math.min(110, Math.round(w * h / 12000));
      pts = Array.from({ length: n }, () => { const p = {}; spawn(p, true); return p; });
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        const dx = target.x - p.x, dy = target.y - p.y, dist = Math.hypot(dx, dy) || 1;
        p.wob += .03;
        p.x += (dx / dist) * p.s + Math.cos(p.wob) * .35;
        p.y += (dy / dist) * p.s + Math.sin(p.wob) * .35;
        const fade = Math.min(1, dist / 120);
        ctx.globalAlpha = p.a * fade;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
        if (dist < 24) spawn(p, false);
      }
      raf = requestAnimationFrame(tick);
    }
    resize();
    window.addEventListener('resize', () => { resize(); });
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) { running = true; tick(); }
      else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
    }).observe(hero);
    // 인트로 후 로고 위치 재계산
    intro.eventCallback('onComplete', resize);
  })();

  /* ---------- 공통 등장 ---------- */
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 86%', once: true,
    onEnter: els => gsap.from(els, { y: 40, opacity: 0, duration: .9, stagger: .12, ease: 'power3.out', overwrite: true })
  });

  /* ---------- BACKGROUND: 줄 단위 상승 + 형광펜 ---------- */
  const st = gsap.timeline({ scrollTrigger: { trigger: '.statement', start: 'top 80%' } });
  st.from('.statement .line > span', { yPercent: 105, duration: 1, stagger: .12, ease: 'power4.out' })
    .fromTo('.statement mark', { '--mark': '0%' }, { '--mark': '100%', duration: .8, ease: 'power2.inOut' }, '-=.3');

  /* ---------- SITUATION → GOAL ---------- */
  const goal = $('.sg__card--goal');
  goal.classList.add('is-pending');
  const line = $('.sg__line'), head = $('.sg__head');
  [line, head].forEach(p => { const L = p.getTotalLength(); gsap.set(p, { strokeDasharray: L, strokeDashoffset: L }); });
  gsap.timeline({ scrollTrigger: { trigger: '.sg__flow', start: 'top 70%' } })
    .from('.sg__card--situation', { x: -50, opacity: 0, duration: .8, ease: 'power3.out' })
    .to(line, { strokeDashoffset: 0, duration: .6, ease: 'power2.inOut' })
    .to(head, { strokeDashoffset: 0, duration: .3, ease: 'power2.out' })
    .from(goal, { x: 50, opacity: 0, duration: .7, ease: 'power3.out' }, '-=.5')
    .add(() => goal.classList.remove('is-pending'), '+=.15')
    .fromTo(goal, { scale: 1 }, { scale: 1.03, duration: .25, yoyo: true, repeat: 1, ease: 'power1.inOut' }, '<');

  /* ---------- RESEARCH 차트 ---------- */
  // A. 세로 막대
  ScrollTrigger.create({
    trigger: '.chart--bars', start: 'top 72%', once: true,
    onEnter: () => {
      gsap.fromTo('.chart--bars .bar', { scaleY: 0 }, { scaleY: 1, duration: 1.1, stagger: .14, ease: 'power3.out', delay: .2 });
      $$('.chart--bars [data-count]').forEach(el => countUp(el, 'count', 1.3));
    }
  });
  // B. 100% → 117%
  gsap.set('.hbar__plus', { opacity: 0, scale: .4 });
  ScrollTrigger.create({
    trigger: '.chart--compare', start: 'top 72%', once: true,
    onEnter: () => {
      const tl = gsap.timeline({ delay: .2 });
      tl.fromTo('.hbar__fill--base', { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power3.out' })
        .add(() => countUp($('.chart--compare .hbar:first-child [data-count]'), 'count', 1), 0)
        .fromTo('.hbar__fill--up', { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: 'power3.out' }, .5)
        .add(() => countUp($('.hbar__val--green'), 'count', 1.3), .5)
        .to('.hbar__plus', { opacity: 1, scale: 1, duration: .5, ease: 'back.out(3)' }, 1.6);
    }
  });
  // C. 53% 도넛
  ScrollTrigger.create({
    trigger: '.chart--reasons', start: 'top 72%', once: true,
    onEnter: () => {
      gsap.fromTo('.donut__fg', { strokeDasharray: '0 100' }, { strokeDasharray: '53 100', duration: 1.6, ease: 'power3.out', delay: .2 });
      $$('.chart--reasons [data-count]').forEach(el => countUp(el, 'count', 1.5));
      gsap.fromTo('.reasons__list i', { scaleX: 0 }, { scaleX: 1, duration: .9, stagger: .15, ease: 'power3.out', delay: .6 });
      gsap.from('.reasons__list li', { x: 20, opacity: 0, duration: .6, stagger: .15, delay: .5 });
    }
  });

  /* ---------- PERSONA ---------- */
  $$('.pcard').forEach(card => {
    const fromLeft = card.classList.contains('pcard--left');
    const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 78%' } });
    tl.from(card, { x: fromLeft ? -60 : 60, opacity: 0, duration: .9, ease: 'power3.out' })
      .from($('.pcard__img img', card), { y: 40, opacity: 0, duration: .7, ease: 'power3.out' }, '-=.5')
      .from($('.pcard__needs', card), { y: 16, opacity: 0, duration: .5 }, '-=.3')
      .fromTo($('.pcard__link path', card), { strokeDashoffset: 40, strokeDasharray: '3 4', opacity: 0 }, { opacity: 1, strokeDashoffset: 0, duration: .5 })
      .from($('.pcard__service', card), { scale: .9, opacity: 0, duration: .5, ease: 'back.out(2)' });
  });

  /* ---------- DESIGN SYSTEM ---------- */
  // 타이핑 + 굵기 Light → Bold
  const typeEl = $('.type__text'), fullText = typeEl.textContent;
  typeEl.textContent = '';
  ScrollTrigger.create({
    trigger: '.ds__type', start: 'top 70%', once: true,
    onEnter: () => {
      const o = { n: 0, w: 100 };
      gsap.timeline()
        .to(o, { n: fullText.length, duration: 1.4, ease: 'none', onUpdate: () => { typeEl.textContent = fullText.slice(0, Math.round(o.n)); } })
        .to(o, { w: 800, duration: 1.4, ease: 'power2.inOut', onUpdate: () => { $('.type__live').style.fontWeight = Math.round(o.w); } }, '+=.2');
      gsap.from('.type__weights li', { x: -20, opacity: 0, stagger: .1, duration: .6, delay: .4 });
    }
  });
  // 로고: 스크롤에 따라 조각이 떨어졌다가 맞춰짐
  gsap.timeline({ scrollTrigger: { trigger: '.logo-stage', start: 'top bottom', end: 'center 45%', scrub: .6 } })
    .fromTo('.logo-big .lp--a', { x: -26, y: 8, rotation: -24, transformOrigin: '50% 50%' }, { x: 0, y: 0, rotation: 0, ease: 'power2.out' }, 0)
    .fromTo('.logo-big .lp--b', { x: 26, y: -8, rotation: 24, transformOrigin: '50% 50%' }, { x: 0, y: 0, rotation: 0, ease: 'power2.out' }, 0);
  // 컬러칩, 아이콘 등장
  gsap.from('.chip', { y: 30, opacity: 0, stagger: .12, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: '.chips', start: 'top 80%' } });
  gsap.from('.icons img', { scale: 0, rotation: -30, opacity: 0, stagger: { each: .05, from: 'random' }, duration: .6, ease: 'back.out(2)', scrollTrigger: { trigger: '.icons', start: 'top 82%' } });

  /* ---------- MAIN FUNCTION: 디자인 화면이 차례로 떠오름 ---------- */
  // Figma 모션(모임 채팅 / Frame 61 / Frame 62)의 0.4초 간격 순차 등장 + ease-out 을 화면 갤러리에 적용
  $$('.fn').forEach(fn => {
    const shots = $$('.shot', fn);
    const tl = gsap.timeline({ scrollTrigger: { trigger: fn, start: 'top 72%' } });
    tl.from([$('.fn__num', fn), $('.fn__title', fn), $('.fn__desc', fn)], { y: 40, opacity: 0, stagger: .1, duration: .8, ease: 'power3.out' }, 0)
      .from(shots, { y: 90, opacity: 0, rotation: i => (i % 2 ? 3 : -3), duration: .7, stagger: .4, ease: 'power2.out' }, .15);
  });
  // 데스크톱: 화면마다 다른 속도로 움직이는 깊이감
  ScrollTrigger.matchMedia({
    '(min-width: 901px)': () => {
      $$('.fn').forEach(fn => $$('.shot__frame', fn).forEach((f, i) => gsap.to(f, {
        yPercent: i % 2 ? -6 : 4, ease: 'none',
        scrollTrigger: { trigger: fn, start: 'top bottom', end: 'bottom top', scrub: true }
      })));
    }
  });

  /* ---------- ENDING: 흩어진 아이콘이 가운데로 모임 ---------- */
  function ringPos(i, n) {
    const vw = window.innerWidth, vh = window.innerHeight, narrow = vw < 700;
    let ang;
    if (narrow) {
      // 좁은 화면: 문구를 피해 위·아래 호에만 배치
      const half = Math.ceil(n / 2), k = i % half, top = i < half;
      const t = half === 1 ? .5 : k / (half - 1);
      ang = top ? (200 + t * 140) : (20 + t * 140);
    } else ang = (i / n) * 360 - 90;
    const rad = ang * Math.PI / 180;
    const rx = narrow ? vw * .36 : Math.min(vw * .38, 520);
    const ry = narrow ? vh * .36 : Math.min(vh * .36, 320);
    return { x: Math.cos(rad) * rx, y: Math.sin(rad) * ry };
  }
  function placeOnRing(img, i, n) { const p = ringPos(i, n); img.style.transform = `translate(${p.x}px, ${p.y}px)`; }
  const endIcons = $$('.ending__icons img');
  gsap.timeline({ scrollTrigger: { trigger: '.ending', start: 'top bottom', end: 'center center', scrub: .8, invalidateOnRefresh: true } })
    .fromTo(endIcons, {
      x: () => (Math.random() - .5) * window.innerWidth * 1.6,
      y: () => (Math.random() - .5) * window.innerHeight * 1.4 + window.innerHeight * .3,
      rotation: () => (Math.random() - .5) * 180, scale: .5, opacity: 0
    }, {
      x: i => ringPos(i, endIcons.length).x,
      y: i => ringPos(i, endIcons.length).y,
      rotation: 0, scale: 1, opacity: 1, ease: 'power2.out', stagger: .02
    });
  gsap.timeline({ scrollTrigger: { trigger: '.ending', start: 'top 40%' } })
    .from('.ending__logo use:first-child', { x: -40, rotation: -30, opacity: 0, transformOrigin: '50% 50%', duration: .9, ease: 'power3.out' })
    .from('.ending__logo use:last-child', { x: 40, rotation: 30, opacity: 0, transformOrigin: '50% 50%', duration: .9, ease: 'power3.out' }, '<')
    .from('.ending h2', { y: 40, opacity: 0, duration: .9, ease: 'power3.out' }, '-=.4')
    .from('.ending p', { y: 20, opacity: 0, duration: .6 }, '-=.5');

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
