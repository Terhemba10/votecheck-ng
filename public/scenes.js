// Illustrated hero scenes, drawn as SVG. Original characters, not likenesses of real people.
// The ballot uses placeholder parties so no real party is shown.

const face = (cx, cy) => `
  <circle cx="${cx - 8}" cy="${cy}" r="2.6" fill="#1a110b"/><circle cx="${cx + 8}" cy="${cy}" r="2.6" fill="#1a110b"/>
  <path d="M${cx - 8} ${cy + 11} Q${cx} ${cy + 17} ${cx + 8} ${cy + 11}" fill="none" stroke="#1a110b" stroke-width="2.2" stroke-linecap="round"/>`;

const pvc = (x, y, rot) => `
  <g transform="translate(${x} ${y}) rotate(${rot})">
    <rect x="-15" y="-10" width="30" height="20" rx="3" fill="#ffffff" stroke="#00703f" stroke-width="1.5"/>
    <rect x="-15" y="-10" width="30" height="6" rx="2" fill="#008751"/>
    <rect x="-11" y="-1" width="8" height="8" rx="1.5" fill="#c9d6cd"/><rect x="0" y="0" width="11" height="2" fill="#9aa9a0"/><rect x="0" y="4" width="8" height="2" fill="#9aa9a0"/>
  </g>`;

