// Shared orders own these actions; older scenario controls cannot mutate them.
window.YAVIYA_SHARED_COMMERCE = true;
window.addEventListener(
  "click",
  (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (
      button.matches(
        "[data-seller-accept],[data-seller-decline],[data-seller-prepare],[data-seller-handover],[data-courier-accept],[data-courier-collect],[data-proof-order],[data-receipt],[data-advance],[data-courier-order],[data-commerce-action],[data-order-chat]",
      )
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (window.handleCommerceClick) window.handleCommerceClick(button);
    }
  },
  true,
);
