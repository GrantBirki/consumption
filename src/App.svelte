<script>
  import { onMount, tick } from "svelte";

  import consumptionImage from "./assets/consumption.png";
  import windowsBsodImage from "./assets/windows_BSOD.png";
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
  import { getRuntimeTuning } from "./lib/perf.js";

  const siteName = "consumption";
  const heroWordmark = "c o n s u m p t i o n";
  const description =
    "A maximalist cursor-reactive web artwork that scrambles the palette with every movement.";
  const baseManifesto = "restraint unavailable / taste engine offline";
  const baseDecoyHeading = "welcome to the counterfeit comfort layer";
  const flashEventLabel = "eyeball downgrade event";
  const flashIdleLabel = "chromatic debt warming";
  const initialReadoutMetrics = Object.freeze({
    energy: 0.14,
    scatter: 14,
    wobble: 5,
    speed: 0,
    flash: false,
    scrollRatio: 0,
    phase: 0,
  });
  const STICKY_HEAD_LIMIT = 10;
  const BSOD_DURATION_MS = 8000;
  const STICKY_HEAD_BASE_SIZE_REM = 8;
  const STICKY_HEAD_SIZE_STEP_REM = 4;
  const wallpaperRows = Array.from({ length: 7 }, () => heroWordmark.toUpperCase());
  const marqueeBursts = [
    "retina tax in progress / chromatic debt increasing / cursor panic live",
    "consumption.png escaped containment / hover damage accepted / saturation emergency",
    "all colors are currently arguing / elegance revoked / restraint unavailable",
  ];
  const floaters = [
    { id: "north", top: "3%", left: "3%", size: "13rem", duration: "15s", delay: "-2s", rotate: "-18deg" },
    { id: "east", top: "12%", left: "77%", size: "11rem", duration: "18s", delay: "-7s", rotate: "14deg" },
    { id: "center", top: "38%", left: "15%", size: "15rem", duration: "20s", delay: "-5s", rotate: "-8deg" },
    { id: "south", top: "68%", left: "72%", size: "12rem", duration: "17s", delay: "-9s", rotate: "24deg" },
    { id: "orbit", top: "28%", left: "55%", size: "16rem", duration: "23s", delay: "-12s", rotate: "9deg" },
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
  ];
  const receiptItems = [
    "1x broken hierarchy",
    "2x fraudulent buttons",
    "4x hostile panels",
    "8x chromatic overreach",
    "16x unnecessary glow",
  ];
  const createStickyHead = (index) => {
    const angle = ((index + 1) * 137.508 * Math.PI) / 180;
    const radius = 24 + index * 34;
    const drift = 18 + index * 7;

    return {
      id: `sticky-head-${index + 1}`,
      clickIndex: index + 1,
      sizeRem: STICKY_HEAD_BASE_SIZE_REM + index * STICKY_HEAD_SIZE_STEP_REM,
      offsetX: Math.round(Math.cos(angle) * radius),
      offsetY: Math.round(Math.sin(angle) * radius),
      driftX: Math.round(Math.cos(angle * 1.8) * drift),
      driftY: Math.round(Math.sin(angle * 2.1) * drift),
      tiltDeg: Math.round((Math.sin(angle) + Math.cos(angle * 1.4)) * 14),
      orbitSeconds: (8 + index * 0.7).toFixed(2),
      spinSeconds: (5.5 + index * 0.6).toFixed(2),
    };
  };

  let stage;
  let layoutStep = 0;
  let layoutMode = getLayoutMode(0);
  let flashMode = false;
  let flashMessage = corruptPhrase(flashEventLabel, 0.5, 0);
  let scrollState = buildScrollState(0, 1, 1);
  let statusReadouts = buildStatusReadouts({ ...initialReadoutMetrics });
  let wordmarkEchoes = buildWordmarkEchoes(heroWordmark, 0.18, 0);
  let manifestoEcho = corruptPhrase(baseManifesto, 0.3, 0);
  let decoyHeading = corruptPhrase(baseDecoyHeading, 0.55, 1);
  let stickyHeads = [];
  let clickCount = 0;
  let bsodActive = false;
  let pointerActive = false;

  onMount(() => {
    const tuning = getRuntimeTuning();
    const now = () => globalThis.performance?.now?.() ?? Date.now();

    let chaos = createChaosState();
    let lastPoint = null;
    let pendingPointerMove = null;
    let frameHandle = 0;
    let lastTime = globalThis.performance?.now?.() ?? Date.now();
    let lastVisualUpdateAt = lastTime;
    let loopActive = false;
    let nextPointerAt = 0;
    let currentSpeed = 0;
    let nextPresentationAt = 0;
    let flashTimeoutHandle = 0;
    let lastPointerActivityAt = -Infinity;
    let nextLayoutShiftAt = Infinity;
    let scrollFrameHandle = 0;
    let scrollQueued = false;
    let bsodTimeoutHandle = 0;
    let pointerActiveTimeoutHandle = 0;

    const requestFrame =
      globalThis.requestAnimationFrame ??
      ((callback) => globalThis.setTimeout(() => callback(Date.now()), 16));
    const cancelFrame = globalThis.cancelAnimationFrame ?? globalThis.clearTimeout;
    const safelyScrollToTop = () => {
      const userAgent = globalThis.navigator?.userAgent ?? "";
      if (userAgent.toLowerCase().includes("jsdom")) return;

      try {
        if (typeof globalThis.scrollTo === "function") {
          globalThis.scrollTo(0, 0);
        }
      } catch {
        // Swallow unsupported scroll APIs in constrained environments.
      }
    };
    const resetExperienceState = (timestamp = now()) => {
      chaos = createChaosState();
      lastPoint = null;
      pendingPointerMove = null;
      nextPointerAt = 0;
      currentSpeed = 0;
      nextPresentationAt = 0;
      flashMode = false;
      layoutStep = 0;
      layoutMode = getLayoutMode(0);
      flashMessage = corruptPhrase(flashEventLabel, 0.5, 0);
      scrollState = buildScrollState(0, 1, 1);
      statusReadouts = buildStatusReadouts({ ...initialReadoutMetrics });
      wordmarkEchoes = buildWordmarkEchoes(heroWordmark, 0.18, 0);
      manifestoEcho = corruptPhrase(baseManifesto, 0.3, 0);
      decoyHeading = corruptPhrase(baseDecoyHeading, 0.55, 1);
      stickyHeads = [];
      clickCount = 0;
      pointerActive = false;
      lastPointerActivityAt = -Infinity;
      nextLayoutShiftAt = Infinity;
      scrollQueued = false;
      lastTime = timestamp;
      lastVisualUpdateAt = timestamp;
    };
    const restoreFromBsod = async () => {
      globalThis.clearTimeout(bsodTimeoutHandle);
      bsodTimeoutHandle = 0;
      bsodActive = false;
      resetExperienceState(now());
      safelyScrollToTop();
      await tick();
      updateScrollState(true);
      applyStageVars();
      refreshPresentation(now(), true);
    };
    const triggerBsod = () => {
      if (bsodActive) return;

      bsodActive = true;
      stickyHeads = [];
      clickCount = 0;
      pointerActive = false;
      flashMode = false;
      pendingPointerMove = null;
      loopActive = false;
      scrollQueued = false;
      cancelFrame(frameHandle);
      frameHandle = 0;
      cancelFrame(scrollFrameHandle);
      scrollFrameHandle = 0;
      globalThis.clearTimeout(flashTimeoutHandle);
      globalThis.clearTimeout(bsodTimeoutHandle);
      globalThis.clearTimeout(pointerActiveTimeoutHandle);
      bsodTimeoutHandle = globalThis.setTimeout(() => {
        void restoreFromBsod();
      }, BSOD_DURATION_MS);
    };

    const cycleLayoutMode = (now) => {
      if (bsodActive) return;

      layoutStep += 1;
      layoutMode = getLayoutMode(layoutStep);
      nextLayoutShiftAt = now + tuning.layoutIntervalMs;
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
      frameHandle = requestFrame(step);
    };

    const refreshPresentation = (now, force = false) => {
      if (bsodActive) return;
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
        flashMode ? flashEventLabel : flashIdleLabel,
        Math.min(1, intensity + (flashMode ? 0.3 : 0)),
        layoutStep + 5
      );
      nextPresentationAt = now + tuning.presentationCooldownMs;
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
      if (bsodActive) return;

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
      if (bsodActive) return;
      if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) {
        return;
      }

      const now = globalThis.performance?.now?.() ?? Date.now();
      pointerActive = true;
      globalThis.clearTimeout(pointerActiveTimeoutHandle);
      pointerActiveTimeoutHandle = globalThis.setTimeout(() => {
        pointerActive = false;
        scheduleStep();
      }, tuning.pointerActiveWindowMs);
      const bounds = getBounds();
      pendingPointerMove = {
        point: {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        },
        bounds,
      };

      if (now - lastPointerActivityAt > tuning.layoutIdleResetMs) {
        nextLayoutShiftAt = now + tuning.layoutIntervalMs;
      } else if (now >= nextLayoutShiftAt) {
        cycleLayoutMode(now);
      }

      lastPointerActivityAt = now;
      scheduleStep();
    };

    const handleScroll = () => {
      if (bsodActive) return;
      if (scrollQueued) return;

      scrollQueued = true;
      scrollFrameHandle = requestFrame(() => {
        scrollQueued = false;
        scrollFrameHandle = 0;
        updateScrollState(true);
      });
    };

    const resetPointer = () => {
      if (bsodActive) return;
      pointerActive = false;
      globalThis.clearTimeout(pointerActiveTimeoutHandle);
      lastPoint = null;
      pendingPointerMove = null;
      currentSpeed = 0;
      refreshPresentation(now(), true);
    };
    const handleClick = () => {
      if (bsodActive) return;

      const nextCount = clickCount + 1;
      clickCount = nextCount;
      stickyHeads = [...stickyHeads, createStickyHead(nextCount - 1)];

      if (nextCount >= STICKY_HEAD_LIMIT) {
        triggerBsod();
      }
    };
    const handleKeydown = () => {
      if (!bsodActive) return;

      void restoreFromBsod();
    };

    const triggerFlash = () => {
      if (bsodActive) return;
      flashMode = true;
      refreshPresentation(now(), true);
      applyStageVars();
      cancelFrame(flashTimeoutHandle);
      flashTimeoutHandle = globalThis.setTimeout(() => {
        if (bsodActive) return;
        flashMode = false;
        refreshPresentation(now(), true);
        applyStageVars();
      }, tuning.flashDurationMs);
    };

    const step = (timestamp) => {
      loopActive = false;
      if (bsodActive) return;

      const now = Number.isFinite(timestamp) ? timestamp : Date.now();
      if (tuning.minFrameIntervalMs > 0 && now - lastVisualUpdateAt < tuning.minFrameIntervalMs) {
        if (pendingPointerMove || !isChaosSettled(chaos)) {
          scheduleStep();
        }
        return;
      }

      lastVisualUpdateAt = now;
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
        nextPointerAt = now + tuning.pointerCooldownMs;
      } else if (pendingPointerMove) {
        needsAnotherFrame = true;
      }

      if (!pointerActive) {
        chaos = tickChaos(chaos, dt);
        currentSpeed = Math.max(0, currentSpeed - dt * 85);
      }
      applyStageVars();
      refreshPresentation(now);

      if (pendingPointerMove || (!pointerActive && !isChaosSettled(chaos))) {
        needsAnotherFrame = true;
      }

      if (needsAnotherFrame) {
        scheduleStep();
      }
    };

    const flashInterval = globalThis.setInterval(() => {
      triggerFlash();
    }, tuning.flashIntervalMs);

    updateScrollState(true);
    applyStageVars();
    refreshPresentation(lastTime, true);
    globalThis.addEventListener("pointermove", handlePointerMove, { passive: true });
    globalThis.addEventListener("scroll", handleScroll, { passive: true });
    globalThis.addEventListener("click", handleClick, { passive: true });
    globalThis.addEventListener("keydown", handleKeydown);
    globalThis.addEventListener("pointerleave", resetPointer);
    globalThis.addEventListener("blur", resetPointer);

    return () => {
      cancelFrame(frameHandle);
      cancelFrame(scrollFrameHandle);
      globalThis.clearInterval(flashInterval);
      globalThis.clearTimeout(flashTimeoutHandle);
      globalThis.clearTimeout(bsodTimeoutHandle);
      globalThis.clearTimeout(pointerActiveTimeoutHandle);
      globalThis.removeEventListener("pointermove", handlePointerMove);
      globalThis.removeEventListener("scroll", handleScroll);
      globalThis.removeEventListener("click", handleClick);
      globalThis.removeEventListener("keydown", handleKeydown);
      globalThis.removeEventListener("pointerleave", resetPointer);
      globalThis.removeEventListener("blur", resetPointer);
    };
  });