// Scene 1: three voters in Hausa, Igbo and Yorùbá dress, holding up their voter cards.
export const SCENE_VOTERS = t => `
<svg class="scene" viewBox="0 0 480 340" role="img" aria-labelledby="sv-t">
  <title id="sv-t">${t("scene.votersAlt")}</title>
  <ellipse cx="240" cy="322" rx="215" ry="12" fill="rgba(0,0,0,.28)"/>

  <!-- Hausa man -->
  <g class="bob">
    <ellipse cx="104" cy="316" rx="13" ry="6" fill="#2a1d14"/><ellipse cx="136" cy="316" rx="13" ry="6" fill="#2a1d14"/>
    <rect x="98" y="270" width="44" height="44" fill="#e2dccb"/>
    <path d="M72 152 Q120 132 168 152 L198 300 Q120 320 42 300 Z" fill="#f4f1e8"/>
    <path d="M72 152 Q120 132 168 152 L176 190 Q120 176 64 190 Z" fill="#ebe6d8"/>
    <path d="M102 150 L120 214 L138 150" fill="none" stroke="#0e6b45" stroke-width="3"/>
    <circle cx="120" cy="230" r="9" fill="none" stroke="#0e6b45" stroke-width="2.5"/><circle cx="120" cy="230" r="3.5" fill="#0e6b45"/>
    <path d="M108 250 h24 M111 258 h18" stroke="#0e6b45" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="111" y="128" width="18" height="18" rx="4" fill="#6e4127"/>
    <circle cx="120" cy="112" r="24" fill="#6e4127"/>
    ${face(120, 112)}
    <path d="M97 98 L99 70 Q120 60 141 70 L143 98 Q120 92 97 98 Z" fill="#efe7d2"/>
    <path d="M100 86 h40 M101 77 h38" stroke="#c8102e" stroke-width="2" stroke-dasharray="4 3"/>
    <g class="wave"><path d="M160 166 Q178 128 182 98 L194 102 Q190 134 172 176 Z" fill="#f4f1e8"/><circle cx="188" cy="94" r="8" fill="#6e4127"/>${pvc(190, 78, -10)}</g>
  </g>

  <!-- Igbo woman -->
  <g class="bob b2">
    <ellipse cx="226" cy="318" rx="12" ry="6" fill="#2a1d14"/><ellipse cx="256" cy="318" rx="12" ry="6" fill="#2a1d14"/>
    <path d="M196 200 L284 200 L296 314 L184 314 Z" fill="#c9a227"/>
    <path d="M192 236 L288 236 M190 262 L291 262 M187 288 L294 288" stroke="#8e1b3a" stroke-width="7"/>
    <path d="M190 249 L290 249 M188 275 L292 275" stroke="#8e1b3a" stroke-width="2" stroke-dasharray="3 5"/>
    <path d="M208 146 Q240 136 272 146 L282 206 L198 206 Z" fill="#8e1b3a"/>
    <circle cx="206" cy="156" r="16" fill="#8e1b3a"/><circle cx="274" cy="156" r="16" fill="#8e1b3a"/>
    <g fill="#fff" opacity=".35"><circle cx="226" cy="170" r="2"/><circle cx="240" cy="182" r="2"/><circle cx="254" cy="170" r="2"/><circle cx="232" cy="194" r="2"/><circle cx="248" cy="194" r="2"/></g>
    <path d="M204 162 Q190 196 198 222 L208 220 Q204 196 214 168 Z" fill="#7b4a2d"/>
    <rect x="231" y="124" width="18" height="18" rx="4" fill="#7b4a2d"/>
    <path d="M226 140 Q240 150 254 140" fill="none" stroke="#d9382c" stroke-width="5" stroke-linecap="round" stroke-dasharray="0.1 7"/>
    <circle cx="240" cy="108" r="23" fill="#7b4a2d"/>
    ${face(240, 108)}
    <path d="M233 125 q7 4 14 0" fill="#5a1f2c"/>
    <circle cx="217" cy="114" r="3" fill="#d9382c"/><circle cx="263" cy="114" r="3" fill="#d9382c"/>
    <path d="M206 96 Q206 62 240 60 Q278 56 288 88 Q270 74 240 80 Q218 82 206 96 Z" fill="#d4a017"/>
    <path d="M214 74 Q238 52 274 66 M222 64 Q252 50 280 76" fill="none" stroke="#a8780a" stroke-width="3" stroke-linecap="round"/>
    <path d="M276 70 Q300 56 296 86 Q290 76 282 80 Z" fill="#e6b72a"/>
    <g class="wave"><path d="M270 160 Q292 126 296 98 L308 102 Q304 132 282 170 Z" fill="#8e1b3a"/><circle cx="302" cy="94" r="8" fill="#7b4a2d"/>
      <path d="M296 88 v-10 M301 87 v-12 M306 88 v-10 M310 92 v-7" stroke="#7b4a2d" stroke-width="4" stroke-linecap="round"/></g>
  </g>

  <!-- Yorùbá man -->
  <g class="bob b3">
    <ellipse cx="344" cy="316" rx="13" ry="6" fill="#2a1d14"/><ellipse cx="376" cy="316" rx="13" ry="6" fill="#2a1d14"/>
    <rect x="338" y="270" width="44" height="44" fill="#d6dcef"/>
    <path d="M302 152 Q360 130 418 152 L452 300 Q360 322 268 300 Z" fill="#2b3f7a"/>
    <path d="M340 148 Q360 156 380 148 L374 200 Q360 210 346 200 Z" fill="#d6dcef"/>
    <path d="M330 206 Q360 236 390 206 M336 224 Q360 250 384 224" fill="none" stroke="#9fb3e8" stroke-width="3"/>
    <circle cx="360" cy="250" r="6" fill="none" stroke="#9fb3e8" stroke-width="2.5"/>
    <rect x="351" y="128" width="18" height="18" rx="4" fill="#5c3620"/>
    <circle cx="360" cy="110" r="24" fill="#5c3620"/>
    ${face(360, 110)}
    <g transform="rotate(-8 362 84)">
      <path d="M336 96 L340 74 Q362 60 386 72 L392 94 Q364 86 336 96 Z" fill="#1e2d59"/>
      <path d="M384 72 L402 84 L392 94 Z" fill="#2b3f7a"/>
      <path d="M338 90 Q364 82 392 89" fill="none" stroke="#c9a227" stroke-width="3"/>
    </g>
    <g class="wave"><path d="M312 166 Q296 128 292 98 L280 102 Q284 134 302 176 Z" fill="#2b3f7a"/><circle cx="286" cy="94" r="8" fill="#5c3620"/>${pvc(284, 78, 10)}</g>
  </g>
</svg>`;

