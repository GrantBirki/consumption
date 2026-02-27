<script>
  import { onMount } from "svelte";

  import consumptionImage from "../consumption.png";
  import {
    applyPointerMove,
    buildChaosVars,
    createChaosState,
    tickChaos,
  } from "./lib/chaos.js";

  const siteName = "consumption.horse";
  const description =
    "A maximalist cursor-reactive web artwork that scrambles the palette with every movement.";
  const wallpaperRows = Array.from({ length: 7 }, () => "C O N S U M P T I O N");
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
    { id: "west", top: "61%", left: "5%", size: "10rem", duration: "14s", delay: "-4s", rotate: "-26deg" },
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

  let stage;

  onMount(() => {
    let chaos = createChaosState();
    let lastPoint = null;
    let frameHandle = 0;
    let lastTime = globalThis.performance?.now?.() ?? Date.now();

    const requestFrame =
      globalThis.requestAnimationFrame ??
      ((callback) => globalThis.setTimeout(() => callback(Date.now()), 16));
    const cancelFrame = globalThis.cancelAnimationFrame ?? globalThis.clearTimeout;

    const applyVars = () => {
      if (!stage) return;

      for (const [key, value] of Object.entries(buildChaosVars(chaos))) {
        stage.style.setProperty(key, value);
      }
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

    const handlePointerMove = (event) => {
      const bounds = getBounds();
      const point = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
      const delta = lastPoint
        ? { x: point.x - lastPoint.x, y: point.y - lastPoint.y }
        : { x: 0, y: 0 };

      lastPoint = point;
      chaos = applyPointerMove(chaos, { point, delta, bounds });
      applyVars();
    };

    const resetPointer = () => {
      lastPoint = null;
    };

    const step = (timestamp) => {
      const now = Number.isFinite(timestamp) ? timestamp : Date.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      chaos = tickChaos(chaos, dt);
      applyVars();
      frameHandle = requestFrame(step);
    };

    applyVars();
    globalThis.addEventListener("pointermove", handlePointerMove, { passive: true });
    globalThis.addEventListener("pointerleave", resetPointer);
    globalThis.addEventListener("blur", resetPointer);
    frameHandle = requestFrame(step);

    return () => {
      cancelFrame(frameHandle);
      globalThis.removeEventListener("pointermove", handlePointerMove);
      globalThis.removeEventListener("pointerleave", resetPointer);
      globalThis.removeEventListener("blur", resetPointer);
    };
  });
</script>

<svelte:head>
  <title>{siteName}</title>
  <meta name="description" content={description} />
</svelte:head>

<div class="artwork" bind:this={stage} data-testid="chaos-stage">
  <div class="artwork__wash artwork__wash--a"></div>
  <div class="artwork__wash artwork__wash--b"></div>
  <div class="artwork__grain"></div>

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
      <h1>consumption.horse</h1>
      <p class="lede">
        Every cursor tremor detonates the color system. The palette only settles after the
        pointer fully stops, which is the closest this artwork gets to mercy.
      </p>
      <div class="cta-row">
        <button type="button">begin retinal taxation</button>
        <a href="#manifesto">skip directly into glare</a>
      </div>
    </section>

    <section class="panel panel--meter">
      <p class="label">Damage model</p>
      <p class="meter">1 pixel = full chromatic panic</p>
      <p>
        Tiny movements snap the entire surface into a new hue stack. Stillness is the only
        de-escalation path.
      </p>
    </section>

    <section class="panel panel--manifesto" id="manifesto">
      <p class="label">Manifesto</p>
      <p>
        This is not a productivity interface. It is a brightly lit mistake in public, tuned to
        feel overcaffeinated, oversaturated, and structurally disrespectful to the concept of
        restraint.
      </p>
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
  </main>
</div>
