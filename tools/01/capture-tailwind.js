// Regenerates the utility sheet in projects/01/index.html (<style id="week1-utilities">).
//
// The recovered game was styled by the Tailwind Play CDN at run time. The page now
// carries, inline, the CSS that Tailwind CSS v3.4.17 (MIT License, Tailwind Labs)
// generates for exactly the class names the page uses, so it renders the same with no
// remote script. To regenerate it after changing class names:
//
//   1. Make a temporary copy of projects/01/index.html. In the copy, replace the whole
//      <style id="week1-utilities">…</style> element with
//        <script src="https://cdn.tailwindcss.com/3.4.17"></script>
//   2. Serve the copy from any local static server and open it in a browser.
//   3. In the devtools console, paste this file, then run:  copy(await week1CaptureTailwind())
//   4. Replace the body of <style id="week1-utilities"> in the real page with the
//      clipboard contents, keeping the licence comment above it.
//   5. Run  node tools/01/check-page.mjs  (it fails if any class has no rule).
//
// It collects every class name written in the page source, including those that only
// appear in script strings (className = "…", class="…" inside templates, classList
// calls), puts them all on one hidden element so the Play CDN generates their rules,
// and returns the stylesheet the CDN injected.
(function () {
  window.week1ClassTokens = function (source) {
    const tokens = new Set();
    for (const m of source.matchAll(/\bclass(?:Name)?\s*=\s*(["'`])([^"'`]*)\1/g)) {
      m[2].split(/\s+/).filter(Boolean).forEach(t => tokens.add(t));
    }
    for (const m of source.matchAll(/classList\.(?:add|remove|toggle)\(([^)]*)\)/g)) {
      for (const q of m[1].matchAll(/(["'])([^"']+)\1/g)) tokens.add(q[2]);
    }
    return [...tokens].sort();
  };

  window.week1CaptureTailwind = async function () {
    const source = await (await fetch(location.href, { cache: 'no-store' })).text();
    const probe = document.createElement('div');
    probe.hidden = true;
    probe.className = week1ClassTokens(source).join(' ');
    document.body.appendChild(probe);
    await new Promise(r => setTimeout(r, 1000));
    const sheet = [...document.querySelectorAll('style')]
      .find(s => s.textContent.startsWith('*, ::before, ::after{--tw-'));
    probe.remove();
    if (!sheet) throw new Error('Tailwind Play CDN stylesheet not found: is the CDN script in the copy?');
    return sheet.textContent;
  };
})();
