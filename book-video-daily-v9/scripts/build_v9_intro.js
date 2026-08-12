const fs = require("fs");
const path = require("path");

const revisionDir = path.resolve(process.argv[2] || process.cwd());
const projectDir = path.join(revisionDir, "hyperframes");
const assetDir = path.join(projectDir, "assets");
const skillDir = path.resolve(__dirname, "..");
const config = JSON.parse(
  fs.readFileSync(path.join(revisionDir, "intro-config.json"), "utf8")
);
const manifest = JSON.parse(
  fs.readFileSync(path.join(revisionDir, "cover-manifest.json"), "utf8")
);
const books = manifest.covers;
const duration = 4.8;
const narrationDuration = Number(config.narration_duration_seconds);
const teaserEnd = 0.1;
const hookEnd = 2.76;
const cutoutStart = teaserEnd;
const revealStart = 2.47;
const revealEnd = 3.33;
const coverSfxStart = 2.59;
const coverStart = 3.45;
const coverStep = 0.13;
const current = books[books.length - 1];

function chineseCharacters(value) {
  return Array.from(String(value).match(/\p{Script=Han}/gu) || []);
}

function splitHook(value) {
  const text = String(value).trim();
  const separator = text.search(/[，,:：；;]/u);
  if (separator >= 0) {
    return [text.slice(0, separator + 1), text.slice(separator + 1).trim()];
  }
  const characters = Array.from(text);
  const midpoint = Math.ceil(characters.length / 2);
  return [characters.slice(0, midpoint).join(""), characters.slice(midpoint).join("")];
}

const openingHook = String(config.opening_hook || "").trim();
const keyword = String(config.keyword || "").trim();
const introNarration = String(config.intro_narration_text || "").trim();
const runDir = path.resolve(config.run_dir || path.join(revisionDir, "..", ".."));
const approvedHook = fs.readFileSync(path.join(runDir, "opening-hook-approved.txt"), "utf8").trim();
const approvedKeyword = fs.readFileSync(path.join(runDir, "opening-keyword-approved.txt"), "utf8").trim();
const approvedIntroNarration = fs.readFileSync(path.join(runDir, "intro-script-approved.txt"), "utf8").trim();
const state = JSON.parse(fs.readFileSync(path.join(runDir, "state.json"), "utf8"));
const hookCharacters = chineseCharacters(openingHook);
const keywordCharacters = chineseCharacters(keyword);
if (hookCharacters.length < 1 || hookCharacters.length > 20) {
  throw new Error(`opening_hook must contain 1-20 Chinese characters; found ${hookCharacters.length}`);
}
if (keywordCharacters.length !== 2 || keywordCharacters.join("") !== keyword) {
  throw new Error("keyword must be exactly two Chinese characters with no punctuation or spaces");
}
if (openingHook !== approvedHook || keyword !== approvedKeyword) {
  throw new Error("intro-config.json must match both locked opening approval files verbatim");
}
if (
  state?.confirmations?.opening_hook?.status !== "approved" ||
  state?.confirmations?.opening_keyword?.status !== "approved"
) {
  throw new Error("state.json must record both opening confirmations as approved");
}
if (introNarration !== approvedIntroNarration || !introNarration.startsWith(openingHook)) {
  throw new Error("intro_narration_text must match intro-script-approved.txt and start with the approved opening_hook verbatim");
}
if (!Number.isFinite(narrationDuration) || narrationDuration <= 0 || narrationDuration > duration) {
  throw new Error("narration_duration_seconds must be greater than 0 and no more than 4.8");
}
if (!Array.isArray(books) || books.length !== 8 || !current || !current.current) {
  throw new Error("cover-manifest.json must contain exactly 8 covers with the current book last");
}
const [hookLead, hookBody] = splitHook(openingHook);
const scene1File = path.resolve(revisionDir, config.scene_1_file || "scene-01.png");
const scene2File = path.resolve(revisionDir, config.scene_2_file || "scene-02.png");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function coverFile(index) {
  return `cover-${String(index + 1).padStart(2, "0")}.png`;
}

