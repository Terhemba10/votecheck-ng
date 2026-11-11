// Google sign-in and sessions, using only Node built-ins.
// We keep no user database: after Google confirms who you are, your name and email go into a signed cookie
// on your own device for 8 hours. Nothing about you is stored on the server.
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "vc_session";
export const SESSION_HOURS = 8;

const b64 = s => Buffer.from(s).toString("base64url");
const unb64 = s => Buffer.from(s, "base64url").toString("utf8");
const mac = (data, secret) => createHmac("sha256", secret).update(data).digest("base64url");

// Session token = base64url(JSON payload) + "." + HMAC signature.
export function signSession(user, secret, now = Date.now()) {
  const payload = b64(JSON.stringify({ name: user.name, email: user.email, exp: now + SESSION_HOURS * 3600_000 }));
  return payload + "." + mac(payload, secret);
}

// Returns the user, or null if the token is missing, tampered with or expired.
export function verifySession(token, secret, now = Date.now()) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = mac(payload, secret);
  if (!sig || sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(unb64(payload));
    return data.exp > now ? { name: data.name, email: data.email } : null;
  } catch { return null; }
}

export function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map(p => p.trim().split("=")).filter(([k]) => k).map(([k, ...v]) => [k, decodeURIComponent(v.join("="))]));
}

export function sessionCookie(token, { secure }) {
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_HOURS * 3600}${secure ? "; Secure" : ""}`;
}
export function clearCookie({ secure }) {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure ? "; Secure" : ""}`;
}

// Asks Google to check the ID token from the "Sign in with Google" button.
// The token is sent in the request body, never in a URL. `fetchImpl` is swappable for tests.
export async function verifyGoogleIdToken(idToken, clientId, fetchImpl = fetch) {
  if (!idToken || typeof idToken !== "string" || idToken.length > 4096) throw new Error("Missing sign-in token");
  const res = await fetchImpl("https://oauth2.googleapis.com/tokeninfo", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: idToken }).toString(),
  });
  if (!res.ok) throw new Error("Google could not confirm this sign-in");
  const t = await res.json();
  if (t.aud !== clientId) throw new Error("This sign-in was meant for a different app");
  if (!["accounts.google.com", "https://accounts.google.com"].includes(t.iss)) throw new Error("Sign-in did not come from Google");
  if (String(t.email_verified) !== "true") throw new Error("Your Google email address is not verified");
  if (Number(t.exp) * 1000 < Date.now()) throw new Error("This sign-in has expired. Try again");
  return { name: t.name || t.email, email: t.email };
}
