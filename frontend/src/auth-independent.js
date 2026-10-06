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
    pendingLogin = new Promise((resolve, reject) => {
      const dialog = document.createElement("dialog");
      dialog.className = "independent-auth";
      dialog.innerHTML = `<button type="button" class="close" aria-label="${translate("Fermer", "Close")}">×</button><h2>${translate("Mon compte YAVIYA", "My YAVIYA account")}</h2><p>${translate("Connectez-vous ou créez votre accès personnel.", "Sign in or create your personal account.")}</p><a class="add" href="/api/auth/google">Continuer avec Google / Gmail</a><form class="editor"><label>${translate("E-mail ou téléphone", "Email or phone")}<input name="login" required maxlength="150" autocomplete="username"></label><label>${translate("Mot de passe · 12 caractères minimum", "Password · minimum 12 characters")}<input name="password" type="password" required minlength="12" maxlength="128" autocomplete="current-password"></label><p class="auth-error" role="alert"></p><button class="primary" type="submit">${translate("Se connecter", "Sign in")}</button><button class="add auth-signup" type="button">${translate("Créer mon accès YAVIYA", "Create my YAVIYA login")}</button></form>`;
      document.body.append(dialog);
      dialog.showModal();
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
        submit("login");
      };
      dialog.querySelector(".auth-signup").onclick = () => submit("signup");
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
  if (typeof showRegister === "function") {
    const previous = showRegister;
    showRegister = function () {
      previous();
      const google = document.querySelector(".google-registration");
      if (google)
        google.innerHTML =
          '<a class="add" href="/api/auth/google">Continuer avec Google / Gmail</a>';
    };
  }
  window.ensureYaviyaSignedIn = ensureSignedIn;
  window.addEventListener("yaviya-authenticated", () => {
    if (typeof loadMarket === "function") loadMarket();
    if (typeof customerAPI === "function")
      customerAPI()
        .then((profile) => {
          if (profile) {
            customerProfile = profile;
            wishes.clear();
            profile.wishlist.forEach((id) => wishes.add(id));
            decorateHearts();
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
  const anchor = document.querySelector("header");
  if (anchor) anchor.append(logout);
  const refresh = () =>
    authRequest("session")
      .then((value) => {
        logout.hidden = !value.user;
      })
      .catch(() => {});
  refresh();
  window.addEventListener("yaviya-authenticated", refresh);
})();