fs.mkdirSync(assetDir, { recursive: true });
fs.copyFileSync(
  path.join(skillDir, "assets", "hyperframes", "approved-intro-v7", "gsap.min.js"),
  path.join(assetDir, "gsap.min.js")
);
for (let index = 0; index < books.length; index += 1) {
  fs.copyFileSync(
    path.join(revisionDir, "covers", coverFile(index)),
    path.join(assetDir, coverFile(index))
  );
  fs.copyFileSync(
    path.join(revisionDir, "covers", coverFile(index)),
    path.join(assetDir, `cover-bg-${String(index + 1).padStart(2, "0")}.png`)
  );
}
fs.copyFileSync(
  path.join(revisionDir, "audio", "intro-narration.wav"),
  path.join(assetDir, "intro-narration.wav")
);
fs.copyFileSync(
  path.join(revisionDir, "audio", "cover-ratchet.wav"),
  path.join(assetDir, "cover-ratchet.wav")
);
fs.copyFileSync(
  scene2File,
  path.join(assetDir, "scene-02.png")
);
fs.copyFileSync(
  scene1File,
  path.join(assetDir, "teaser-background.png")
);
fs.copyFileSync(
  path.join(revisionDir, "current-lock-frame.png"),
  path.join(assetDir, "current-lock-frame.png")
);

const coverSlides = books.map((book, index) => {
  const src = coverFile(index);
  const backgroundSrc = `cover-bg-${String(index + 1).padStart(2, "0")}.png`;
  const currentClass = book.current ? " current" : "";
  const meta = book.current
    ? `<div class="locked-meta"><div class="locked-title" data-layout-allow-occlusion>《${escapeHtml(book.title)}》</div><div class="locked-author" data-layout-allow-occlusion>${escapeHtml(book.author)} / 著</div></div>`
    : "";
  return `        <section class="cover-slide${currentClass}" data-cover-index="${index}" data-layout-allow-overlap data-layout-allow-overflow>
          <img class="cover-blur" src="assets/${backgroundSrc}" alt="" />
          <div class="cover-veil"></div>
          ${meta}
          <div class="cover-card-wrap"><img class="cover-card" src="assets/${src}" alt="" /></div>
        </section>`;
}).join("\n");

