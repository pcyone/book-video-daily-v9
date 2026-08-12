const fs = require("fs");
const path = require("path");

if (!process.argv[2] || !process.argv[3] || !process.argv[4]) {
  throw new Error("Usage: node prepare_recent8.js /absolute/run /absolute/revision /absolute/current-cover.png");
}
const targetRunDir = path.resolve(process.argv[2]);
const revisionDir = path.resolve(process.argv[3]);
const targetCoverFile = path.resolve(process.argv[4]);
const runsDir = path.dirname(targetRunDir);
const targetRunId = path.basename(targetRunDir);

if (!fs.existsSync(targetCoverFile)) {
  throw new Error(`Current book cover does not exist: ${targetCoverFile}`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function findCurrentCover(runDir, runId) {
  const revisionsDir = path.join(runDir, "revisions");
  if (!fs.existsSync(revisionsDir)) return null;
  const candidates = fs.readdirSync(revisionsDir)
    .filter((name) => fs.statSync(path.join(revisionsDir, name)).isDirectory())
    .filter((name) => fs.existsSync(path.join(revisionsDir, name, "cover-manifest.json")))
    .sort((a, b) => fs.statSync(path.join(revisionsDir, b)).mtimeMs - fs.statSync(path.join(revisionsDir, a)).mtimeMs);
  for (const name of candidates) {
    const sourceDir = path.join(revisionsDir, name);
    const manifestFile = path.join(sourceDir, "cover-manifest.json");
    if (!fs.existsSync(manifestFile)) continue;
    const manifest = readJson(manifestFile);
    const covers = manifest.covers || manifest;
    const index = covers.findIndex((item) => item.run_id === runId);
    const fallbackIndex = covers.findIndex((item) => item.current === true);
    const chosenIndex = index >= 0 ? index : fallbackIndex;
    if (chosenIndex < 0) continue;
    const local = path.join(sourceDir, "covers", `cover-${String(chosenIndex + 1).padStart(2, "0")}.png`);
    if (fs.existsSync(local)) {
      return { metadata: covers[chosenIndex], local };
    }
  }
  return null;
}

const historical = fs.readdirSync(runsDir)
  .filter((runId) => runId !== targetRunId)
  .map((runId) => {
    const runDir = path.join(runsDir, runId);
    const stateFile = path.join(runDir, "state.json");
    if (!fs.existsSync(stateFile)) return null;
    const state = readJson(stateFile);
    if (state.status !== "done" && state.stage !== "done") return null;
    const cover = findCurrentCover(runDir, runId);
    if (!cover) return null;
    const selection = state.selection || state.book || {};
    return {
      runId,
      runDir,
      completedAt: state.completed_at || state.updated_at || runId,
      title: selection.display_title || selection.title || cover.metadata.title,
      author: selection.display_author || selection.author || cover.metadata.author,
      coverUrl: cover.metadata.cover_url || null,
      coverFile: cover.local,
    };
  })
  .filter(Boolean)
  .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
  .slice(0, 7);

if (historical.length !== 7) {
  throw new Error(`Need 7 historical verifiable covers before the current book; found ${historical.length}`);
}

const targetState = readJson(path.join(targetRunDir, "state.json"));
const targetSelection = targetState.selection || targetState.book || {};
const target = {
  runId: targetRunId,
  runDir: targetRunDir,
  completedAt: targetState.updated_at || new Date().toISOString(),
  title: targetSelection.display_title || targetSelection.title,
  author: targetSelection.display_author || targetSelection.author,
  coverUrl: targetSelection.cover_url || null,
  coverFile: targetCoverFile,
};
if (!target.title || !target.author) {
  throw new Error("Current run state.json must contain the selected title and author");
}

const ordered = historical.sort((a, b) => a.completedAt.localeCompare(b.completedAt));
ordered.push(target);

const coversDir = path.join(revisionDir, "covers");
fs.mkdirSync(coversDir, { recursive: true });
const covers = ordered.map((item, index) => {
  const filename = `cover-${String(index + 1).padStart(2, "0")}.png`;
  fs.copyFileSync(item.coverFile, path.join(coversDir, filename));
  return {
    run_id: item.runId,
    title: item.title,
    author: item.author,
    completed_at: item.completedAt,
    cover_url: item.coverUrl,
    current: item.runId === targetRunId,
    order: index + 1,
    local_file: `covers/${filename}`,
  };
});

fs.writeFileSync(
  path.join(revisionDir, "recent-8-books.json"),
  JSON.stringify(covers, null, 2) + "\n"
);
fs.writeFileSync(
  path.join(revisionDir, "cover-manifest.json"),
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      rule: "latest 8 completed verifiable book covers; current book forced to final locked position",
      target_run_id: targetRunId,
      covers,
    },
    null,
    2
  ) + "\n"
);

process.stdout.write(JSON.stringify({ ok: true, target_run_id: targetRunId, covers }, null, 2) + "\n");
