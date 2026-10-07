// Keep new windows positioned at their beginning without a floating Back control.
const pageOpen = open;
let pageRevision = 0;
function resetPageStart() {
  modal.scrollTop = 0;
  modal.scrollLeft = 0;
  const content = $("#modal-content");
  content.scrollTop = 0;
  content.scrollLeft = 0;
}
open = function (html) {
  pageOpen(html);
  const revision = ++pageRevision;
  resetPageStart();
  requestAnimationFrame(() => {
    if (revision === pageRevision && modal.open) resetPageStart();
  });
};
modal.addEventListener("close", () => {
  if (modal.open) return;
  pageRevision++;
  resetPageStart();
});
