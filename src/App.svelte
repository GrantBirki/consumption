<script>
  import { onMount } from "svelte";

  import consumptionImage from "../consumption.png";
  import {
    applyPointerMove,
    buildChaosVars,
    createChaosState,
    isChaosSettled,
    tickChaos,
  } from "./lib/chaos.js";
  import {
    buildScrollState,
    buildStatusReadouts,
    buildWordmarkEchoes,
    corruptPhrase,
    getLayoutMode,
  } from "./lib/badness.js";

  const siteName = "consumption.horse";
  const heroWordmark = "c o n s u m p t i o n";
  const description =
    "A maximalist cursor-reactive web artwork that scrambles the palette with every movement.";
  const POINTER_COOLDOWN_MS = 10;
  const PRESENTATION_COOLDOWN_MS = 110;
  const LAYOUT_INTERVAL_MS = 2600;
  const LAYOUT_IDLE_RESET_MS = 180;
  const FLASH_INTERVAL_MS = 5400;
  const FLASH_DURATION_MS = 420;
  const wallpaperRows = Array.from({ length: 9 }, () => heroWordmark.toUpperCase());
  const marqueeBursts = [
    "retina tax in progress / chromatic debt increasing / cursor panic live",
    "consumption.png escaped containment / hover damage accepted / saturation emergency",
    "all colors are currently arguing / elegance revoked / restraint unavailable",
    "layout sabotage rotating / decoy buttons armed / surface confidence false",
  ];
  const floaters = [
    { id: "north", top: "3%", left: "3%", size: "13rem", duration: "15s", delay: "-2s", rotate: "-18deg" },
    { id: "east", top: "12%", left: "77%", size: "11rem", duration: "18s", delay: "-7s", rotate: "14deg" },
    { id: "center", top: "38%", left: "15%", size: "15rem", duration: "20s", delay: "-5s", rotate: "-8deg" },
    { id: "south", top: "68%", left: "72%", size: "12rem", duration: "17s", delay: "-9s", rotate: "24deg" },
    { id: "west", top: "61%", left: "5%", size: "10rem", duration: "14s", delay: "-4s", rotate: "-26deg" },
    { id: "orbit", top: "28%", left: "55%", size: "16rem", duration: "23s", delay: "-12s", rotate: "9deg" },
    { id: "centerline", top: "82%", left: "40%", size: "18rem", duration: "21s", delay: "-6s", rotate: "-3deg" },
  ];
  const warnings = [
    "begin retinal taxation",
    "accept color debt",
    "submit to glare",
    "increase visual friction",
    "destabilize palette",
    "deny quiet mode",
    ];
  const rituals = [
    "move the cursor one pixel and the entire interface panics",
    "wait for the colors to settle, then ruin them again",
    "admire how aggressively unhelpful the composition remains",
  ];
  const badges = [
    "under construction forever",
    "best viewed while squinting",
    "taste engine offline",
    "friendly colors denied",
    "decoy affordances enabled",
    "scroll liability accepted",
  ];
  const fakeWindows = [
    {
      id: "directory",
      title: "taste-manager.exe",
      lines: ["palette jail: open", "mercy slider: missing", "cursor debt: compounding"],
    },
    {
      id: "alerts",
      title: "retina_alerts.log",
      lines: ["glare escalation in progress", "anti-ux pledge reaffirmed", "comfort mode permanently denied"],
    },
    {
      id: "portal",
      title: "portal://consumption",
      lines: ["entry denied", "clarity unavailable", "proceed anyway"],
    },
  ];
  const receiptItems = [
    "1x broken hierarchy",
    "2x fraudulent buttons",
    "4x hostile panels",
    "8x chromatic overreach",
    "16x unnecessary glow",
  ];

  let stage;
  let layoutStep = 0;
  let layoutMode = getLayoutMode(0);
  let flashMode = false;
  let flashMessage = corruptPhrase("eyeball downgrade event", 0.5, 0);
  let scrollState = buildScrollState(0, 1, 1);
  let statusReadouts = buildStatusReadouts({
    energy: 0.14,
    scatter: 14,
    wobble: 5,
    speed: 0,
    flash: false,
    scrollRatio: 0,
    phase: 0,
  });
  let wordmarkEchoes = buildWordmarkEchoes(heroWordmark, 0.18, 0);
  let manifestoEcho = corruptPhrase("restraint unavailable / taste engine offline", 0.3, 0);
  let decoyHeading = corruptPhrase("welcome to the counterfeit comfort layer", 0.55, 1);

  onMount(() => {
    let chaos = createChaosState();
    let lastPoint = null;
    let pendingPointerMove = null;
    let frameHandle = 0;
    let lastTime = globalThis.performance?.now?.() ?? Date.now();
    let loopActive = false;
    let nextPointerAt = 0;
    let currentSpeed = 0;
    let nextPresentationAt = 0;
    let flashTimeoutHandle = 0;
    let lastPointerActivityAt = -Infinity;
    let nextLayoutShiftAt = Infinity;

    const requestFrame =
      globalThis.requestAnimationFrame ??
      ((callback) => globalThis.setTimeout(() => callback(Date.now()), 16));
    const cancelFrame = globalThis.cancelAnimationFrame ?? globalThis.clearTimeout;

    const cycleLayoutMode = (now) => {
      layoutStep += 1;
      layoutMode = getLayoutMode(layoutStep);
      nextLayoutShiftAt = now + LAYOUT_INTERVAL_MS;
      refreshPresentation(now, true);
      applyStageVars();
    };

    const applyStageVars = () => {
      if (!stage) return;

      for (const [key, value] of Object.entries(buildChaosVars(chaos))) {
        stage.style.setProperty(key, value);
      }

      stage.style.setProperty("--scroll-shift", `${scrollState.shift.toFixed(2)}px`);
      stage.style.setProperty("--scroll-torque", `${scrollState.torque.toFixed(2)}deg`);
      stage.style.setProperty("--scroll-glare", scrollState.glare.toFixed(3));
      stage.style.setProperty("--scroll-ratio", scrollState.ratio.toFixed(3));
      stage.style.setProperty("--layout-index", `${layoutMode.index}`);
    };

    const scheduleStep = () => {
      if (loopActive) return;

      loopActive = true;
      lastTime = globalThis.performance?.now?.() ?? Date.now();
      frameHandle = requestFrame(step);
    };

    const refreshPresentation = (now, force = false) => {
      if (!force && now < nextPresentationAt) return;

      const intensity = Math.min(1, chaos.energy * 1.35 + currentSpeed / 140 + scrollState.ratio * 0.18);
      statusReadouts = buildStatusReadouts({
        energy: chaos.energy,
        scatter: chaos.scatter,
        wobble: chaos.wobble,
        speed: currentSpeed,
        flash: flashMode,
        scrollRatio: scrollState.ratio,
        phase: layoutStep,
      });
      wordmarkEchoes = buildWordmarkEchoes(heroWordmark, intensity, layoutStep + Math.round(scrollState.ratio * 10));
      manifestoEcho = corruptPhrase(
        "restraint unavailable / taste engine offline / clarity revoked",
        Math.min(1, intensity + 0.1),
        layoutStep + (flashMode ? 7 : 0)
      );
      decoyHeading = corruptPhrase(
        "welcome to the counterfeit comfort layer",
        Math.min(1, intensity + scrollState.ratio * 0.12),
        layoutStep + 3
      );
      flashMessage = corruptPhrase(
        flashMode ? "eyeball downgrade event" : "chromatic debt warming",
        Math.min(1, intensity + (flashMode ? 0.3 : 0)),
        layoutStep + 5
      );
      nextPresentationAt = now + PRESENTATION_COOLDOWN_MS;
    };

    const getBounds = () => {
      if (stage) {
        const rect = stage.getBoundingClientRect();
        return {
          width: rect.width || globalThis.innerWidth || 1,
          height: rect.height || globalThis.innerHeight || 1,
          left: rect.left,
          top: rect.top,
        };
      }

      return {
        width: globalThis.innerWidth || 1,
        height: globalThis.innerHeight || 1,
        left: 0,
        top: 0,
      };
    };

    const updateScrollState = (force = false) => {
      const root = globalThis.document?.documentElement;
      const body = globalThis.document?.body;
      const documentHeight = Math.max(
        root?.scrollHeight ?? 0,
        body?.scrollHeight ?? 0,
        globalThis.innerHeight || 1
      );
      scrollState = buildScrollState(globalThis.scrollY || 0, globalThis.innerHeight || 1, documentHeight);
      applyStageVars();
      refreshPresentation(globalThis.performance?.now?.() ?? Date.now(), force);
    };

    const handlePointerMove = (event) => {
      const now = globalThis.performance?.now?.() ?? Date.now();
      const bounds = getBounds();
      pendingPointerMove = {
        point: {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        },
        bounds,
      };

      if (now - lastPointerActivityAt > LAYOUT_IDLE_RESET_MS) {
        nextLayoutShiftAt = now + LAYOUT_INTERVAL_MS;
      } else if (now >= nextLayoutShiftAt) {
        cycleLayoutMode(now);
      }

      lastPointerActivityAt = now;
      scheduleStep();
    };

    const handleScroll = () => {
      updateScrollState(true);
    };

    const resetPointer = () => {
      lastPoint = null;
      pendingPointerMove = null;
      currentSpeed = 0;
      refreshPresentation(globalThis.performance?.now?.() ?? Date.now(), true);
    };

    const triggerFlash = () => {
      flashMode = true;
      refreshPresentation(globalThis.performance?.now?.() ?? Date.now(), true);
      applyStageVars();
      cancelFrame(flashTimeoutHandle);
      flashTimeoutHandle = globalThis.setTimeout(() => {
        flashMode = false;
        refreshPresentation(globalThis.performance?.now?.() ?? Date.now(), true);
        applyStageVars();
      }, FLASH_DURATION_MS);
    };

    const step = (timestamp) => {
      loopActive = false;
      const now = Number.isFinite(timestamp) ? timestamp : Date.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      let needsAnotherFrame = false;

      if (pendingPointerMove && now >= nextPointerAt) {
        const delta = lastPoint
          ? {
              x: pendingPointerMove.point.x - lastPoint.x,
              y: pendingPointerMove.point.y - lastPoint.y,
            }
          : { x: 0, y: 0 };

        lastPoint = pendingPointerMove.point;
        currentSpeed = Math.hypot(delta.x, delta.y);
        chaos = applyPointerMove(chaos, {
          point: pendingPointerMove.point,
          delta,
          bounds: pendingPointerMove.bounds,
        });
        pendingPointerMove = null;
        nextPointerAt = now + POINTER_COOLDOWN_MS;
      } else if (pendingPointerMove) {
        needsAnotherFrame = true;
      }

      chaos = tickChaos(chaos, dt);
      currentSpeed = Math.max(0, currentSpeed - dt * 85);
      applyStageVars();
      refreshPresentation(now);

      if (pendingPointerMove || !isChaosSettled(chaos)) {
        needsAnotherFrame = true;
      }

      if (needsAnotherFrame) {
        scheduleStep();
      }
    };

    const flashInterval = globalThis.setInterval(() => {
      triggerFlash();
    }, FLASH_INTERVAL_MS);

    updateScrollState(true);
    applyStageVars();
    refreshPresentation(lastTime, true);
    globalThis.addEventListener("pointermove", handlePointerMove, { passive: true });
    globalThis.addEventListener("scroll", handleScroll, { passive: true });
    globalThis.addEventListener("pointerleave", resetPointer);
    globalThis.addEventListener("blur", resetPointer);

    return () => {
      cancelFrame(frameHandle);
      globalThis.clearInterval(flashInterval);
      globalThis.clearTimeout(flashTimeoutHandle);
      globalThis.removeEventListener("pointermove", handlePointerMove);
      globalThis.removeEventListener("scroll", handleScroll);
      globalThis.removeEventListener("pointerleave", resetPointer);
      globalThis.removeEventListener("blur", resetPointer);
    };
  });
