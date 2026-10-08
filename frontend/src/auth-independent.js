(() => {
  const originalFetch = window.fetch.bind(window);
  let pendingLogin;
  const translate = (fr, en) =>
    document.documentElement.lang === "en" ? en : fr;
  async function authRequest(action, data) {
    const response = await originalFetch(
      `/api/auth/${action}`,
      data
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        : {},
    );
    const value = await response.json();
    if (!response.ok)
      throw new Error(
        value.error ||
          translate("Connexion indisponible", "Sign-in unavailable"),
      );
    return value;
  }
  async function ensureSignedIn() {
    const session = await authRequest("session");
    if (session.user) return session.user;
    if (pendingLogin) return pendingLogin;
    const challenge = await authRequest("mfa-challenge");
    if (pendingLogin) return pendingLogin;
    pendingLogin = new Promise((resolve, reject) => {
      const dialog = document.createElement("dialog");
      dialog.className = "independent-auth";
      dialog.innerHTML = `<button type="button" class="close" aria-label="${translate("Fermer", "Close")}">×</button><h2>${translate("Mon compte YAVIYA", "My YAVIYA account")}</h2><p>${translate("Connectez-vous ou créez votre accès personnel.", "Sign in or create your personal account.")}</p><form class="editor"><label>${translate("Mode de connexion", "Sign-in method")}<select name="loginMethod"><option value="email">E-mail</option><option value="phone">${translate("Téléphone", "Phone")}</option></select></label><label class="auth-country" hidden>${translate("Pays du numéro", "Phone country")}<select name="phoneCountry"><option value="CD">RD Congo (+243)</option><option value="CG">République du Congo (+242)</option></select></label><label><span class="auth-login-label">E-mail</span><input name="login" required maxlength="150" autocomplete="username" type="email"></label><label>${translate("Mot de passe", "Password")}<input name="password" type="password" required minlength="8" maxlength="128" autocomplete="current-password" aria-describedby="password-rules"></label><small id="password-rules" class="password-rules">${translate("Pour créer un compte : 8 caractères minimum, avec une majuscule, une minuscule, un chiffre et un caractère spécial.", "To create an account: at least 8 characters with an uppercase letter, a lowercase letter, a number and a special character.")}</small><div class="sms-access" hidden><button class="add sms-send" type="button">${translate("Recevoir un code SMS", "Send an SMS code")}</button><label hidden class="sms-code">${translate("Code SMS", "SMS code")}<input name="smsCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6"></label><button class="add sms-verify" type="button" hidden>${translate("Vérifier le code SMS", "Verify SMS code")}</button></div><p class="auth-error" role="alert"></p><button class="primary" type="submit">${translate("Se connecter", "Sign in")}</button><button class="add auth-signup" type="button">${translate("Créer mon accès YAVIYA", "Create my YAVIYA login")}</button></form>`;
      const method = dialog.querySelector('[name="loginMethod"]');
      const phoneCountry = dialog.querySelector('[name="phoneCountry"]');
      const login = dialog.querySelector('[name="login"]');
      phoneCountry.value = window.YAVIYA_COUNTRY === "CG" ? "CG" : "CD";
      const updateMethod = () => {
        const phone = method.value === "phone";
        dialog.querySelector(".auth-country").hidden = !phone;
        dialog.querySelector(".sms-access").hidden = !phone;
        dialog.querySelector(".auth-login-label").textContent = phone ? translate("Téléphone", "Phone") : "E-mail";
        login.type = phone ? "tel" : "email";
        login.inputMode = phone ? "tel" : "email";
        login.value = phone ? (phoneCountry.value === "CG" ? "+242" : "+243") : "";
        login.pattern = phone ? "\\+[0-9]{7,15}" : ".*";
      };
      method.onchange = updateMethod;
      phoneCountry.onchange = updateMethod;
      document.body.append(dialog);
      dialog.showModal();
      const showFactor = () => {
        dialog.querySelector("h2").textContent = translate(
          "Vérification en deux étapes",
          "Two-step verification",
        );
        dialog.querySelector("h2 + p").textContent = translate(
          "Saisissez le code de votre application d’authentification ou un code de secours. La connexion expire après 5 minutes.",
          "Enter your authenticator code or a recovery code. Sign-in expires after 5 minutes.",
        );
        dialog.querySelector("form").innerHTML =
          `<label>${translate("Code d’authentification ou de secours", "Authenticator or recovery code")}<input name="code" required maxlength="32" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false"></label><p class="auth-error" role="alert"></p><button class="primary" type="submit">${translate("Vérifier et se connecter", "Verify and sign in")}</button>`;
        dialog.querySelector("input").focus();
      };
      let factor = challenge.pending;
      if (factor) showFactor();
      const form = dialog.querySelector("form");
      let completed = false;
      const submit = async (action) => {
        if (!form.reportValidity()) return;
        const buttons = [...form.querySelectorAll("button")];
        buttons.forEach((b) => (b.disabled = true));
        try {
          const value = await authRequest(
            action,
            Object.fromEntries(new FormData(form)),
          );
          if (value.requiresTwoFactor) {
            factor = true;
            showFactor();
            return;
          }
          if (!value.user)
            throw new Error(
              translate("Connexion incomplète", "Incomplete sign-in"),
            );
          completed = true;
          dialog.close();
          resolve(value.user);
          window.dispatchEvent(new Event("yaviya-authenticated"));
        } catch (error) {
          dialog.querySelector(".auth-error").textContent = error.message;
        } finally {
          buttons.forEach((b) => (b.disabled = false));
        }
      };
      form.onsubmit = (event) => {
        event.preventDefault();
        submit(factor ? "mfa-verify" : "login");
      };
      const smsSend = dialog.querySelector(".sms-send");
      if (smsSend) smsSend.onclick = async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        try {
          await authRequest("phone-send", { phone: login.value });
          dialog.querySelector(".sms-code").hidden = false;
          dialog.querySelector(".sms-verify").hidden = false;
          dialog.querySelector(".auth-error").textContent = translate("Code envoyé. Consultez vos SMS.", "Code sent. Check your SMS.");
        } catch (error) { dialog.querySelector(".auth-error").textContent = error.message; }
        finally { button.disabled = false; }
      };
      const smsVerify = dialog.querySelector(".sms-verify");
      if (smsVerify) smsVerify.onclick = async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        try {
          const value = await authRequest("phone-verify", { phone: login.value, code: form.elements.smsCode.value });
          if (value.requiresTwoFactor) { factor = true; showFactor(); return; }
          if (!value.user) throw Error(translate("Connexion incomplète", "Incomplete sign-in"));
          completed = true; dialog.close(); resolve(value.user);
          window.dispatchEvent(new Event("yaviya-authenticated"));
        } catch (error) { dialog.querySelector(".auth-error").textContent = error.message; }
        finally { button.disabled = false; }
      };
      const signup = dialog.querySelector(".auth-signup");
      if (signup) signup.onclick = () => submit("signup");
      dialog.querySelector(".close").onclick = () => dialog.close();
      dialog.addEventListener("close", () => {
        if (!completed)
          reject(new Error(translate("Connexion annulée", "Sign-in canceled")));
        dialog.remove();
      });
    }).finally(() => {
      pendingLogin = null;
    });
    return pendingLogin;
  }
  window.fetch = async (input, options) => {
    const request = new Request(
        input instanceof Request ? input : new URL(input, location.href),
        options,
      ),
      backup = request.clone();
    const response = await originalFetch(request);
    const url = new URL(request.url);
    if (
      url.origin === location.origin &&
      url.pathname.startsWith("/api/") &&
      !url.pathname.startsWith("/api/auth/") &&
      !["GET", "HEAD"].includes(request.method) &&
      response.status === 401
    ) {
      await ensureSignedIn();
      return originalFetch(backup);
    }
    return response;
  };
  window.ensureYaviyaSignedIn = ensureSignedIn;
  window.yaviyaAuthRequest = authRequest;
  if (new URLSearchParams(location.search).get("mfa") === "1") {
    const clean = new URL(location.href);
    clean.searchParams.delete("mfa");
    history.replaceState(null, "", clean);
    ensureSignedIn().catch(() => {});
  }
  window.addEventListener("yaviya-authenticated", () => {
    if (typeof loadMarket === "function") loadMarket();
    if (typeof customerAPI === "function")
      customerAPI()
        .then((profile) => {
          if (profile) {
            customerProfile = profile;
            if (["fr", "en"].includes(profile.preferredLanguage)) {
              language = profile.preferredLanguage;
              try {
                localStorage.setItem("yaviya-language", language);
              } catch {}
              applyLanguage();
              const selector = document.querySelector("#site-language");
              if (selector) selector.value = language;
            }
            wishes.clear();
            profile.wishlist.forEach((id) => wishes.add(id));
            decorateHearts();
            if (
              ["seller", "courier"].includes(profile.accountType) &&
              typeof refreshVerification === "function"
            ) {
              refreshVerification().then(() => {
                const check = verificationState.check;
                if (
                  !check?.issuingCountry ||
                  !["image/jpeg", "image/png"].includes(check.documentMime)
                ) {
                  showRegister();
                  toast(
                    translate(
                      "Confirmez le pays d’émission et ajoutez la photo de votre pièce d’identité.",
                      "Confirm the issuing country and upload your identity photo.",
                    ),
                  );
                }
              });
            }
          }
        })
        .catch(() => {});
  });
  const logout = document.createElement("button");
  logout.className = "add";
  logout.textContent = translate("Se déconnecter", "Sign out");
  logout.hidden = true;
  logout.onclick = async () => {
    try {
      await authRequest("logout", {});
      location.reload();
    } catch (error) {
      if (typeof toast === "function") toast(error.message);
    }
  };
  const anchor =
    document.querySelector(".header-actions") ||
    document.querySelector("header");
  if (anchor) anchor.append(logout);
  let restoredSessionChecked = false;
  const refresh = () =>
    authRequest("session")
      .then((value) => {
        logout.hidden = !value.user;
        if (value.user && !restoredSessionChecked) {
          restoredSessionChecked = true;
          window.dispatchEvent(new Event("yaviya-authenticated"));
        }
      })
      .catch(() => {});
  refresh();
  window.addEventListener("yaviya-authenticated", () => {
    restoredSessionChecked = true;
    refresh();
  });
})();
