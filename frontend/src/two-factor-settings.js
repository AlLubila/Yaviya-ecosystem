(() => {
  const t = (fr, en) => (document.documentElement.lang === "en" ? en : fr);
  const api = (action, data) => window.yaviyaAuthRequest(action, data);
  let opened = false;
  async function showSecurity() {
    if (opened) return;
    opened = true;
    let dialog,
      password = "";
    try {
      await window.ensureYaviyaSignedIn();
      const state = await api("mfa-status");
      dialog = document.createElement("dialog");
      dialog.className = "independent-auth mfa-settings";
      dialog.innerHTML = `<button class="close" type="button" aria-label="${t("Fermer", "Close")}">×</button><h2>${t("Sécurité du compte", "Account security")}</h2><p class="mfa-description"></p><div class="mfa-content"></div><p class="auth-error" role="alert"></p>`;
      document.body.append(dialog);
      dialog.showModal();
      const content = dialog.querySelector(".mfa-content"),
        description = dialog.querySelector(".mfa-description"),
        error = dialog.querySelector(".auth-error");
      const close = () => dialog.close();
      dialog.querySelector(".close").onclick = close;
      dialog.addEventListener("close", () => {
        password = "";
        dialog.remove();
        opened = false;
      });
      const passwordField = state.googleAccount
        ? `<p>${t("Pour confirmer une modification, reconnectez-vous avec Google puis revenez ici dans les 5 minutes.", "To confirm a change, sign in again with Google and return here within 5 minutes.")}</p><a class="add mfa-google">${t("Confirmer avec Google", "Confirm with Google")}</a>`
        : `<label>${t("Confirmez votre mot de passe", "Confirm your password")}<input type="password" name="password" autocomplete="current-password" required maxlength="128"></label>`;
      const connectGoogle = () => {
        const link = content.querySelector(".mfa-google");
        if (link)
          link.href =
            "/api/auth/google?return=" +
            encodeURIComponent(location.pathname + "?security=1");
      };
      const savedCodes = (codes) => {
        password = "";
        description.textContent = t(
          "Conservez ces codes hors de votre compte. Chaque code ne fonctionne qu’une fois. Ils ne seront plus affichés après fermeture.",
          "Keep these codes outside your account. Each works once. They will not be shown again after closing.",
        );
        content.innerHTML = `<h3>${t("Codes de secours", "Recovery codes")}</h3><pre class="mfa-codes"></pre><button class="add mfa-download" type="button">${t("Télécharger les codes", "Download codes")}</button><button class="primary mfa-done" type="button">${t("J’ai conservé mes codes", "I have saved my codes")}</button>`;
        content.querySelector("pre").textContent = codes.join("\n");
        content.querySelector(".mfa-download").onclick = () => {
          const url = URL.createObjectURL(
            new Blob(
              [
                "YAVIYA — " +
                  t(
                    "Codes de secours à usage unique",
                    "Single-use recovery codes",
                  ) +
                  "\n\n" +
                  codes.join("\n"),
              ],
              { type: "text/plain;charset=utf-8" },
            ),
          );
          const link = document.createElement("a");
          link.href = url;
          link.download = "yaviya-codes-secours.txt";
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        };
        content.querySelector(".mfa-done").onclick = close;
        window.dispatchEvent(new Event("yaviya-authenticated"));
      };
      if (!state.available && !state.enabled) {
        description.textContent = t(
          "La double authentification sera disponible après sa configuration par l’hébergeur.",
          "Two-factor authentication will be available once configured by the host.",
        );
        return;
      }
      description.textContent = state.enabled
        ? t(
            "Double authentification activée. Codes de secours restants : ",
            "Two-factor authentication enabled. Recovery codes remaining: ",
          ) + state.recoveryCodesRemaining
        : t(
            "Protégez votre compte avec Google Authenticator, Microsoft Authenticator ou une autre application compatible.",
            "Protect your account with Google Authenticator, Microsoft Authenticator or another compatible app.",
          );
      content.innerHTML = `<form class="editor">${passwordField}${state.enabled ? `<label>${t("Code de l’application ou code de secours", "Authenticator or recovery code")}<input name="code" autocomplete="one-time-code" required maxlength="32" spellcheck="false"></label><button class="primary" value="mfa-recovery">${t("Renouveler les codes de secours", "Regenerate recovery codes")}</button><button class="add" value="mfa-disable">${t("Désactiver la double authentification", "Disable two-factor authentication")}</button>` : `<button class="primary" value="mfa-setup">${t("Activer la double authentification", "Enable two-factor authentication")}</button>`}</form>`;
      connectGoogle();
      let stage = state.enabled ? "manage" : "setup";
      content.querySelector("form").onsubmit = async (event) => {
        event.preventDefault();
        error.textContent = "";
        const form = event.currentTarget;
        const buttons = [...form.querySelectorAll("button")];
        buttons.forEach((b) => (b.disabled = true));
        try {
          const data = Object.fromEntries(new FormData(form));
          if (stage === "verify") data.password = password;
          const action =
            stage === "verify"
              ? "mfa-enable"
              : stage === "setup"
                ? "mfa-setup"
                : event.submitter?.value;
          const value = await api(action, data);
          if (action === "mfa-setup") {
            password = data.password || "";
            stage = "verify";
            description.textContent = t(
              "Scannez ce QR code dans votre application, puis saisissez le code à 6 chiffres. Vous avez 10 minutes pour terminer.",
              "Scan this QR code in your app, then enter its 6-digit code. Finish within 10 minutes.",
            );
            form.innerHTML = `<img class="mfa-qr" alt="${t("QR code de configuration", "Setup QR code")}"><label>${t("Clé à saisir manuellement", "Manual setup key")}<input class="mfa-secret" readonly></label><label>${t("Code à 6 chiffres", "6-digit code")}<input name="code" required pattern="[0-9]{6}" inputmode="numeric" autocomplete="one-time-code" maxlength="6"></label><button class="primary">${t("Confirmer l’activation", "Confirm activation")}</button>`;
            form.querySelector("img").src = value.qrCode;
            form.querySelector(".mfa-secret").value = value.secret;
            form.querySelector('[name="code"]').focus();
          } else if (value.recoveryCodes) savedCodes(value.recoveryCodes);
          else {
            description.textContent = t(
              "La double authentification est désactivée.",
              "Two-factor authentication is disabled.",
            );
            content.replaceChildren();
            window.dispatchEvent(new Event("yaviya-authenticated"));
          }
        } catch (e) {
          error.textContent = e.message;
        } finally {
          buttons.forEach((b) => (b.disabled = false));
        }
      };
    } catch (e) {
      if (typeof toast === "function") toast(e.message);
      if (!dialog) opened = false;
    }
  }
  window.showYaviyaSecurity = showSecurity;
  const query = new URLSearchParams(location.search);
  if (query.get("security") === "1") {
    const clean = new URL(location.href);
    clean.searchParams.delete("security");
    history.replaceState(null, "", clean);
    showSecurity();
  }
})();
