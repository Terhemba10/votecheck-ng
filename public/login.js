import { $, postJSON, t, applyI18n, onLangChange, chooseLanguageIfNeeded, getLang, LANGUAGES, LANG_LABELS, LANG_CODES, setLang } from "/common.js";
import { startFlag } from "/hero.js";
import { SCENE_VOTERS } from "/scenes.js";

// The sign-in page has no site header, so it carries its own language picker.
const picker = $("login-lang");
picker.innerHTML = LANGUAGES.map(l => `<option value="${l}" lang="${LANG_CODES[l]}">${LANG_LABELS[l]}</option>`).join("");
picker.value = getLang();
picker.addEventListener("change", () => setLang(picker.value));

const drawScene = () => { $("login-scene").innerHTML = SCENE_VOTERS(t); };
drawScene();
$("login-scene").classList.add("scene-live");
startFlag(document.querySelector(".login-art canvas"), $("login-art"));

const me = await (await fetch("/api/me")).json().catch(() => ({}));
function renderMode() {
  picker.value = getLang();
  drawScene();
  if (!me.authEnabled) {
    // Sign-in not configured on this server (for example, local testing): let people in, and say so plainly.
    $("signin-lead").textContent = t("login.demoLead");
    $("gsi-box").innerHTML = `<a class="btn" href="/">${t("login.continue")}</a>`;
  }
}
applyI18n();
renderMode();
onLangChange(renderMode);
chooseLanguageIfNeeded();

if (!me.authEnabled) {
  // handled by renderMode
} else if (me.user) {
  location.href = "/";
} else {
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.onload = () => {
    google.accounts.id.initialize({ client_id: me.googleClientId, callback: onCredential, ux_mode: "popup" });
    google.accounts.id.renderButton($("gsi-box"), { theme: "outline", size: "large", shape: "pill", text: "signin_with", width: 300, locale: LANG_CODES[getLang()] === "pcm" ? "en" : LANG_CODES[getLang()] });
  };
  script.onerror = () => { $("login-error").textContent = t("login.gsiFail"); };
  document.head.appendChild(script);
}

async function onCredential({ credential }) {
  $("login-error").textContent = "";
  try {
    await postJSON("/api/login", { credential });
    location.href = "/";
  } catch (e) {
    $("login-error").textContent = e.message;
  }
}
