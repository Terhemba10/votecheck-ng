import { test } from "node:test";
import assert from "node:assert/strict";
import { signSession, verifySession, parseCookies, verifyGoogleIdToken } from "../src/auth.js";

const SECRET = "test-secret";
const user = { name: "Ada Obi", email: "ada@example.com" };
const CLIENT = "client-123.apps.googleusercontent.com";
const fakeGoogle = info => async () => ({ ok: true, json: async () => info });
const good = { aud: CLIENT, iss: "https://accounts.google.com", email_verified: "true", exp: String(Math.floor(Date.now() / 1000) + 600), email: user.email, name: user.name };

test("a signed session reads back as the same user", () => {
  assert.deepEqual(verifySession(signSession(user, SECRET), SECRET), user);
});

test("a tampered or wrongly signed session is rejected", () => {
  const token = signSession(user, SECRET);
  const [payload, sig] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ ...user, email: "x@example.com", exp: Date.now() + 1e9 })).toString("base64url");
  assert.equal(verifySession(`${forged}.${sig}`, SECRET), null);
  assert.equal(verifySession(token, "other-secret"), null);
  assert.equal(verifySession(payload, SECRET), null);
  assert.equal(verifySession("", SECRET), null);
});

test("an expired session is rejected", () => {
  const token = signSession(user, SECRET, Date.now() - 9 * 3600_000);
  assert.equal(verifySession(token, SECRET), null);
});

test("cookies are parsed", () => {
  assert.deepEqual(parseCookies("a=1; vc_session=abc.def; b=x%20y"), { a: "1", vc_session: "abc.def", b: "x y" });
});

test("a valid Google token gives the user's name and email", async () => {
  assert.deepEqual(await verifyGoogleIdToken("tok", CLIENT, fakeGoogle(good)), user);
});

test("Google tokens for another app, unverified emails or expired tokens are refused", async () => {
  await assert.rejects(verifyGoogleIdToken("tok", CLIENT, fakeGoogle({ ...good, aud: "someone-else" })), /different app/);
  await assert.rejects(verifyGoogleIdToken("tok", CLIENT, fakeGoogle({ ...good, email_verified: "false" })), /not verified/);
  await assert.rejects(verifyGoogleIdToken("tok", CLIENT, fakeGoogle({ ...good, exp: "1" })), /expired/);
  await assert.rejects(verifyGoogleIdToken("tok", CLIENT, fakeGoogle({ ...good, iss: "evil.example" })), /Google/);
  await assert.rejects(verifyGoogleIdToken("", CLIENT, fakeGoogle(good)), /Missing/);
});
