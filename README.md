# book-video-daily-v9

Codex Skill for producing the V9 daily Chinese vertical book-video workflow with four ordered confirmations, fixed narration/ASR QA gates, HyperFrames body rendering, and the V2 recent-8 Ripple Waves intro golden master.

## Documentation

- [Installation tutorial](docs/INSTALLATION.md): install the Skill into Codex, verify the V2 golden master, and prepare required companion tools.
- [Usage tutorial](docs/USAGE_TUTORIAL.md): run a daily book-video job, handle the four approval points, recover an interrupted run, and understand the generated artifacts.

## Quick Install

From Codex, ask:

```text
Install the skill from https://github.com/pcyone/book-video-daily-v9/tree/main/book-video-daily-v9
```

Manual install:

```bash
git clone https://github.com/pcyone/book-video-daily-v9.git
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R book-video-daily-v9/book-video-daily-v9 "${CODEX_HOME:-$HOME/.codex}/skills/book-video-daily-v9"
python3 "${CODEX_HOME:-$HOME/.codex}/skills/book-video-daily-v9/scripts/verify_golden_master.py"
```

## Contents

- `book-video-daily-v9/`: the Codex skill folder.
- `examples/final-with-recent-8-intro-plain-single-line-title.mp4`: V2 golden example final video.
- `examples/intro-template.mp4`, `examples/single-frame-transition.mp4`, `examples/body-final.mp4`: V2 segment examples used by the manifest verifier.

## V2 Golden Master

The V2 golden final MP4 is frozen from the 2026-08-09 20:00 run for 《我们内心的冲突》.

SHA-256:

```text
3207899ece95c87dc958c360a87cc0a8721ffeac95ab999ffe7ea6174b2dc697
```

The default manifest is:

```text
book-video-daily-v9/assets/golden-master-v2/manifest.json
```

Verify after cloning:

```bash
python3 book-video-daily-v9/scripts/verify_golden_master.py
```

Expected result:

```text
"ok": true
```

## License

MIT. The included example video is provided as a workflow example for this repository.
