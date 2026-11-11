// Hero scenes: AI-generated photographs of fictional people (not likenesses of real people),
// shown with a slow camera-style zoom. Each carries a visible "AI-generated" note, so nobody mistakes them for real photos.
// The ballot uses placeholder parties A–F, so no real party is shown.

const scene = (file, altKey, t) => `
  <figure class="scene-photo">
    <img src="/img/${file}" width="1200" height="900" alt="${t(altKey).replace(/"/g, "&quot;")}" decoding="async">
    <figcaption>${t("scene.aiNote")}</figcaption>
  </figure>`;

export const SCENE_VOTERS = t => scene("scene-voters.jpg", "scene.votersAlt", t);
export const SCENE_BALLOT = t => scene("scene-ballot.jpg", "scene.ballotAlt", t);
export const SCENE_REFUSE = t => scene("scene-refuse.jpg", "scene.refuseAlt", t);