</script>

<svelte:head>
  <title>{siteName}</title>
  <meta name="description" content={description} />
</svelte:head>

{#if bsodActive}
  <div class="bsod-screen" data-testid="bsod-screen">
    <img src={windowsBsodImage} alt="Blue screen crash simulation" />
  </div>
{:else}
  <div
    class="artwork"
    bind:this={stage}
    data-testid="chaos-stage"
    data-layout-mode={layoutMode.id}
    data-flash-mode={flashMode ? "on" : "off"}
    data-performance-mode="potato"
    data-pointer-active={pointerActive ? "on" : "off"}
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

    <div class="sticky-head-layer" aria-hidden="true" data-testid="sticky-head-layer">
      {#each stickyHeads as head (head.id)}
        <figure
          class="sticky-head"
          data-testid="sticky-head"
          data-size-rem={head.sizeRem}
          style={`--size:${head.sizeRem}rem; --offset-x:${head.offsetX}px; --offset-y:${head.offsetY}px; --drift-x:${head.driftX}px; --drift-y:${head.driftY}px; --tilt:${head.tiltDeg}deg; --orbit-duration:${head.orbitSeconds}s; --spin-duration:${head.spinSeconds}s;`}
        >
          <img class="sticky-head__image" src={consumptionImage} alt="" />
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
        T̶̛̝͎̺̂͝ḩ̵̰̠͙̤̘̠̦̦̙͖͓͚̑̇̓͐͆̿̍́͛̈͊̊̂̍̂i̶͇̟̜͉̩̠̟̫̗̫͓͔̦͋̉̈̒̄̈̀̓̀̇͌̇̕͝s̶̬̬͎̦̼̥̿̌̌̏̽̏͂̅̈́̏̓͠͝ ̷̝͗i̵̺̝̖͚̜͕̠͔̖̓͂͆̋͋͒͗̇̈͌́͋͐͘s̶̻̭̭͔̯̼̅͛͆̽̓̃̌̇̂̂̕̕͝ͅ ̸̨̡̦̪̯̃̾͑̓̅̆̉̓͆͗̾̇̋̉n̴̝͈͖̭̼̰̮̫̣̠͖͔̖̂̀̆̽̅̀̈̽̐͝o̴̡̨̗̝͚̪̦̙̼̪̗̘̒͐͒̈́̓̚ͅt̷̙͚̠̦͕̦̝̞̀͌̋̐̾́̈̒̊͗͆̄͆̚͝ ̸̧̧̡̨̘̝̲̞͈̟͓͍͎̟͙͋̌̃̈́̇̊͝ą̴̧̧̧̛̲͍̹̳̳̭̥̥͉͕͛̆̏̍̿͋͆̎̿̆̏͠ͅ ̶̩̱̻̭̥̝̼̰̗͍̫̊̓̾͋̃̕p̵͚͈̘̺̭̑́̑̋̀̓̈́͘̕͝͝r̴̛͇̜͔͍͇̠̫̽̇̾́̔̔̉͊̄̓͛͛ŏ̶̖̪̀̎̒̂̈́̈́̇̌̅̑̾͐̓̃ḑ̸̛̤̟͔̼̹̋̓̊̐̀̓̀̈́̆̃ͅṵ̸̹͚̠͎͚͙̟̯͖̦̜͌͑̊́̈́̔̚͠c̸̢̛̺͚̱͈̑͌̉̀͠ṯ̴̏̓͆͗̚į̵̘̲̮̋͛͐̿̄̒̈́̎͠v̷͕̠̞̤͕̥̳̣̹̟͈͐͜ǐ̴̛͓͈̦̥̮͍̪̝̈͆͋t̶̨̡̠̞̺̘̲̪̀y̵̨̗̘̹͍̦̞̩͓͚̎̓̃̎̔̑̉̾͌̈́̽̚͘͜͝ ̶̨̪̠̫̫̻̗͚̹͚̝̮̞̾̾́̍͛͊̂͐̈̊͝ͅī̵̪̫̝͊̅̍̇̏̌́̅̚͘͝ͅn̷̰̻̤͚͚̎̉͗͑̿̓̐͛̀̈̑͐̿͋̕ṫ̵̢͓̹͌͘e̵̲̹̞̳͔̣͓̠͕̫̠͖͆͌̇͊̇̒̊̅̎̀͜͝͝r̵̰͙͚̹̯̹͚͇̟̗̼̦̬̩͐͗͆̄́̿̊̒͋̐̒̈̚f̴̡͓̯̱̖͇͉̯̘̥̻̦͓͇̍͌̉͐̅͌͂͌̽͘̚̕͝͝ͅa̵͚̺̯̼̤͕̠̤͉͕̠͒̋̀̏̾͑̑̈́̕͘͘͝c̷͔̤̭̈͝ë̵̡̡̧̮͚̮̠̲͎͇̘̠́́͛̊̈̉̉͌͒̈́.̴̡̨̧̡̥͕̭͔̲̮̣́̈́́̌̀̉͗̈́͊̌͜͝ ̶̣͎̼̭͉̹̻̰̔̒̃̔̾͌͝͝͠I̸̻̱̜̳͎̰̓̆̓̄̾͘͝͝ẗ̴̡̘̝̼̱̺̥͍̞̣̟̜̱͓́̃͝ͅ ̵̨̗̲̖͋̇̀͌̂̅́̍͆͋͆͝͠i̷̧̧̭̙̱̠̤͈̮̼͕̐̈š̷̟̘̲̹͇͉̤̖̼̳͜͠ ̵̡̉͊̃̓̏̍̅ą̴̨̨̛͔̟̰̩̹͎̣̲̹̯̿͋͐̐̔́̅͗̕ͅ ̵̱̘̪̈́͗̈́̔̈̕͝b̸̢̙̤̩̞̣̥̺̠͈̟͔̠͓̔͘͝r̸̢̧͎͙̣͕͈͉͎̮̱̠̗͕̹̀̀ī̷̱͓̋̅̎̈͒̐̿͝͠ģ̷̨̳͙͔͔̣͎̞͖̼̱̳̠̇̾̈͂̓͛̌̿̚͜͝ẖ̷̙́̆͂̉̕t̸͔̣̳̻́͌͌͗̃ĺ̴̜̰̖̹͚̖͙͔̖̲͚̗̌́̈́̊̅̓̋͋̍̈́̈́̚͠y̶̛̛͓̣̤͓̐́̈́͗͌̈́̾͐͒̈́͐͝ ̸̧͔̮̞̬͓̪͈̰͕̭̯̿̆̍̓̈́̾́̏́͜l̸͚̰̘̱̳͈̬̖̻͖͒̄́̄́̍̕̚͘͜͝ȋ̸̢̪͖̤̞̮̖̱̙̺̱̑̈́͋t̴͇̥̘̪͕̰͔̅̈́͂͌͆̈̓͗̋̑͑͑̍͘͜ ̶̨̪̱̣̯͔̼̻͖̇͋͋̀̽̀̂̇̀̌͗̚̚͠m̴̡̧͙͔͍͎͉͈͔̥̟̘̆̋͜͜į̷̡̳͍͚̠͍̽͑̋̓̉̅̿́̐̏̈̑̽̔̐ͅş̷̡̣͖͔͔͖̞̥̥̹̗͔̾̑́͂̈́̒͝ͅṯ̸̨̨̡͕͕̣̤̬͚̼̬̅̆̿͊ͅa̶̗̩̪̜̤̤̘͈͉̟͊͋͂̎͑̑̍̌̈̍͌͝͝k̸̠̙̻͇͎̀̄̔̈́͌̂̂̇̄͊̐̚͘̚͠ͅe̶̤̫̥͌͋̏͝ ̸̠̳̼͕͛͒̚ḯ̶̧̧̛̻̪͇͎̟̟͉̦͓̹̜̭͊͒́͒͌̈n̸̲̯͂͗͐͘ ̶̳̻͇̦̲̀̐͛̕p̵̨̢̨̛̞͚̪̖̻̗̫̼̟̥̎̏͋̑̕̕͜ų̴͍̙̟̻͉̭̠̤́͗̏͐͛̎̾̌͌̽̕̕͝b̶̜̫̺̰̪̭̭̬̩͈́͐͝ͅl̸̨̛͖̠̲̾̒͐̆̽̅̕͠ḯ̷̲̠̙̪̬͎̓͆͌̇̏͗́̒͛̅̚͘͝c̵̛͔̠̓͋̀̽̽̇̍̄̋̈̏̃̓̈,̴̙̝͍̲͗̽ ̸̢̡̫̰̝̟̦̙͈̒ṭ̴̡̛̟̦̺̙͕̙͔̘͔̋̋̔́̀̌̽̈́͜͜ù̷̧͙̥̹͙̳̻̙̟̿̔̃̈̚n̸̡̥̹̫̭̖̩̱̗̝̞̦̓̀̀̐̈́͘͜è̸̢̳͉̩̭̹͙̥͕̘̟̹́̀͜ḑ̷̪͙̺̪̮͉͖͍̗̯͙̜̝̋̀̐̔̽̓̄̓͐͂͝ ̵͚̻̘̟̬̼̫̝̙̳̋́̔̈́͌͊̒͛̿t̶̩̱̤̀͛͋̐͜ͅo̶͓͈͍̯̺̮̯͑͗̒͋̆̋͌̇
̵̘̱̪̫͂̾̽̌̍̓̋͠ ̸̡̛̭͓̘͚̩͕͈̞̼͌͗̀͋͊͠͝͝ ̴̮̮̞̒͂̕ ̴̨̡͇̙̰̪̯̮͚̳̜͈͙̲̃̀͊̈́̏̓̒̏͌̏͂ ̵̛̗̼̠̾͑̋̽̔̀̿̿̃̃͋͝ ̸̢͘ ̴̝̥͝ ̷͚͙̭̹̲̥̼͇͔̦̳̼͔̗̪̋̋̓̊̊̈̏̾͗̆͋̕ ̷̺̲̓̍̊͆͑ͅf̶̡͍̰̮̩̻̳̯̲̙̈́ͅͅe̷̡̡͔̖͕̮̝̎͑e̷̦̞͉̝͗̽̎́͊ľ̷̳̈́́̈̏̀̄͒̈́̑͗͝͠ ̴̡̧̤̝̭̤̰͙̺͉͇͙̠̔̌ơ̵̢̭͖̩̳̳͕̮̈́̆͗̀̃͝v̴̡͖̫͔̰̜̥̳̫̽͂͊́͘ͅe̷̙̘͍̲̻̫̞̟̤̿̕r̸̻̠͕̬̖͉͖̼̠̂͗͜c̶̝̪͓̞̦̬̼̺̟̩̟̘̠͌̂̾̀̄̅͘̕͘͜ä̴̢̢̜̭̼̯̟͈̗̖͉̩́͂̅̈́́̓͆ͅf̴̡̦̘̥͖̦̫̫̣̔̎́ͅf̶͚̖̺̹̱͚̙̞̂̂́͝ȩ̷̛̭͎̤̬̳̼͖͍̦̳͈̗̅̈́̐͆̋̋̃̽́̕ĭ̴̧̧̡̖͓̝̰̞̱̗̮̼̜͎͓̏̔͂̔̌̈́̂͝ṉ̸̨̧̩̫̗̋̊͜a̶̢̺̯̪̯͖͎̞̝͋̏̓̀͐̏̈͝ṯ̶̡̙͗̂̋̓̍̐ȅ̵̼̼̱̗̅̈̐͒̍̈́͒̌́͘d̸̰͚̖̜͉̑̊͂̐͗́̓̏,̴̛̊̀̋̃͊̈̍͜ ̷̡̛͖̪̟̭̦̥͓̫̥̽̾̐͋͂̎̈́̍͝͝͝ͅo̵̗̻̥͔̓̓̓̎̐̌͗̈́̀͋̊͋̚̚͠v̷̢̨͈̪͍͍̺̬͛͒̑̆è̴̛̼̜̦̤͍̬̻̦̝͔̳ͅŗ̸̨͙̙̼̆͑̿͋ͅṣ̵̙͚̺̊͌̋͑̈̈́̃͌͗́̾͊͑̕͠â̵͔̳̓̾̊͗̃̊̊͐́͜͝ţ̷̎͌̀̃͒̿̄͋̂̈̆̈̕͝ṳ̸̡̧̣͈̻̺̼̭̦̭͚̖̎͆̀̂̄̎̊̓͋̀͘͘͜͜͠͝͝r̶̨̛̥̗̮̫̭̗̩͚̩̃̈́́̿͜͝å̷̧̛̗͈͎̖̜̹͇̣͆͒͂͒̄̀̄̈̚͘t̴͙̠̏̍̈̈̏̃̈́̿̇͋̑̚è̶̝̈́̈͋̀̊̈̈̉̀͋͆̉̕d̷̡̨̛͚̖̫̠̟͉̖̥̮̅͐͂̐̈́̅̈́͗̀̈̂͐̚͜,̸̢͔̭̼͍̼̳̜̒̄̀̊̉͆̾̈͗̉̚ ̵̬͔̪͛̃̍̆̆̈̍̈́̀̔͘a̸̬͔̞̯͍̤̜̻͍̱̖͔̓̈́͐̉͒̍̅̇̾̇̎̆́̋n̸̼͔̝͖̟̣̆͂̾̀͌͂͑̅͝ḑ̴̡̨̞̤͓̳͉͎̎́̿̓̅̈́ ̷̩̤̘̹̗̜͇͓̫̤͓̰͙͚̰̐̒̽s̷̱͖̻̜͍̪͚̤̻͕͊̔̓͒̓́͂̈́͜ť̸̡̧͈͉̣̞̳̻̣̖̖͍̉́̔̅̂͘͝r̶̢̧͈̜͖͖̠̣̭̼͈͈͒̓̿͊͛̏͛̀̇̑̆̍̇͝û̷̡̡͕̺̃ç̶͖̬͍̬̔t̵̗͌̎͂͌̓͋̈́̋͛̓̿̕͝u̴̖̳̮͒̏͐̀̂̂̓͗́́̀̏̂r̷̛̮̯̜̋́̇̈̊̏̎̒͆͠a̵̛͍͈̗̘̺̲͔̜̤̤̭̤͕̹̾̽͂̅͐̍̔̈̆̏̕l̴̨̢̛̳͍͕̦̣͔̯̻̫̀̍͆̍͐̑́͋̂̄̕̚̚ͅḷ̷̛̲̪̩̜̭͕̫̾͆͆́͌̈̓̈̕̚̚͘͜͝y̸̥̝̣͙̱̏̾͜ͅ ̵̪̬̜̯͉̼̪̽̃̉̈́̈͂̔̆́̀͘d̴̛̺͈͔͈̥͙̬͉͙̠̮̔͂̅́̈́̒̈́̊̊́i̵̛̛͉͎̔͂̎̄̌͛̚̕s̶͕̺͉͖̪̳̀̈͜͜r̴̢̼͎̲̹̼̗̞͙̮̫͙̩̂͜ȩ̸̨̢̟͎̜͈̦̭͉͒̒͝s̷͕̉̿̈́̀̐̔ṕ̶͉̈́̍͗͛͋͛̿͜͝e̸̹̲̹͐̈́͋c̵̢͕̘̲̦̻̯̞͙̫͙̟͖͑̃̉̂̔̂͘͘̕͝t̶̤̱̻͙̫̺̬̦͕̜̲͔̲̩̂̀̈͆̈͂̌͜f̵̢̧̙͙̦̹̦͍̰̖͇̑̒̋̂̾̋̿̈́̒u̸̧̪̝͓̭̥̓̇̐̚l̷̹̑̏̉̋͑̆̚ ̵̧̭̘̻̹̺̦̬̗̆̏͆̇̋ţ̸̗̖͚̯̜̼͙͚̺̙̐̐͛̾̕̚o̶̡̜̲̟̼̻̩̞̻̮͖̼͌͂̎̃̅̃͑͠͠͝ ̵͖̼͖̳̱͚̖̖̹̗͚̳̈́ţ̷͉̲̼̤̬̝̦͇͈͎̯̹̩̙̃̑ḩ̸̢̛͖̦̥̯͉̱͚̺̝̜̀̽̈́̀͝ê̷͙͖̜̊́ ̸̬͉̩̘͊̔̂͌͐̇̎́̅̕̚̕͝͠ç̴̝͔̗̪̞̿ͅǒ̷̩̆̌̏̊̃͗̆̕ṋ̸̨̦͙̝͙͇̼̝̠̝͎́̌͌͑̏̅̔͂̓̑̓ͅc̴̛̣͙̜͇̍́è̶̪̘̆͆͌̔̌p̶͙͙̺̳̺̠̱̆͗͒̆̋͊́̂̍t̸̻̱͕̟̣̠̲̱̑̿̽͛́͑̆̈́ ̷̨̨̥̥̱̹̣̲̹̀̿͌̓̎̿͊̚o̶͇͕̲̪̗͗̄͒̏́͒f̵̨̡̺̯̣͚͖̼̦̯̬͈͎̑͆̑̉
̴̧͇͚̭͍͕͔̪͎͂͑͑͒̓̆̓ ̵̨̞̳̻̺̱̝̅̓͛̈́̓̓̄̈́ ̶̻̩͚͎̠͐͝ ̸̧̻͖͇̗̖̮͊́̏̊̅̓̿̓̓̌̃̚ ̵̤̭̬̙̘͈̄̅̑ ̸̞̠̘̯̻̞̫͖̝̭̗̣́͊͗̾͗͗̒̒̿̏ ̶̨̯̗̳̬̣͖̙͓̪̟̘̮͉̔̔͜͝ ̶̢̛̛͇͓̞̼̳̪͓͔̩̠̫̗̪́́̎͂͌̋͂̓̅̂̓̔̒ ̵̡̥͙͔̠͔̻͕͙͍͕̖͚̟͂͜r̶̡̞̬̰̰̫̦͚̫̀̋͆̆͛̈́́̐e̴̬̤̝͚̳̪͙̖̋̀̂̕͝s̵̨̢̛̞̬̯̯̞̫̼͛̈́̔t̵̗͈͙̗͔̮̭̣͠r̵̟̟̯͍̭͑́͂̍̀̚͝ȧ̶̮̆̒̓̌̾̎̇͂̈́̍͊̕͝ḭ̷̞͂̌͗́̊̀̑̆͛̕ͅn̶̹̭͙͓̜̖̑͒͊̓͐͜͝͝ţ̶̠̗̝̥̩͉̫͍̺̰̹̰͙̀̉̓̈́̽̌̋͆̏̋̊̋̏̕̕.̸̛̰͙͈̪́̈́͗̈͊̊̽ͅ
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
{/if}
