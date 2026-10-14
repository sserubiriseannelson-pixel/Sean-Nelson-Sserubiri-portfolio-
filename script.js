(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");

  /* ---------- Split text into words for the masked reveal ---------- */
  function wrapWords(el, cls) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    return words.map((word, i) => {
      const span = document.createElement("span");
      span.className = cls;
      span.style.setProperty("--i", i);
      if (cls === "mask") {
        const inner = document.createElement("span");
        inner.className = "w";
        inner.textContent = word;
        span.appendChild(inner);
      } else {
        span.textContent = word;
      }
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      return span;
    });
  }

  document.querySelectorAll("[data-split]").forEach(el => wrapWords(el, "mask"));
  const scrubs = [...document.querySelectorAll("[data-scrub]")].map(el => ({ el, words: wrapWords(el, "sw") }));

  /* ---------- Intro: start once fonts are ready ---------- */
  let started = false;
  const start = () => { if (!started) { started = true; requestAnimationFrame(() => root.classList.add("ready")); } };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  setTimeout(start, 900);

  /* ---------- Reveal sections as they enter ---------- */
  const blocks = document.querySelectorAll(".block");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("seen"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    blocks.forEach(b => io.observe(b));
  } else {
    blocks.forEach(b => b.classList.add("seen"));
  }

  /* ---------- Scroll-driven word highlight ---------- */
  function updateScrub() {
    const vh = window.innerHeight;
    scrubs.forEach(({ el, words }) => {
      const r = el.getBoundingClientRect();
      const p = reduce ? 1 : Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (vh * 0.5 + r.height * 0.5)));
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle("on", i < n));
    });
  }

  /* ---------- Marquee that reacts to scrolling ---------- */
  const track = document.getElementById("marquee-track");
  const inner = document.getElementById("hero-inner");
  const hero = document.getElementById("top");
  let x = 0, dir = -1, boost = 0, lastY = window.scrollY;

  function loop() {
    const y = window.scrollY;
    const dy = y - lastY;
    lastY = y;
    if (dy !== 0) dir = dy > 0 ? -1 : 1;
    boost += (Math.min(Math.abs(dy), 60) * 0.15 - boost) * 0.1;

    if (track && !reduce) {
      const half = track.scrollWidth / 2;
      x += dir * (0.7 + boost);
      while (x <= -half) x += half;
      while (x > 0) x -= half;
      track.style.transform = `translate3d(${x}px,0,0)`;
    }

    if (inner && !reduce) {
      const h = hero.offsetHeight || 1;
      const k = Math.min(1, Math.max(0, y / h));
      inner.style.transform = `translate3d(0,${y * 0.22}px,0)`;
      inner.style.opacity = String(1 - k * 1.1);
    }

    updateScrub();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ---------- Flow-field graphic in the hero ---------- */
  const cv = document.getElementById("field");
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext("2d");
  const BG = "15,31,24";
  let W = 0, H = 0, parts = [], t = 0, visible = true;
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = cv.getBoundingClientRect();
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = `rgb(${BG})`;
    ctx.fillRect(0, 0, W, H);
    const n = Math.round(Math.min(650, (W * H) / 2800));
    parts = Array.from({ length: n }, spawn);
  }

  function spawn() {
    return { x: Math.random() * W, y: Math.random() * H, life: 60 + Math.random() * 220 };
  }

  function angle(px, py) {
    let a = Math.sin(px * 0.0032 + t * 0.25) * 1.7 + Math.cos(py * 0.0041 - t * 0.2) * 1.7;
    const dx = px - mouse.x, dy = py - mouse.y, d2 = dx * dx + dy * dy;
    if (d2 < 26000) {
      const f = 1 - d2 / 26000;
      const swirl = Math.atan2(dy, dx) + Math.PI / 2;
      a = a + (swirl - a) * f * 0.85;
    }
    return a;
  }

  function frame() {
    t += 0.016;
    ctx.fillStyle = `rgba(${BG},0.1)`;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(176,214,190,0.5)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (const p of parts) {
      const a = angle(p.x, p.y);
      const nx = p.x + Math.cos(a) * 1.5;
      const ny = p.y + Math.sin(a) * 1.5;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      p.x = nx; p.y = ny;
      if (--p.life < 0 || nx < 0 || ny < 0 || nx > W || ny > H) Object.assign(p, spawn());
    }
    ctx.stroke();
  }

  function run() {
    if (visible && !document.hidden) frame();
    requestAnimationFrame(run);
  }

  resize();
  window.addEventListener("resize", resize);
  hero.addEventListener("pointermove", e => {
    const r = cv.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(hero);
  }

  if (reduce) {
    for (let i = 0; i < 240; i++) frame();
  } else {
    requestAnimationFrame(run);
  }
})();