// Scene 2: a hand with an inked thumb pressing a box on a sample ballot paper.
const party = (x, y, label, shape, colour) => `
  <g transform="translate(${x} ${y})">
    <rect width="128" height="74" rx="8" fill="#f7f9f7" stroke="#d6ded8"/>
    <g transform="translate(26 30)">${shape(colour)}</g>
    <text x="26" y="64" text-anchor="middle" font-family="Poppins, sans-serif" font-size="11" fill="#56635b">${label}</text>
    <rect x="62" y="12" width="52" height="50" rx="6" fill="#fff" stroke="#9aa9a0" stroke-dasharray="4 3"/>
  </g>`;
const circle = c => `<circle r="15" fill="${c}"/>`;
const tri = c => `<path d="M0 -16 L15 12 L-15 12 Z" fill="${c}"/>`;
const square = c => `<rect x="-14" y="-14" width="28" height="28" rx="3" fill="${c}"/>`;
const star = c => `<path d="M0 -16 L4.7 -5 L16 -5 L7 2 L10 14 L0 7 L-10 14 L-7 2 L-16 -5 L-4.7 -5 Z" fill="${c}"/>`;

export const SCENE_BALLOT = t => `
<svg class="scene" viewBox="0 0 480 340" role="img" aria-labelledby="sb-t">
  <title id="sb-t">${t("scene.ballotAlt")}</title>
  <ellipse cx="236" cy="318" rx="180" ry="10" fill="rgba(0,0,0,.25)"/>
  <g transform="rotate(-4 236 176)">
    <rect x="86" y="48" width="300" height="262" rx="10" fill="#ffffff"/>
    <rect x="86" y="48" width="300" height="34" rx="10" fill="#008751"/><rect x="86" y="70" width="300" height="12" fill="#008751"/>
    <text x="236" y="70" text-anchor="middle" font-family="Poppins, sans-serif" font-size="13" font-weight="600" fill="#fff">${t("scene.ballot")}</text>
    ${party(102, 98, `${t("scene.party")} A`, circle, "#5b7fa6")}${party(242, 98, `${t("scene.party")} B`, tri, "#3d8a7a")}
    ${party(102, 196, `${t("scene.party")} C`, square, "#c08a2e")}${party(242, 196, `${t("scene.party")} D`, star, "#8a5a8f")}
    <g class="thumbprint" opacity="0">
      <ellipse cx="330" cy="135" rx="14" ry="17" fill="#5b2e83" opacity=".85"/>
      <path d="M322 135 q8 -14 16 0 M319 140 q11 -22 22 0 M325 131 q5 -6 10 0" fill="none" stroke="#efe8f5" stroke-width="1.4" opacity=".7"/>
    </g>
  </g>
  <g transform="translate(330 134) rotate(32)">
    <g class="press">
      <rect x="30" y="-176" width="58" height="84" rx="10" fill="#0e6b45"/>
      <rect x="30" y="-104" width="58" height="16" rx="4" fill="#f4f1e8"/>
      <rect x="14" y="-98" width="70" height="62" rx="22" fill="#6e4127"/>
      <path d="M26 -72 h48 M24 -58 h50" stroke="#55301c" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>
      <rect x="-10" y="-52" width="22" height="50" rx="11" fill="#6e4127" transform="rotate(-24 1 -27)"/>
      <ellipse cx="0" cy="-6" rx="9" ry="7" fill="#5b2e83" transform="rotate(-24 0 -6)"/>
    </g>
  </g>
</svg>`;

// Scene 3: at a polling unit, a voter refuses money held out by a thug.
const note = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-22" y="-11" width="44" height="22" rx="2" fill="#4f9a6b" stroke="#2f6b47"/><circle r="6" fill="none" stroke="#d7f0df" stroke-width="1.5"/><rect x="-18" y="-7" width="8" height="3" fill="#d7f0df"/></g>`;

