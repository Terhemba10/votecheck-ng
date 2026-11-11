// Hero: auto-rotating announcement slides with a 3D turn, over a waving Nigerian flag drawn on a canvas.
// Respects "reduced motion": no auto-play and a still flag. Auto-play pauses on hover, focus or the Pause button.

const SLIDE_MS = 8000;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

export function initHero({ onAction, t = (k, v) => ({ pause: "Pause", play: "Play" }[k] || `Show message ${v?.n} of ${v?.total}`) } = {}) {
  const hero = document.getElementById("hero");
  if (!hero) return;
  startFlag(hero.querySelector(".hero-flag canvas"), hero);

  const slides = [...hero.querySelectorAll(".slide")];
  const barsBox = hero.querySelector(".hero-bars");
  const pauseBtn = hero.querySelector(".hero-pause");
  let current = 0, userPaused = false, hovering = false, focused = false;

  // One bar per slide (INEC-style indicators). The active bar fills up while the slide is shown.
  const bars = slides.map((_, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "hero-bar";
    b.dataset.n = i + 1;
    b.innerHTML = "<i></i>";
    b.addEventListener("click", () => show(i));
    barsBox.appendChild(b);
    return b;
  });

  function show(i) {
    const prev = current;
    current = (i + slides.length) % slides.length;
    slides.forEach((s, n) => {
      const active = n === current;
      s.classList.toggle("is-active", active);
      s.classList.toggle("is-leaving", n === prev && prev !== current);
      s.toggleAttribute("inert", !active);
      s.setAttribute("aria-hidden", String(!active));
    });
    bars.forEach((b, n) => { b.classList.toggle("is-active", n === current); b.setAttribute("aria-current", String(n === current)); });
    hero.style.setProperty("--cam", current); // nudges the 3D flag "camera" for each slide
    restartFill();
  }

  // The fill animation on the active bar is the timer: when it ends, go to the next slide.
  function restartFill() {
    const fill = bars[current].querySelector("i");
    fill.style.animation = "none"; void fill.offsetWidth; fill.style.animation = "";
    syncPlayState();
  }
  bars.forEach(b => b.querySelector("i").addEventListener("animationend", () => show(current + 1)));

  function syncPlayState() {
    const running = !userPaused && !hovering && !focused && !reduceMotion.matches;
    hero.classList.toggle("is-paused", !running);
    hero.classList.toggle("no-autoplay", reduceMotion.matches);
  }

  hero.addEventListener("mouseenter", () => { hovering = true; syncPlayState(); });
  hero.addEventListener("mouseleave", () => { hovering = false; syncPlayState(); });
  hero.addEventListener("focusin", () => { focused = true; syncPlayState(); });
  hero.addEventListener("focusout", e => { if (!hero.contains(e.relatedTarget)) { focused = false; syncPlayState(); } });
  hero.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") { show(current + 1); e.preventDefault(); }
    if (e.key === "ArrowLeft") { show(current - 1); e.preventDefault(); }
  });
  pauseBtn.addEventListener("click", () => {
    userPaused = !userPaused;
    pauseBtn.setAttribute("aria-pressed", String(userPaused));
    relabel();
    syncPlayState();
  });
  // Labels in the current language; home.js calls this again when the language changes.
  function relabel() {
    pauseBtn.querySelector(".label").textContent = t(userPaused ? "play" : "pause");
    bars.forEach(b => b.setAttribute("aria-label", t("hero.show", { n: b.dataset.n, total: slides.length })));
  }
  relabel();
  hero.relabel = relabel;
  reduceMotion.addEventListener?.("change", syncPlayState);

  hero.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (btn && onAction) onAction(btn.dataset.action);
  });

  hero.style.setProperty("--slide-ms", SLIDE_MS + "ms");
  show(0);
  slides[0].classList.remove("is-leaving");
}

// A close-up of a Nigerian flag (green-white-green) rippling in the wind.
// Each frame shades a small image (GW x GH pixels) with moving diagonal folds, then scales it up smoothly,
// which looks like soft fabric and costs very little.
export function startFlag(canvas, hero) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const GW = 240, GH = 96;
  const buf = document.createElement("canvas"); buf.width = GW; buf.height = GH;
  const bctx = buf.getContext("2d"), img = bctx.createImageData(GW, GH), px = img.data;
  const GREEN = [0, 135, 81], WHITE = [238, 242, 239]; // official flag green #008751
  let w = 0, h = 0, visible = true, raf = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.offsetWidth; h = canvas.offsetHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  }

  // Height of the cloth at (x, y): travelling waves running in nearly the same diagonal direction,
  // so they form long parallel folds (like wind on a flag) rather than blotches.
  const fold = (x, y, t) =>
    0.62 * Math.sin(x * 15 + y * 5.5 - t * 1.3) +
    0.26 * Math.sin(x * 26 + y * 8.0 - t * 2.0 + 1.1) +
    0.12 * Math.sin(x * 7 + y * 1.5 - t * 0.8 + 2.3);
  const smooth = (a, b, v) => { const s = Math.min(1, Math.max(0, (v - a) / (b - a))); return s * s * (3 - 2 * s); };

  function draw(t) {
    for (let j = 0; j < GH; j++) {
      const y = j / GH;
      for (let i = 0; i < GW; i++) {
        const x = i / GW;
        const f = fold(x, y, t);
        const slope = (fold(x + 0.004, y, t) - f) / 0.004;  // light comes from the upper left
        const light = Math.max(0.3, 0.8 + 0.14 * f - 0.028 * slope);
        const u = x + 0.012 * f;                             // folds bend the stripe edges
        // 0 = green, 1 = white, with soft edges so the scaled-up stripes don't look stepped
        const white = smooth(1 / 3 - 0.006, 1 / 3 + 0.006, u) * (1 - smooth(2 / 3 - 0.006, 2 / 3 + 0.006, u));
        const k = (j * GW + i) * 4;
        for (let ch = 0; ch < 3; ch++) px[k + ch] = Math.min(255, (GREEN[ch] + (WHITE[ch] - GREEN[ch]) * white) * light);
        px[k + 3] = 255;
      }
    }
    bctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(buf, 0, 0, canvas.width, canvas.height);
  }

  function frame(ms) {
    raf = 0;
    draw(ms / 1000);
    if (!reduceMotion.matches && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  resize(); draw(0);
  new ResizeObserver(() => { resize(); draw(performance.now() / 1000); }).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(hero);
  document.addEventListener("visibilitychange", kick);
  reduceMotion.addEventListener?.("change", kick);
  kick();
}
