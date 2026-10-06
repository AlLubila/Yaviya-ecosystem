// Keep product/shop navigation separate from form and dashboard refreshes.
const pageNavigation = { previous: [], browsing: false, revision: 0 };
const pageOpen = open;
const pageBack = document.createElement("button");
pageBack.type = "button";
pageBack.className = "page-back add";
pageBack.hidden = true;
modal.insertBefore(pageBack, modal.firstChild);

function resetPageStart() {
  modal.scrollTop = 0;
  modal.scrollLeft = 0;
  const content = $("#modal-content");
  content.scrollTop = 0;
  content.scrollLeft = 0;
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

function presentPageStart() {
  const revision = ++pageNavigation.revision;
  const hasPrevious = pageNavigation.previous.length > 0;
  pageBack.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 12H5m7-7-7 7 7 7"/></svg><span>${T("Retour", "Back")}</span>`;
  pageBack.setAttribute(
    "aria-label",
    hasPrevious
      ? T("Revenir à la vue précédente", "Return to the previous view")
      : T("Revenir au catalogue", "Return to the catalogue"),
  );
  pageBack.title = pageBack.getAttribute("aria-label");
  pageBack.hidden = false;
  pageBack.focus({ preventScroll: true });
  resetPageStart();
  requestAnimationFrame(() => {
    if (revision === pageNavigation.revision && modal.open) resetPageStart();
  });
}

open = function (html) {
  if (!pageNavigation.browsing) pageNavigation.previous = [];
  pageOpen(html);
  presentPageStart();
};

function navigateProductPage(renderPage) {
  if (modal.open) {
    // Move the real nodes: gallery, forms and local event handlers stay usable.
    const previous = document.createDocumentFragment();
    previous.append(...$("#modal-content").childNodes);
    pageNavigation.previous.push(previous);
  } else {
    pageNavigation.previous = [];
  }
  pageNavigation.browsing = true;
  try {
    renderPage();
  } finally {
    pageNavigation.browsing = false;
  }
}

const navigationProductDetails = showProductDetails;
showProductDetails = function (id) {
  const product = products.find((product) => product.id === id);
  if (!product || !shopOf(product)) return;
  navigateProductPage(() => navigationProductDetails(id));
};
const navigationShop = showShop;
showShop = function (id) {
  if (!shops.some((shop) => shop.id === id)) return;
  navigateProductPage(() => navigationShop(id));
};

pageBack.onclick = () => {
  const previous = pageNavigation.previous.pop();
  if (previous) {
    $("#modal-content").replaceChildren(previous);
    presentPageStart();
  } else {
    modal.close();
    resetPageStart();
  }
};
modal.addEventListener("close", () => {
  // A queued close event can arrive after another option has already opened.
  if (modal.open) return;
  pageNavigation.previous = [];
  pageNavigation.revision++;
  pageBack.hidden = true;
  resetPageStart();
});
