const fs = require("fs");
const path = require("path");

const revisionDir = path.resolve(process.argv[2] || process.cwd());
const projectDir = path.join(revisionDir, "hyperframes");
const assetDir = path.join(projectDir, "assets");
const config = JSON.parse(fs.readFileSync(path.join(revisionDir, "body-config.json"), "utf8"));
const runDir = path.resolve(config.run_dir || path.join(revisionDir, "..", ".."));
const duration = Number(config.duration_seconds);
const captions = config.captions;
const sceneInput = config.scenes;
const vectors = [
  { from:{s:1.038,x:-8,y:0}, to:{s:1.016,x:8,y:0} },
  { from:{s:1.034,x:6,y:0}, to:{s:1.014,x:-6,y:0} },
  { from:{s:1.032,x:-4,y:2}, to:{s:1.014,x:5,y:-2} },
  { from:{s:1.034,x:-5,y:0}, to:{s:1.01,x:4,y:0} },
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalized(value) {
  return String(value).replace(/\s+/gu, "");
}

if (!Number.isFinite(duration) || duration <= 2) throw new Error("duration_seconds must be greater than 2");
if (!config.book_title || !config.author) throw new Error("book_title and author are required");
if (!Array.isArray(captions) || captions.length === 0) throw new Error("captions must be a non-empty array");
if (!Array.isArray(sceneInput) || sceneInput.length !== 4) throw new Error("exactly four scenes are required");
for (let index = 0; index < captions.length; index += 1) {
  const item = captions[index];
  if (!item.id || !item.text || !Number.isFinite(item.start) || !Number.isFinite(item.end) || item.start < 0 || item.end <= item.start || item.end > duration) {
    throw new Error(`invalid caption at index ${index}`);
  }
  if (index > 0 && item.start < captions[index - 1].end) throw new Error("captions must be monotonic and non-overlapping");
}
for (let index = 0; index < sceneInput.length; index += 1) {
  const item = sceneInput[index];
  if (!item.label || !Number.isFinite(item.start) || !Number.isFinite(item.end) || item.end <= item.start) throw new Error(`invalid scene at index ${index}`);
  if (index === 0 && item.start !== 0) throw new Error("scene 1 must start at 0");
  if (index > 0 && Math.abs(item.start - sceneInput[index - 1].end) > 0.001) throw new Error("scene boundaries must be contiguous");
}
if (Math.abs(sceneInput[3].end - duration) > 0.001) throw new Error("scene 4 must end at duration_seconds");

const approvedScript = fs.readFileSync(path.join(runDir, "script-approved.txt"), "utf8");
if (normalized(captions.map((item) => item.text).join("")) !== normalized(approvedScript)) {
  throw new Error("caption text must concatenate exactly to script-approved.txt");
}

const backgrounds = config.background_files || ["background-01.png", "background-02.png", "background-03.png", "background-04.png"];
if (!Array.isArray(backgrounds) || backgrounds.length !== 4) throw new Error("exactly four background_files are required");
const audioFile = path.resolve(revisionDir, config.audio_file || "final-mix.wav");
fs.mkdirSync(assetDir, { recursive:true });
for (let index = 0; index < 4; index += 1) {
  fs.copyFileSync(path.resolve(revisionDir, backgrounds[index]), path.join(assetDir, `background-0${index + 1}.png`));
}
fs.copyFileSync(audioFile, path.join(assetDir, "final-mix.wav"));

const scenes = sceneInput.map((item, index) => ({
  id:`scene-0${index + 1}`,
  label:item.label,
  start:item.start,
  end:item.end,
  from:vectors[index].from,
  to:vectors[index].to,
}));
const sceneSections = scenes.map((item, index) => `      <section id="${item.id}" class="scene" aria-label="${escapeHtml(item.label)}" data-layout-allow-overlap><div class="scene-image" data-layout-allow-overflow><img src="assets/background-0${index + 1}.png" alt="" /></div><div class="scene-wash" data-layout-ignore></div><div class="warm-haze" data-layout-ignore></div><div class="grain" data-layout-ignore></div></section>`).join("\n");
const captionNodes = captions.map((item) => `        <div id="cg-${escapeHtml(item.id)}" class="caption-group"><div class="caption-panel"><p class="caption-text">${escapeHtml(item.text)}</p></div></div>`).join("\n");
const captionJson = JSON.stringify(captions, null, 2);
const sceneJson = JSON.stringify(scenes, null, 2);

const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>《${escapeHtml(config.book_title)}》｜${escapeHtml(config.author)}/著</title>
    <style>
      @font-face { font-family:"PingFang SC"; src:local("PingFang SC"); font-style:normal; font-weight:100 900; }
      @font-face { font-family:"Microsoft YaHei"; src:local("Microsoft YaHei"); font-style:normal; font-weight:100 900; }
      :root { --ink:#171410; --ivory:#F7F0E3; --bronze:#B88949; --jade:#5E7F75; --earth:#9A5D3F; --paper:#E8DDCA; }
      * { box-sizing:border-box; }
      html, body { width:1080px; height:1920px; margin:0; overflow:hidden; background-color:var(--ink); }
      body { color:var(--ivory); font-family:"PingFang SC","Microsoft YaHei",sans-serif; }
      #book-video { position:relative; width:1080px; height:1920px; overflow:hidden; isolation:isolate; background-color:var(--ink); }
      .scene { position:absolute; inset:0; width:1080px; height:1920px; overflow:hidden; background-color:var(--ink); transform-origin:50% 50%; will-change:transform,opacity,filter; }
      #scene-01 { z-index:1; } #scene-02 { z-index:2; opacity:0; } #scene-03 { z-index:3; opacity:0; } #scene-04 { z-index:4; opacity:0; }
      .scene-image { position:absolute; inset:0; width:1080px; height:1920px; transform-origin:50% 50%; will-change:transform,opacity,filter; }
      .scene-image img { display:block; width:100%; height:100%; object-fit:cover; object-position:50% 50%; }
      .scene-wash { position:absolute; inset:0; opacity:0; pointer-events:none; background:radial-gradient(ellipse 920px 640px at 50% 22%,rgba(23,20,16,.16) 0%,rgba(23,20,16,.06) 46%,rgba(23,20,16,0) 76%),linear-gradient(180deg,rgba(23,20,16,.02) 0%,rgba(23,20,16,0) 42%,rgba(23,20,16,.16) 72%,rgba(23,20,16,.52) 100%); will-change:opacity; }
      .warm-haze { position:absolute; inset:0; opacity:.05; pointer-events:none; mix-blend-mode:screen; background:radial-gradient(circle at 50% 22%,rgba(247,240,227,.24) 0%,rgba(184,137,73,.15) 32%,rgba(94,127,117,.08) 56%,rgba(184,137,73,0) 78%); }
      .grain { position:absolute; inset:0; opacity:.022; mix-blend-mode:soft-light; pointer-events:none; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.68' numOctaves='3' seed='2031' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.42'/%3E%3C/svg%3E"); }
      #light-leak-layer { position:absolute; inset:-420px -1200px; z-index:6; opacity:0; pointer-events:none; background:radial-gradient(circle at 46% 50%,rgba(247,240,227,.22) 0%,rgba(184,137,73,.15) 23%,rgba(232,221,202,.08) 48%,rgba(184,137,73,0) 72%); transform-origin:50% 50%; will-change:transform,opacity; }
      #book-identity { position:absolute; top:286px; right:54px; left:54px; z-index:8; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; width:972px; pointer-events:none; text-align:center; }
      #book-identity::before { display:none; content:none; }
      .identity-title { display:block; width:100%; max-width:972px; margin:0; overflow:visible; color:#fff; font-size:104px; font-weight:900; letter-spacing:0; line-height:1.12; white-space:nowrap; -webkit-text-stroke:6px #000; paint-order:stroke fill; text-shadow:none; will-change:transform,opacity; }
      .identity-author { max-width:972px; margin:24px 0 0; color:#fff; font-size:52px; font-weight:800; letter-spacing:0; line-height:1.2; -webkit-text-stroke:3px #000; paint-order:stroke fill; text-shadow:none; will-change:transform,opacity; }
      #caption-layer { position:absolute; inset:0; z-index:10; pointer-events:none; }
      .caption-group { position:absolute; top:1300px; right:72px; left:72px; display:flex; align-items:center; justify-content:center; width:936px; height:260px; overflow:visible; opacity:0; visibility:hidden; transform-origin:50% 60%; will-change:transform,opacity; }
      .caption-panel { display:flex; align-items:center; justify-content:center; width:100%; max-height:238px; min-height:150px; padding:0; overflow:visible; border:0; border-radius:0; background:none; box-shadow:none; backdrop-filter:none; }
      .caption-text { max-width:936px; max-height:190px; margin:0; overflow:visible; color:#fff; font-size:54px; font-weight:700; letter-spacing:0; line-height:1.34; text-align:center; text-wrap:balance; -webkit-text-stroke:4px #000; paint-order:stroke fill; text-shadow:none; }
      #end-fade { position:absolute; inset:0; z-index:20; opacity:0; pointer-events:none; background-color:var(--ink); will-change:opacity; }
    </style>
  </head>
  <body>
    <main id="book-video" data-template-version="golden-final-v9-body" data-composition-id="book-video" data-width="1080" data-height="1920" data-fps="30" data-start="0" data-duration="${duration.toFixed(6)}" data-timing-status="final-audio-aligned">
${sceneSections}
      <div id="light-leak-layer" data-layout-ignore></div>
      <header id="book-identity" data-layout-allow-occlusion><h1 class="identity-title">《${escapeHtml(config.book_title)}》</h1><p class="identity-author">${escapeHtml(config.author)}/著</p></header>
      <div id="caption-layer" data-layout-allow-occlusion>
${captionNodes}
      </div>
      <audio id="final-mix-audio" src="assets/final-mix.wav" data-start="0" data-duration="${duration.toFixed(6)}" data-track-index="1" data-volume="1"></audio>
      <div id="end-fade" data-layout-ignore></div>
    </main>
    <script>
      window.__timelines = window.__timelines || {};
      (function () {
        var DURATION = ${duration.toFixed(6)};
        var CAPTIONS = ${captionJson};
        var SCENES = ${sceneJson};
        var LIGHT_LEAK_START = DURATION * 0.703167417;
        function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
        function mix(a, b, p) { return a + (b - a) * p; }
        function smooth(p) { p = clamp(p, 0, 1); return p * p * (3 - 2 * p); }
        function fitIdentityTitle() { var el = document.querySelector(".identity-title"); if (!el) return; var size = 104; if (window.__hyperframes && window.__hyperframes.fitTextFontSize) { var fit = window.__hyperframes.fitTextFontSize(el.textContent, { fontFamily:"PingFang SC, Microsoft YaHei, sans-serif", fontWeight:900, maxWidth:948, baseFontSize:104, minFontSize:16, step:1 }); size = fit.fontSize; } else { size = Math.min(104, Math.floor(948 / Math.max(1, el.textContent.length))); } el.style.fontSize = size + "px"; el.dataset.fittedFontSize = String(size); }
        function setStyle(selector, props) { var el = document.querySelector(selector); if (!el) return; Object.keys(props).forEach(function (key) { el.style[key] = props[key]; }); }
        function incomingOpacity(index, t) { var scene = SCENES[index]; if (index === 0) return t <= scene.end + 0.68 ? 1 : 0; if (t < scene.start) return 0; var p = smooth((t - scene.start - 0.08) / 0.68); if (t < scene.start + 0.76) return p; return t <= scene.end + 0.68 ? 1 : 0; }
        function applyScene(scene, index, t) { var run = Math.max(0.8, scene.end - scene.start); var p = smooth((t - scene.start - 0.1) / run); var scale = mix(scene.from.s, scene.to.s, p); var x = mix(scene.from.x, scene.to.x, p); var y = mix(scene.from.y, scene.to.y, p); var opacity = incomingOpacity(index, t); var blur = 0; if (index > 0 && t >= scene.start && t < scene.start + 0.76) blur = mix(22, 0, smooth((t - scene.start - 0.08) / 0.68)); if (index < SCENES.length - 1 && t >= scene.end && t < scene.end + 0.68) blur = mix(0, 22, smooth((t - scene.end) / 0.68)); if (t > scene.end && index < SCENES.length - 1) opacity = Math.max(0, 1 - smooth((t - scene.end) / 0.68)); setStyle("#" + scene.id, { opacity:String(clamp(opacity, 0, 1)), filter:"blur(" + blur.toFixed(2) + "px)", transform:"scale(" + (blur > 0 ? 1.02 : 1).toFixed(4) + ")" }); setStyle("#" + scene.id + " .scene-image", { transform:"translate(" + x.toFixed(2) + "px," + y.toFixed(2) + "px) scale(" + scale.toFixed(4) + ")" }); setStyle("#" + scene.id + " .scene-wash", { opacity:String(clamp((t - scene.start - 0.14) / 0.76, 0, 1)) }); }
        function applyCaption(caption, t) { var el = document.getElementById("cg-" + caption.id); if (!el) return; var opacity = 0, y = 0, scale = 1; if (t >= caption.start && t < caption.end) { var inP = smooth((t - caption.start) / 0.22); var outStart = Math.max(caption.start + 0.18, caption.end - 0.13); var outP = smooth((t - outStart) / 0.13); opacity = clamp(inP * (1 - outP), 0, 1); y = mix(18, -8, outP) * (1 - inP); scale = mix(0.985, 1, inP) - outP * 0.025; } el.style.visibility = opacity > 0.001 ? "visible" : "hidden"; el.style.opacity = String(opacity); el.style.transform = "translateY(" + y.toFixed(2) + "px) scale(" + scale.toFixed(4) + ")"; }
        function applyIdentity(t) { var titleP = smooth((t - 0.22) / 0.78); var authorP = smooth((t - 0.44) / 0.56); setStyle(".identity-title", { opacity:String(titleP), transform:"scale(" + mix(0.92, 1, titleP).toFixed(4) + ")" }); setStyle(".identity-author", { opacity:String(authorP), transform:"translateY(" + mix(22, 0, authorP).toFixed(2) + "px)" }); }
        function applyLightLeak(t) { var inP = smooth((t - LIGHT_LEAK_START) / 0.82); var outP = smooth((t - (LIGHT_LEAK_START + 1.06)) / 0.44); var opacity = clamp(inP * (1 - outP) * 0.075, 0, 0.075); var x = mix(-360, 220, inP); setStyle("#light-leak-layer", { opacity:String(opacity), transform:"translateX(" + x.toFixed(2) + "px) rotate(-5deg)" }); }
        function applyEndFade(t) { setStyle("#end-fade", { opacity:String(smooth((t - (DURATION - 0.414)) / 0.414)) }); }
        function apply(t) { t = clamp(Number(t) || 0, 0, DURATION); SCENES.forEach(function (scene, index) { applyScene(scene, index, t); }); CAPTIONS.forEach(function (caption) { applyCaption(caption, t); }); applyIdentity(t); applyLightLeak(t); applyEndFade(t); manualTimeline._time = t; }
        var manualTimeline = { _time:0, seek:function(t){apply(t);return this;}, time:function(t){if(arguments.length){apply(t);return this;}return this._time;}, render:function(t){apply(t);return this;}, pause:function(){return this;}, paused:function(){return true;}, duration:function(){return DURATION;}, totalDuration:function(){return DURATION;}, progress:function(p){if(arguments.length){apply(p*DURATION);return this;}return this._time/DURATION;} };
        fitIdentityTitle(); manualTimeline.seek(0); window.__timelines["book-video"] = manualTimeline;
      })();
    </script>
  </body>
</html>`;

const motion = {
  duration,
  assertions: [
    { kind:"appearsBy", selector:".identity-title", bySec:1.1 },
    { kind:"appearsBy", selector:".identity-author", bySec:1.2 },
    { kind:"staysInFrame", selector:"#book-identity" },
    { kind:"staysInFrame", selector:`#cg-${captions[0].id}` },
    { kind:"keepsMoving", withinSelector:"#book-video", maxStaticSec:2.2 },
  ],
};
const design = `# Golden Final V9 Body\n\n- Sole visual master: final-with-recent-8-intro-plain-single-line-title.mp4.\n- Daily title: 《${config.book_title}》. Author: ${config.author}/著.\n- Duration: ${duration.toFixed(3)}s. Four scenes. Caption timings come from approved monotonic alignment.\n- Layout, text treatment, scene vectors, 0.68s focus transitions, caption easing and 0.414s end fade are locked to the golden master.\n`;
fs.writeFileSync(path.join(projectDir, "index.html"), html);
fs.writeFileSync(path.join(projectDir, "index.motion.json"), JSON.stringify(motion, null, 2) + "\n");
fs.writeFileSync(path.join(projectDir, "DESIGN.md"), design);
