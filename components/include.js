/**
 * Tiny include loader.
 *
 * Usage in a page:
 *   <div data-include="components/header.html"></div>
 *   <div data-include="components/footer.html"></div>
 *   <script src="components/include.js"></script>
 *
 * Scripts that depend on injected markup (e.g. #nav, .mobile-menu) should
 * wait for the `includes:ready` event before running:
 *
 *   document.addEventListener("includes:ready", () => { ... });
 *
 * Active nav state is marked automatically. Set <body data-page="home">
 * and give nav links matching `data-nav-page` attributes.
 */
(function () {
  const placeholders = document.querySelectorAll("[data-include]");

  function markActive() {
    const page = document.body.dataset.page;
    if (!page) return;
    document.querySelectorAll("[data-nav-page]").forEach((el) => {
      if (el.dataset.navPage === page) el.classList.add("active");
    });
  }

  if (!placeholders.length) {
    window.includesReady = Promise.resolve();
    markActive();
    document.dispatchEvent(new CustomEvent("includes:ready"));
    return;
  }

  window.includesReady = Promise.all(
    Array.from(placeholders).map(async (el) => {
      const path = el.getAttribute("data-include");
      try {
        const res = await fetch(path, { cache: "no-cache" });
        if (!res.ok) throw new Error(res.status + " " + res.statusText);
        const html = await res.text();
        // Replace the placeholder with the fetched markup so no wrapper div remains.
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        const frag = document.createDocumentFragment();
        while (tmp.firstChild) frag.appendChild(tmp.firstChild);
        el.replaceWith(frag);
      } catch (err) {
        console.error("[include] failed to load", path, err);
      }
    })
  ).then(() => {
    markActive();
    document.dispatchEvent(new CustomEvent("includes:ready"));
  });
})();
