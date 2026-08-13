# book-video-daily-v9 使用教程

本教程说明如何使用 `book-video-daily-v9` 生产每日图书号竖屏视频，以及每一步应该确认什么、会生成什么文件。

## 1. 这个 Skill 做什么

`book-video-daily-v9` 用于生产约 30 秒的中文竖屏图书推荐视频。它固化了一个已验收的 V2 黄金母版：

```text
examples/final-with-recent-8-intro-plain-single-line-title.mp4
```

V2 黄金母版来自 2026-08-09 20:00《我们内心的冲突》带片头最终版。新视频只替换当日书籍、文案、开场旁白、两字关键词、图片、封面、配音和字幕时间，不改变版式、镜头节奏、片头结构和 QA 门槛。

## 2. 核心原则

- 每次只推荐并制作一本书。
- 同一天同一时段只恢复原任务，不重新选第二本。
- 四个确认点必须按顺序进行，不能合并。
- 图片确认后，声音、字幕、混音、正文、片头、合成和 QA 自动完成。
- 正文和片头都由 Skill 内置生成器创建，不能临时手写近似版本。
- 最终成片必须同时通过视频规格、音频、人声、ASR 覆盖率和视觉契约检查。

## 3. 四个确认点

### 3.1 文案确认

Skill 会先完成选书和研究，然后展示：

- 书名。
- 作者。
- 选书理由。
- 单一传播角度。
- 逐字旁白。
- 预计时长。
- 3 到 5 条来源摘要与链接。
- 视频号和抖音号发布描述。

你确认后，Skill 会锁定：

```text
script-approved.txt
```

后续字幕和旁白都必须来自这个确认稿。

### 3.2 开场旁白确认

正文文案确认后，Skill 只会提出一个开场旁白候选。它必须是 1 到 20 个汉字。

示例：

```text
讨好别人、对抗别人，或者远离别人
```

Skill 会同时展示完整片头口播预览：

```text
讨好别人、对抗别人，或者远离别人。今天分享《我们内心的冲突》。
```

你确认后，Skill 会锁定：

```text
opening-hook-approved.txt
```

没有这份文件，不能进入两字关键词或图片阶段。

### 3.3 两字关键词确认

开场旁白确认后，Skill 只会提出一个恰好两个汉字的关键词。

你确认后，Skill 会锁定：

```text
opening-keyword-approved.txt
```

没有这份文件，不能生成图片、音频或片头。

### 3.4 图片确认

两字关键词确认后，Skill 会把正文拆成四幕，生成四张独立 9:16 图片。图片必须：

- 明亮、干净、壁纸级。
- 统一综合色板、光线、材质和镜头语言。
- 不含任何文字、字母、数字、logo、水印、签名或伪文字。
- 给书名、作者、字幕和平台 UI 留出安全区域。

你回复“图片确认”后，后续流程不再新增审美确认点。

## 4. 一次完整运行怎么开始

在 Codex 中输入类似下面的请求：

```text
使用 $book-video-daily-v9 执行每日图书号视频，时段 20:00，按北京时间计算。
```

如果是自动化任务，建议在自动化 prompt 中明确写：

```text
必须优先完整使用 $book-video-daily-v9 Skill 执行本次任务。
```

同时明确当天时段：

```text
08:00 对应第 1 本
16:00 对应第 2 本
20:00 对应第 3 本
```

## 5. 运行目录

每次运行会创建一个目录：

```text
runs/YYYYMMDD-HHMM-<book-slug>/
```

例如：

```text
runs/20260809-2000-wo-men-nei-xin-de-chong-tu/
```

关键文件包括：

```text
state.json
research.md
script-review.md
script-approved.txt
opening-hook-review.md
opening-hook-approved.txt
opening-keyword-review.md
opening-keyword-approved.txt
platform-descriptions.md
audio/narration-master.wav
audio/final-mix.wav
captions/whisper.json
captions/aligned.json
captions/subtitles.srt
hyperframes/index.html
final.mp4
revisions/<revision-name>/intro-template.mp4
revisions/<revision-name>/final-with-recent-8-intro-plain-single-line-title.mp4
qa/final-qa.json
run-report.md
```

`final.mp4` 是正文成片。带片头的最终修正版放在 `revisions/` 下，原始正文不会被覆盖。

## 6. 状态机

V9 固定状态流如下：

```text
preflight
research
script_wait
opening_hook_wait
opening_keyword_wait
storyboard
images_wait
voice
captions
mix
compose
qa
render
intro
final_qa
done
```

如果任务中断，下一次继续时会读取 `state.json` 和已锁定文件，从最后成功阶段恢复。

## 7. 选书和去重

Skill 会扫描历史运行文件：

```text
runs/**/state.json
runs/**/script-review.md
runs/**/script-approved.txt
runs/**/run-report.md
```

并维护：

```text
automation/book-video-selection-ledger.json
```

去重规则：

- 已推荐、已开始、已完成、被否决的书都不再推荐。
- 同日其它时段已占用的书不再推荐。
- 同一天同一时段已存在记录时，只恢复旧 run。
- 新的一天必须创建新候选，不因前一天仍等待确认而跳过。

