# book-video-daily-v9

Codex Skill for producing the V9 daily Chinese vertical book-video workflow with four ordered confirmations, fixed narration/ASR QA gates, HyperFrames body rendering, and the V2 recent-8 Ripple Waves intro golden master.

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

## License

MIT. The included example video is provided as a workflow example for this repository.
