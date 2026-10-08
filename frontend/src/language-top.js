const existingLanguage = document.querySelector(
  "#help-language,#ad-language,#policy-language",
);
const languageHeader = document.querySelector("header");
const languageNavigation = document.querySelector(".market-navigation");
const mobileLanguageLayout =
  typeof window.matchMedia === "function"
    ? window.matchMedia("(max-width: 650px)")
    : { matches: false, addEventListener() {} };
const placeLanguageSelector = (label) => {
  const destination =
    mobileLanguageLayout.matches || !languageNavigation
      ? languageHeader
      : languageNavigation;
  if (destination && label.parentElement !== destination) destination.append(label);
};
if (typeof language !== "undefined" && typeof applyLanguage === "function") {
  languageHeader.insertAdjacentHTML(
    "beforeend",
    `<label class="header-language"><span class="sr-only">${T("Langue", "Language")}</span><select id="site-language" aria-label="${T("Langue", "Language")}"><option value="fr">FR</option><option value="en">EN</option></select></label>`,
  );
  const languageLabel = document.querySelector(".header-language");
  placeLanguageSelector(languageLabel);
  mobileLanguageLayout.addEventListener("change", () =>
    placeLanguageSelector(languageLabel),
  );
  document.querySelector("#site-language").value = language;
  document.querySelector("#site-language").onchange = (e) => {
    language = e.target.value;
    try {
      localStorage.setItem("yaviya-language", language);
    } catch {}
    applyLanguage();
    if (typeof renderMenu === "function") renderMenu();
    if (typeof renderPhotoCopy === "function") renderPhotoCopy();
  };
} else if (existingLanguage) {
  const label = existingLanguage.closest("label");
  if (label) {
    label.classList.add("header-language");
    placeLanguageSelector(label);
    mobileLanguageLayout.addEventListener("change", () =>
      placeLanguageSelector(label),
    );
  }
}