## 8. 正文生成器

图片确认后，Skill 会生成 `body-config.json`，然后运行：

```bash
node book-video-daily-v9/scripts/build_v9_body.js \
  /absolute/run/revisions/v9-YYYYMMDD
```

正文生成器会固定：

- 1080x1920。
- 30fps。
- 四幕。
- 书名和作者全片常驻。
- 完整书名一行显示。
- 纯白文字、纯黑描边。
- 无字幕底板、光晕、阴影或背景。
- 0.68 秒柔焦覆盖转场。
- 0.414 秒结尾淡出。

生成器输出：

```text
hyperframes/index.html
hyperframes/index.motion.json
hyperframes/DESIGN.md
```

## 9. 片头生成器

片头使用最近 8 本封面轮换，当前书最后锁定。生成步骤为：

```bash
node book-video-daily-v9/scripts/prepare_recent8.js \
  /absolute/run /absolute/run/revisions/v9-YYYYMMDD /absolute/current-cover.png

node book-video-daily-v9/scripts/build_v9_intro.js \
  /absolute/run/revisions/v9-YYYYMMDD
```

片头固定：

- 总长 4.800 秒。
- 24 序列。
- 序列 21 到 23 使用六层同心环 Ripple Waves。
- 4.833 秒进入正文。
- 开场旁白只来自 `opening-hook-approved.txt`。
- 两字关键词只来自 `opening-keyword-approved.txt`。

## 10. 音频和字幕

图片确认后自动完成：

- 固定频道声线整稿生成旁白。
- 48kHz 旁白后期。
- faster-whisper 中文词级时间戳。
- 字幕时间回映到 `script-approved.txt`。
- BGM sidechain ducking。
- 两遍 loudnorm。
- 输出唯一最终混音：

```text
audio/final-mix.wav
```

字幕文字只来自确认稿，不能来自 ASR 猜测文本。

## 11. QA 验收

最终必须通过：

- HyperFrames strict：0 error、0 warning。
- H.264 High、yuv420p、1080x1920、30fps。
- AAC-LC、48kHz。
- 完整解码。
- 无大于等于 80ms 黑帧。
- 无字幕残留、遮挡、溢出或音频截断。
- `audio/final-mix.wav` 对 `narration-master.wav` 的 SI-SDR 大于 +10dB。
- 最终 MP4 音轨对 `narration-master.wav` 的 SI-SDR 大于 +10dB。
- 最终 MP4 faster-whisper 对确认稿覆盖率不低于 80%。
- V9 契约校验通过。

V9 契约校验命令：

```bash
python3 book-video-daily-v9/scripts/validate_v9_contract.py \
  --run-dir /absolute/run \
  --body-html /absolute/run/hyperframes/index.html \
  --intro-html /absolute/revision/hyperframes/index.html \
  --qa /absolute/revision/qa/final-qa.json \
  --output /absolute/revision/qa/v9-contract-validation.json
```

## 12. 如何继续中断任务

如果停在文案确认，回复：

```text
文案确认
```

如果想修改开场旁白，回复：

```text
开场旁白修改：<你的新开场旁白>
```

确认开场旁白：

```text
开场旁白确认
```

确认两字关键词：

```text
两字确认
```

确认图片：

```text
图片确认
```

如果任务中断后要恢复：

```text
继续推进
```

Skill 会读取当前 run 的 `state.json` 和锁定文件，不会重新选书。

## 13. 发布描述

Skill 会自动生成：

```text
platform-descriptions.md
```

格式固定为视频号和抖音号两份。08:00、16:00、20:00 分别对应当天第 1 本、第 2 本、第 3 本。恢复任务或换书时，编号不变。

## 14. 不要做的事

- 不要跳过开场旁白确认。
- 不要把开场旁白确认和两字关键词确认合并。
- 不要在图片里写书名、作者、字幕或 logo。
- 不要手写正文或片头 HTML 来代替内置生成器。
- 不要覆盖 `assets/golden-master-v2/`。
- 不要删除或重命名旧 `book-video-pipeline` 和 `book-video-intro-transition`。
- 不要把 V9 规则反向写回旧 Skill。

## 15. 最小排错清单

如果流程失败，按顺序检查：

1. `verify_golden_master.py` 是否通过。
2. `state.json` 当前状态是否正确。
3. `script-approved.txt` 是否存在且与字幕一致。
4. `opening-hook-approved.txt` 是否存在，且开场旁白为 1 到 20 个汉字。
5. `opening-keyword-approved.txt` 是否存在，且关键词恰好两个汉字。
6. 四张图片是否独立存在且为 9:16。
7. `audio/narration-master.wav` 和 `audio/final-mix.wav` 是否存在。
8. `captions/aligned.json` 是否来自确认稿回映。
9. 正文 HTML 是否包含 `data-template-version="golden-final-v9-body"`。
10. 片头 HTML 是否来自 `build_v9_intro.js`。
11. `qa/final-qa.json` 是否记录人声、ASR、黑帧和编码检查。

先修复最早失败的阶段，再继续，不要直接覆盖最终成片。