</script>

<svelte:head>
  <title>{siteName}</title>
  <meta name="description" content={description} />
</svelte:head>

<div
  class="artwork"
  bind:this={stage}
  data-testid="chaos-stage"
  data-layout-mode={layoutMode.id}
  data-flash-mode={flashMode ? "on" : "off"}
>
  <div class="artwork__wash artwork__wash--a"></div>
  <div class="artwork__wash artwork__wash--b"></div>
  <div class="artwork__grain"></div>

  <header class="menubar" aria-hidden="true">
    <span>FILE</span>
    <span>EDIT</span>
    <span>VIEW</span>
    <span>CHAOS</span>
    <span>HELP?</span>
    <strong>{layoutMode.label}</strong>
  </header>

  <div class="flash-banner" aria-live="polite">{flashMessage}</div>

  <div class="echo-stack" aria-hidden="true">
    {#each wordmarkEchoes as echo, index (index)}
      <p class="echo-stack__word" style={`--echo:${index};`}>{echo}</p>
    {/each}
  </div>

  <aside class="status-strip">
    {#each statusReadouts as readout, index (`${readout}-${index}`)}
      <p>{readout}</p>
    {/each}
  </aside>

  <div class="wallpaper" aria-hidden="true">
    {#each wallpaperRows as row, index (index)}
      <p
        class="wallpaper__row"
        style={`--row:${index}; --direction:${index % 2 === 0 ? 1 : -1};`}
      >
        {row}
      </p>
    {/each}
  </div>

  <div class="marquees" aria-hidden="true">
    {#each marqueeBursts as burst, index (burst)}
      <div class="marquee" style={`--lane:${index};`}>
        <div class="marquee__track">
          <span>{burst}</span>
          <span>{burst}</span>
          <span>{burst}</span>
        </div>
      </div>
    {/each}
  </div>

  <div class="window-layer" aria-hidden="true">
    {#each fakeWindows as fakeWindow, index (fakeWindow.id)}
      <article class="window" style={`--window:${index};`}>
        <div class="window__titlebar">
          <strong>{fakeWindow.title}</strong>
          <span>[][][x]</span>
        </div>
        <div class="window__body">
          {#each fakeWindow.lines as line (`${fakeWindow.id}-${line}`)}
            <p>{line}</p>
          {/each}
        </div>
      </article>
    {/each}
  </div>

  <div class="floaters" aria-hidden="true">
    {#each floaters as floater (floater.id)}
      <figure
        class="floater"
        style={`--top:${floater.top}; --left:${floater.left}; --size:${floater.size}; --duration:${floater.duration}; --delay:${floater.delay}; --rotate:${floater.rotate};`}
      >
        <img class="floater__image" src={consumptionImage} alt="" />
      </figure>
    {/each}
  </div>

  <main class="dashboard">
    <section class="panel panel--hero">
      <p class="kicker">browser abuse engine / live palette vandalism / soft usability ban</p>
      <h1>{heroWordmark}</h1>
      <p class="lede">
        Every cursor tremor detonates the color system. The palette only settles after the
        pointer fully stops, which is the closest this artwork gets to mercy.
      </p>
      <p class="hero-corruption">{manifestoEcho}</p>
      <div class="cta-row">
        <button type="button">begin retinal taxation</button>
        <a href="#manifesto">skip directly into glare</a>
      </div>
    </section>

    <section class="panel panel--meter">
      <p class="label">Damage model</p>
      <p class="meter">tiny motion = buffered chromatic panic</p>
      <p>
        Tiny movements still scramble the surface, but the input is now lightly buffered so the
        site is obnoxious without burning cycles for no reason.
      </p>
      <p class="microcopy">scroll state: {scrollState.label}</p>
    </section>

    <section class="panel panel--manifesto" id="manifesto">
      <p class="label">Manifesto</p>
      <p>
        This is not a productivity interface. It is a brightly lit mistake in public, tuned to
        feel overcaffeinated, oversaturated, and structurally disrespectful to the concept of
        restraint.
      </p>
      <p class="manifesto-echo">{decoyHeading}</p>
    </section>

    <section class="panel panel--rituals">
      <p class="label">Suggested rituals</p>
      <ul>
        {#each rituals as ritual (ritual)}
          <li>{ritual}</li>
        {/each}
      </ul>
    </section>

    <section class="panel panel--shouts">
      <p class="label">Ceremonial buttons</p>
      <div class="shout-grid">
        {#each warnings as warning (warning)}
          <button type="button" class="shout">{warning}</button>
        {/each}
      </div>
    </section>

    <section class="panel panel--relic">
      <p class="label">Core relic</p>
      <div class="relic">
        <img src={consumptionImage} alt="" />
        <p>
          `consumption.png` is deliberately loose in the composition and refuses to stay in one
          place.
        </p>
      </div>
    </section>

    <section class="panel panel--badges">
      <p class="label">Credentials</p>
      <div class="badge-cloud">
        {#each badges as badge (badge)}
          <span>{badge}</span>
        {/each}
      </div>
    </section>

    <section class="panel panel--receipt">
      <p class="label">Charge summary</p>
      <ul class="receipt">
        {#each receiptItems as item (item)}
          <li>{item}</li>
        {/each}
      </ul>
    </section>

    <section class="panel panel--decoy">
      <p class="label">Counterfeit comfort layer</p>
      <p>
        This fake sub-interface pretends to be calmer than the rest of the page while quietly
        inheriting all the same bad decisions.
      </p>
      <div class="decoy-controls">
        <button type="button">almost stable</button>
        <button type="button">not actually helpful</button>
        <a href="#top">misleading exit</a>
      </div>
    </section>
  </main>
</div>
