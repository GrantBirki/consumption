<script>
  const siteName = "consumption.horse";
  const description = "A dead simple Svelte hello world deployed with GitHub Pages.";
</script>

<svelte:head>
  <title>{siteName}</title>
  <meta name="description" content={description} />
</svelte:head>

<main class="shell">
  <p class="eyebrow">Svelte + GitHub Pages</p>
  <h1>Hello world.</h1>
  <p class="lede">{description}</p>
  <p class="meta">CI, Pages deploys, and the `script/*` entrypoints are all wired up.</p>
</main>