export const SCENE_REFUSE = t => `
<svg class="scene" viewBox="0 0 480 340" role="img" aria-labelledby="sr-t">
  <title id="sr-t">${t("scene.refuseAlt")}</title>
  <rect x="96" y="44" width="372" height="270" rx="14" fill="#ffffff" opacity=".08"/>
  <ellipse cx="240" cy="322" rx="215" ry="12" fill="rgba(0,0,0,.28)"/>
  <rect x="38" y="120" width="8" height="196" fill="#c6d0c8"/>
  <rect x="6" y="84" width="96" height="46" rx="6" fill="#ffffff"/>
  <text x="54" y="104" text-anchor="middle" font-family="Poppins, sans-serif" font-size="11" font-weight="600" fill="#00703f">${t("scene.pu")}</text>
  <text x="54" y="121" text-anchor="middle" font-family="Poppins, sans-serif" font-size="13" font-weight="700" fill="#16211b">004</text>

  <!-- Voter -->
  <g class="bob">
    <ellipse cx="146" cy="316" rx="13" ry="6" fill="#2a1d14"/><ellipse cx="176" cy="316" rx="13" ry="6" fill="#2a1d14"/>
    <rect x="140" y="262" width="42" height="52" fill="#3a4a5e"/>
    <path d="M122 152 Q161 138 200 152 L212 272 L110 272 Z" fill="#e9e4d6"/>
    <path d="M150 150 L161 186 L172 150" fill="none" stroke="#0e6b45" stroke-width="3"/>
    <rect x="152" y="128" width="18" height="18" rx="4" fill="#7b4a2d"/>
    <circle cx="161" cy="112" r="24" fill="#7b4a2d"/>
    <circle cx="154" cy="111" r="2.6" fill="#1a110b"/><circle cx="170" cy="111" r="2.6" fill="#1a110b"/>
    <path d="M153 125 h16" stroke="#1a110b" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M139 96 Q140 80 161 78 Q182 80 183 96 Z" fill="#0e6b45"/>
    <path d="M196 160 L236 150 L240 162 L202 176 Z" fill="#e9e4d6"/>
    <g transform="translate(246 148)"><rect x="-8" y="-24" width="20" height="34" rx="9" fill="#7b4a2d"/>
      <path d="M-4 -22 v-10 M2 -24 v-12 M8 -23 v-10" stroke="#7b4a2d" stroke-width="5" stroke-linecap="round"/></g>
  </g>

  <!-- Thug offering money -->
  <g class="bob b2">
    <ellipse cx="356" cy="316" rx="14" ry="6" fill="#141414"/><ellipse cx="390" cy="316" rx="14" ry="6" fill="#141414"/>
    <rect x="350" y="258" width="46" height="56" fill="#3a4048"/>
    <path d="M326 150 Q373 134 420 150 L430 266 L316 266 Z" fill="#69727d"/>
    <path d="M352 150 Q373 166 394 150" fill="none" stroke="#8b949e" stroke-width="6"/>
    <rect x="364" y="126" width="18" height="18" rx="4" fill="#5c3620"/>
    <circle cx="373" cy="110" r="24" fill="#5c3620"/>
    <rect x="356" y="102" width="34" height="11" rx="5" fill="#111"/>
    <path d="M364 124 q9 -4 18 0" fill="none" stroke="#1a110b" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M349 98 Q350 80 373 78 Q396 80 397 98 Z" fill="#b42318"/><rect x="390" y="92" width="22" height="7" rx="3" fill="#b42318"/>
    <g class="offer">
      <path d="M330 166 L290 176 L292 190 L334 182 Z" fill="#69727d"/>
      <circle cx="286" cy="182" r="10" fill="#5c3620"/>
      ${note(270, 168, -18)}${note(266, 178, -4)}${note(270, 190, 10)}
      <g class="refuse" opacity="0">
        <circle cx="268" cy="180" r="34" fill="none" stroke="#e5484d" stroke-width="7"/>
        <path d="M244 156 L292 204" stroke="#e5484d" stroke-width="7" stroke-linecap="round"/>
      </g>
    </g>
  </g>
</svg>`;
