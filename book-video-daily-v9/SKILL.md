---
name: book-video-daily-v9
description: "Produce the confirmed V9 daily Chinese vertical book video workflow from the sole immutable V2 golden MP4 final-with-recent-8-intro-plain-single-line-title.mp4. Require four sequential approvals: body script, a 20-Chinese-character-or-shorter opening hook, an exact two-Chinese-character keyword, and four images. Use the bundled deterministic golden body and 24-sequence recent-8-cover intro builders, then complete voice/ASR/media QA. Use for current 每日图书号视频 scheduled runs, V9 run recovery, or requests for the approved single-line-title and Ripple Waves format. Keep legacy book-video skills unchanged."
---

# 每日图书视频 V9 / V2 黄金母版

把本 Skill 视为独立的最终版编排层。调用旧 Skill 的能力，但不得编辑、替换或重命名旧 Skill。

## 依赖与优先级

1. 完整读取 `book-video-pipeline`，复用其研究、图片、VoxCPM、字幕、混音和正文 QA；确认点以本 Skill 的四次顺序确认为准。
2. 读取 `book-video-intro-transition`，只复用其合成脚本和媒体 QA；本 Skill 的 `0.033s` 单帧正文入口覆盖旧 Skill 的 `0.600s` soft dissolve 默认值。
3. 按需读取 `weread-skills`、`imagegen`、`hyperframes`、`hyperframes-core`、`hyperframes-cli` 和 `media-use`。
4. 冲突时按：用户当次明确要求 > 本 Skill > 被调用旧 Skill。不得把本 Skill 的规则反向写回旧 Skill。

## 启动

1. 先读取 [golden-master-contract.md](references/golden-master-contract.md)，运行 `scripts/verify_golden_master.py`；任何失败均硬阻塞。
2. 读取 [workflow.md](references/workflow.md)，执行选书去重、幂等恢复和四个顺序确认点。
3. 进入正文合成前读取 [visual-contract.md](references/visual-contract.md)，使用固定正文和片头生成器。
4. 进入配音、混音和 QA 前读取 [audio-qa-contract.md](references/audio-qa-contract.md)。
5. 定时任务或恢复任务额外读取 [automation-contract.md](references/automation-contract.md)。
6. 每个阶段先读 `state.json` 和已锁定产物；已确认内容不得重复询问。

## 固定流程

`preflight -> research -> script_wait -> opening_hook_wait -> opening_keyword_wait -> storyboard -> images_wait -> voice -> captions -> mix -> compose -> qa -> render -> intro -> final_qa -> done`

- 固定四个确认点，且必须依次完成：`script_wait`、`opening_hook_wait`、`opening_keyword_wait`、`images_wait`。
- 正文确认后只展示一个不超过 20 个汉字的开场旁白候选并停止；未收到“开场旁白确认”不得提炼两字词或生成图片。
- 开场旁白确认后只展示一个恰好两个汉字的关键词候选并停止；未收到“两字确认”不得生成图片。
- 图片确认后自动完成声音、字幕、正文、动态片头、合成和 QA，不再增加确认点。
- 正文和片头都必须由 HyperFrames 生成；所有可见文字必须来自 HTML/CSS，不得写进背景图。
- 每次修改都新建 revision，绝不覆盖已交付的正文或旧 revision。

## V2 固化

- 当前默认黄金母版为 `assets/golden-master-v2/manifest.json`，来源为 2026-08-09 20:00《我们内心的冲突》带片头最终版。
- V1 黄金资产保留在 `assets/golden-master/` 仅供追溯；默认 preflight、V9 契约校验和新运行均以 V2 manifest 为准。
- 不得覆盖 V2 manifest 或 V2 bundled sources；如需再次固化，新增 `golden-master-vN` 并显式切换默认 manifest。

## V9 硬锁

- 正文书名、作者、字幕均为纯白字、纯黑描边，无底板、背景、光晕、阴影、模糊或其它装饰。
- 完整书名必须保持一行；长书名使用 HyperFrames `fitTextFontSize` 自动缩小，禁止换行、裁切或横向压缩。
- 片头固定 4.800 秒、24 序列、最近 8 本封面；序列 21–23 为六层同心环 Ripple Waves，序列 24 在 4.833 秒进入正文。
- 开场旁白只使用 `opening-hook-approved.txt`，含 1–20 个汉字；两字关键词只使用 `opening-keyword-approved.txt`，必须恰好两个汉字。两者逐项确认并锁定，图片和封面每天更新，不得残留示例书内容。
- 片头必须运行随 Skill 提供的 `scripts/build_v9_intro.js`；禁止另写近似动画。该生成器会校验两份开场确认文件并复用已验收 V7 的精确时间线、遮罩和六层 Ripple Waves 参数。
- 正文必须运行 `scripts/build_v9_body.js`；禁止由旧 Skill 临时重建正文 HTML。片头和正文均以 V2 黄金成片 SHA-256 `3207899ece95c87dc958c360a87cc0a8721ffeac95ab999ffe7ea6174b2dc697` 为唯一母版。
- 最终成片必须通过完整解码、黑帧、SI-SDR 和 ASR 覆盖率门槛。

## 验收

渲染后运行：

```bash
python3 scripts/validate_v9_contract.py \
  --run-dir /absolute/run \
  --body-html /absolute/run/hyperframes/index.html \
  --intro-html /absolute/revision/hyperframes/index.html \
  --qa /absolute/revision/qa/final-qa.json \
  --output /absolute/revision/qa/v9-contract-validation.json
```

在此之前必须运行：

```bash
python3 scripts/verify_golden_master.py --output /absolute/run/qa/golden-master-verification.json
```

脚本通过不替代 HyperFrames strict、ffprobe、完整解码、黑帧、人声 SI-SDR 和 faster-whisper；它只负责防止 V9 视觉与关键 QA 契约回归。

## 交付

交付正文 MP4、带片头 MP4、正文/片头 HyperFrames 项目、字幕、旁白、最终混音、QA JSON、正文字幕接触表、24 序列接触表、运行报告和状态文件。明确列出原始文件与新 revision，并说明原始文件未被覆盖。