const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Brush Hook Recent 8 Intro</title>
    <script src="assets/gsap.min.js"></script>
    <style>
      @font-face { font-family:"PingFang SC"; src:local("PingFang SC"); font-weight:100 900; }
      @font-face { font-family:"Kaiti SC"; src:local("Kaiti SC"); font-weight:400 900; }
      @font-face { font-family:"Microsoft YaHei"; src:local("Microsoft YaHei"); font-weight:100 900; }
      @font-face { font-family:"STKaiti"; src:local("STKaiti"); font-weight:400 900; }
      @font-face { font-family:"Songti SC"; src:local("Songti SC"); font-weight:400 900; }
      * { box-sizing:border-box; }
      html, body { width:1080px; height:1920px; margin:0; overflow:hidden; background:#000; }
      body { color:#fff; font-family:"PingFang SC","Microsoft YaHei",sans-serif; }
      #brush-hook-recent-8 { position:relative; width:1080px; height:1920px; overflow:hidden; isolation:isolate; background:#000; }
      .frame-fill { position:absolute; inset:0; width:100%; height:100%; }
      .cutout-stage { z-index:12; overflow:hidden; background:#000; opacity:0; visibility:hidden; }
      .cutout-background { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
      .cutout-overlay { position:absolute; inset:0; width:1080px; height:1920px; overflow:visible; }
      #glyph-reveal { font-family:"Kaiti SC","STKaiti","Songti SC",serif; font-size:390px; font-weight:900; letter-spacing:0; }
      .teaser-stage { z-index:18; overflow:hidden; background:#d9edf0; opacity:0; visibility:hidden; }
      .teaser-stage img { width:100%; height:100%; object-fit:cover; }
      .teaser-meta { position:absolute; left:54px; top:126px; width:972px; text-align:center; color:#171410; text-shadow:0 2px 0 rgba(255,255,255,.88),0 0 4px rgba(255,255,255,.75); }
      .teaser-title { font-size:66px; font-weight:850; line-height:1.15; letter-spacing:0; }
      .teaser-author { margin-top:14px; font-size:34px; font-weight:700; line-height:1.2; letter-spacing:0; }
      .cover-stage { z-index:20; }
      .cover-slide { position:absolute; inset:0; opacity:0; visibility:hidden; overflow:hidden; background:#e9e8e2; }
      .cover-blur { position:absolute; inset:-90px; width:1260px; height:2100px; object-fit:cover; filter:blur(48px) saturate(.72) brightness(1.12); transform:scale(1.12); }
      .cover-veil { position:absolute; inset:0; background:rgba(240,240,235,.32); }
      .cover-card-wrap { position:absolute; left:220px; top:485px; width:640px; height:928px; display:flex; align-items:center; justify-content:center; filter:drop-shadow(0 28px 42px rgba(22,27,25,.34)); }
      .cover-card { display:block; width:588px; height:852px; object-fit:cover; border-radius:14px; box-shadow:0 0 0 2px rgba(255,255,255,.64),0 16px 38px rgba(0,0,0,.22); }
      .locked-meta { position:absolute; left:72px; top:238px; width:936px; z-index:5; text-align:center; color:#171410; opacity:0; }
      .locked-title { font-size:72px; font-weight:800; line-height:1.16; letter-spacing:0; text-shadow:0 2px 0 rgba(255,255,255,.75); }
      .locked-author { margin-top:18px; font-size:38px; font-weight:650; line-height:1.2; letter-spacing:0; }
      .hook-copy { position:absolute; inset:0; z-index:3; color:#fff; text-align:center; pointer-events:none; }
      .angle-copy { position:absolute; left:90px; top:382px; width:900px; font-family:"Kaiti SC","STKaiti","Songti SC",serif; font-size:52px; font-weight:700; line-height:1.42; letter-spacing:0; -webkit-text-stroke:1px rgba(0,0,0,.54); text-shadow:0 2px 8px rgba(0,0,0,.76); }
      .angle-copy .angle-lead { display:block; width:100%; font-size:58px; }
      .angle-copy .angle-body { display:block; width:100%; margin-top:10px; }
      .ripple-stage { z-index:30; opacity:0; visibility:hidden; pointer-events:none; overflow:hidden; }
      .ripple-ring { position:absolute; inset:-18px; background:url("assets/current-lock-frame.png") center/cover no-repeat; transform-origin:50% 54%; opacity:0; will-change:transform,opacity; filter:saturate(1.02) contrast(1.02); }
      .ripple-ring-1 { -webkit-mask-image:radial-gradient(circle at 50% 54%,#000 0 14%,rgba(0,0,0,.7) 15%,transparent 17%); mask-image:radial-gradient(circle at 50% 54%,#000 0 14%,rgba(0,0,0,.7) 15%,transparent 17%); }
      .ripple-ring-2 { -webkit-mask-image:radial-gradient(circle at 50% 54%,transparent 0 13%,rgba(0,0,0,.65) 14%,#000 16% 29%,rgba(0,0,0,.65) 30%,transparent 32%); mask-image:radial-gradient(circle at 50% 54%,transparent 0 13%,rgba(0,0,0,.65) 14%,#000 16% 29%,rgba(0,0,0,.65) 30%,transparent 32%); }
      .ripple-ring-3 { -webkit-mask-image:radial-gradient(circle at 50% 54%,transparent 0 27%,rgba(0,0,0,.65) 28%,#000 30% 45%,rgba(0,0,0,.65) 46%,transparent 48%); mask-image:radial-gradient(circle at 50% 54%,transparent 0 27%,rgba(0,0,0,.65) 28%,#000 30% 45%,rgba(0,0,0,.65) 46%,transparent 48%); }
      .ripple-ring-4 { -webkit-mask-image:radial-gradient(circle at 50% 54%,transparent 0 43%,rgba(0,0,0,.65) 44%,#000 46% 63%,rgba(0,0,0,.65) 64%,transparent 66%); mask-image:radial-gradient(circle at 50% 54%,transparent 0 43%,rgba(0,0,0,.65) 44%,#000 46% 63%,rgba(0,0,0,.65) 64%,transparent 66%); }
      .ripple-ring-5 { -webkit-mask-image:radial-gradient(circle at 50% 54%,transparent 0 61%,rgba(0,0,0,.65) 62%,#000 64% 81%,rgba(0,0,0,.65) 82%,transparent 84%); mask-image:radial-gradient(circle at 50% 54%,transparent 0 61%,rgba(0,0,0,.65) 62%,#000 64% 81%,rgba(0,0,0,.65) 82%,transparent 84%); }
      .ripple-ring-6 { -webkit-mask-image:radial-gradient(circle at 50% 54%,transparent 0 79%,rgba(0,0,0,.65) 80%,#000 82% 105%); mask-image:radial-gradient(circle at 50% 54%,transparent 0 79%,rgba(0,0,0,.65) 80%,#000 82% 105%); }
      audio { display:none; }
    </style>
  </head>
  <body>
    <main id="brush-hook-recent-8" data-template-version="approved-v7" data-composition-id="brush-hook-recent-8" data-width="1080" data-height="1920" data-start="0" data-duration="${duration.toFixed(6)}">
      <div class="frame-fill teaser-stage" data-layout-allow-overflow><img src="assets/teaser-background.png" alt="" /><div class="teaser-meta"><div class="teaser-title">《${escapeHtml(current.title)}》</div><div class="teaser-author">${escapeHtml(current.author)} / 著</div></div></div>
      <div class="frame-fill cutout-stage" data-layout-allow-overflow>
        <img class="cutout-background" src="assets/scene-02.png" alt="" />
        <svg class="cutout-overlay" viewBox="0 0 1080 1920" preserveAspectRatio="none" aria-hidden="true" data-layout-ignore>
          <defs>
            <mask id="brush-hook-recent-8-glyph-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1920">
              <rect x="0" y="0" width="1080" height="1920" fill="#fff" />
              <text id="glyph-reveal" x="540" y="1090" text-anchor="middle" fill="#000">${escapeHtml(keyword)}</text>
              <rect id="reveal-up" x="0" y="960" width="1080" height="0" fill="#000" />
              <rect id="reveal-down" x="0" y="960" width="1080" height="0" fill="#000" />
            </mask>
          </defs>
          <rect class="black-mask" x="0" y="0" width="1080" height="1920" fill="#000" mask="url(#brush-hook-recent-8-glyph-mask)" />
        </svg>
        <div class="hook-copy" data-layout-allow-overlap>
        <div class="angle-copy" data-opening-hook="${escapeHtml(openingHook)}" data-layout-allow-occlusion><span class="angle-lead">${escapeHtml(hookLead)}</span><span class="angle-body">${escapeHtml(hookBody)}</span></div>
        </div>
      </div>
      <div class="frame-fill cover-stage" data-layout-allow-overlap>
${coverSlides}
      </div>
      <div class="frame-fill ripple-stage" data-layout-ignore>
        <div class="ripple-ring ripple-ring-1"></div>
        <div class="ripple-ring ripple-ring-2"></div>
        <div class="ripple-ring ripple-ring-3"></div>
        <div class="ripple-ring ripple-ring-4"></div>
        <div class="ripple-ring ripple-ring-5"></div>
        <div class="ripple-ring ripple-ring-6"></div>
      </div>
      <audio id="intro-narration" src="assets/intro-narration.wav" data-start="0" data-duration="${narrationDuration.toFixed(6)}" data-track-index="20" data-volume="1"></audio>
      <audio id="cover-ratchet" src="assets/cover-ratchet.wav" data-start="${coverSfxStart.toFixed(2)}" data-duration="2.200000" data-track-index="21" data-volume="1"></audio>
    </main>
    <script>
      window.__timelines = window.__timelines || {};
      (function () {
        var tl = gsap.timeline({ paused:true });
        tl.set(".cutout-stage", { autoAlpha:0 }, 0);
        tl.set(".teaser-stage", { autoAlpha:1 }, 0);
        tl.set(".teaser-stage", { autoAlpha:0 }, ${teaserEnd.toFixed(2)});
        tl.set(".cutout-stage", { autoAlpha:1 }, ${cutoutStart.toFixed(2)});
        tl.fromTo(".teaser-stage img", { scale:1 }, { scale:1.003, duration:${teaserEnd.toFixed(2)}, ease:"none" }, 0);
        tl.fromTo(".cutout-background", { scale:1 }, { scale:1.015, duration:${(coverStart - cutoutStart).toFixed(2)}, ease:"none" }, ${cutoutStart.toFixed(2)});
        tl.fromTo("#reveal-up", { attr:{ y:960, height:0 } }, { attr:{ y:48, height:912 }, duration:${(revealEnd - revealStart).toFixed(2)}, ease:"none" }, ${revealStart.toFixed(2)});
        tl.fromTo("#reveal-down", { attr:{ y:960, height:0 } }, { attr:{ y:960, height:912 }, duration:${(revealEnd - revealStart).toFixed(2)}, ease:"none" }, ${revealStart.toFixed(2)});
        tl.to(".angle-copy", { autoAlpha:0, duration:.36, ease:"power1.in" }, ${(revealEnd - 0.36).toFixed(2)});
        tl.set(".cutout-overlay", { autoAlpha:0 }, ${revealEnd.toFixed(2)});
        tl.set(".cover-slide", { autoAlpha:0 }, ${coverStart.toFixed(2)});
${books.map((book, index) => {
  const at = coverStart + index * coverStep;
  const selector = `.cover-slide[data-cover-index="${index}"]`;
  const previous = index > 0 ? `.cover-slide[data-cover-index="${index - 1}"]` : null;
  const lines = [];
  if (previous) lines.push(`        tl.set('${previous}', { autoAlpha:0 }, ${at.toFixed(2)});`);
  lines.push(`        tl.set('${selector}', { autoAlpha:1 }, ${at.toFixed(2)});`);
  lines.push(`        tl.fromTo('${selector} .cover-card-wrap', { scale:1.055, y:14 }, { scale:1, y:0, duration:.11, ease:"power2.out" }, ${at.toFixed(2)});`);
  lines.push(`        tl.fromTo('${selector} .cover-blur', { scale:1.16 }, { scale:1.12, duration:.12, ease:"power1.out" }, ${at.toFixed(2)});`);
  return lines.join("\n");
}).join("\n")}
        tl.fromTo(".current .locked-meta", { opacity:0, y:-14 }, { opacity:1, y:0, duration:.26, ease:"power2.out" }, ${(coverStart + (books.length - 1) * coverStep + 0.04).toFixed(2)});
        tl.to(".current .cover-card-wrap", { scale:1.018, duration:.22, ease:"back.out(1.8)" }, ${(coverStart + (books.length - 1) * coverStep + 0.02).toFixed(2)});
        tl.to(".current .cover-card-wrap", { scale:1, duration:.24, ease:"power2.out" }, ${(coverStart + (books.length - 1) * coverStep + 0.24).toFixed(2)});
        tl.set(".ripple-stage", { autoAlpha:1 }, 4.36);
        tl.fromTo(".ripple-ring-1", { autoAlpha:0, scale:1 }, { autoAlpha:.9, scale:1.05, duration:.06, ease:"power2.out" }, 4.36);
        tl.to(".ripple-ring-1", { scale:.986, duration:.06, ease:"sine.inOut" }, 4.43);
        tl.to(".ripple-ring-1", { autoAlpha:0, scale:1, duration:.16, ease:"power2.out" }, 4.50);
        tl.fromTo(".ripple-ring-2", { autoAlpha:0, scale:1 }, { autoAlpha:.86, scale:.958, duration:.06, ease:"power2.out" }, 4.40);
        tl.to(".ripple-ring-2", { scale:1.026, duration:.06, ease:"sine.inOut" }, 4.47);
        tl.to(".ripple-ring-2", { autoAlpha:0, scale:1, duration:.16, ease:"power2.out" }, 4.54);
        tl.fromTo(".ripple-ring-3", { autoAlpha:0, scale:1 }, { autoAlpha:.82, scale:1.035, duration:.06, ease:"power2.out" }, 4.44);
        tl.to(".ripple-ring-3", { scale:.977, duration:.06, ease:"sine.inOut" }, 4.51);
        tl.to(".ripple-ring-3", { autoAlpha:0, scale:1, duration:.16, ease:"power2.out" }, 4.58);
        tl.fromTo(".ripple-ring-4", { autoAlpha:0, scale:1 }, { autoAlpha:.78, scale:.968, duration:.06, ease:"power2.out" }, 4.48);
        tl.to(".ripple-ring-4", { scale:1.022, duration:.06, ease:"sine.inOut" }, 4.55);
        tl.to(".ripple-ring-4", { autoAlpha:0, scale:1, duration:.16, ease:"power2.out" }, 4.62);
        tl.fromTo(".ripple-ring-5", { autoAlpha:0, scale:1 }, { autoAlpha:.74, scale:1.027, duration:.06, ease:"power2.out" }, 4.52);
        tl.to(".ripple-ring-5", { scale:.982, duration:.06, ease:"sine.inOut" }, 4.59);
        tl.to(".ripple-ring-5", { autoAlpha:0, scale:1, duration:.16, ease:"power2.out" }, 4.66);
        tl.fromTo(".ripple-ring-6", { autoAlpha:0, scale:1 }, { autoAlpha:.7, scale:.975, duration:.06, ease:"power2.out" }, 4.56);
        tl.to(".ripple-ring-6", { scale:1.018, duration:.06, ease:"sine.inOut" }, 4.63);
        tl.to(".ripple-ring-6", { autoAlpha:0, scale:1, duration:.10, ease:"power2.out" }, 4.70);
        tl.set(".ripple-stage", { autoAlpha:0 }, 4.80);
        window.__timelines["brush-hook-recent-8"] = tl;
      })();
    </script>
  </body>
</html>`;

const motion = {
  duration,
  assertions: [
    { kind: "appearsBy", selector: ".cutout-stage", bySec: 0.15 },
    { kind: "appearsBy", selector: ".current", bySec: 4.41 },
    { kind: "appearsBy", selector: ".current .locked-meta", bySec: 4.51 },
    { kind: "staysInFrame", selector: ".current .cover-card-wrap" }
  ]
};

const design = `# Sequence Remap + Ripple Waves Intro V7 Locked Template\n\n- Approved opening hook: ${openingHook}\n- Approved two-character keyword: ${keyword}\n- Full intro narration: ${introNarration}\n- Sequences 1-2: exact daily scene-1 image.\n- Sequences 3-4: exact daily scene-2 image, visible only through the approved keyword glyphs.\n- Sequences 5-12: a clean horizontal reveal expands upward and downward from the exact frame center, with no colored edge or fiber decoration.\n- Sequence 13: the mask is removed at ${revealEnd.toFixed(2)}s and the complete unfiltered scene-2 image is visible.\n- Sequences 14-21: latest 8 verified covers rotate once each; the current book locks at sequence 21.\n- Sequences 21-23: Ripple Waves uses six concentric annular samples with alternating displacement, traveling from the center outward and settling before the body entry.\n- Sequence 24: body starts through the one-frame transition.\n- Canvas: 1080x1920, 30fps. Intro duration: ${duration.toFixed(3)}s; body transition: one frame (0.033s).\n`;

fs.writeFileSync(path.join(projectDir, "index.html"), html);
fs.writeFileSync(path.join(projectDir, "index.motion.json"), JSON.stringify(motion, null, 2) + "\n");
fs.writeFileSync(path.join(projectDir, "DESIGN.md"), design);
