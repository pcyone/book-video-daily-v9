# 黄金母版契约

当前唯一默认黄金成片为 V2：

``../../../examples/final-with-recent-8-intro-plain-single-line-title.mp4`（相对 `assets/golden-master-v2/manifest.json`）`

SHA-256：`3207899ece95c87dc958c360a87cc0a8721ffeac95ab999ffe7ea6174b2dc697`。

来源：2026-08-09 20:00《我们内心的冲突》带片头最终版；开源仓库示例视频位于 `examples/`。V1 黄金资产仍保留在 `assets/golden-master/`，只作历史追溯；默认 preflight 与契约校验均使用 `assets/golden-master-v2/manifest.json`。

## 使用方式

- 每次 preflight 先运行 `scripts/verify_golden_master.py`。默认读取 V2 manifest；哈希、文件或技术参数不符时硬阻塞，禁止改用近似模板。
- 黄金母版及 `assets/golden-master-v2/` 只读。不得覆盖、重渲染或替换其中任何文件。
- 每日视频只替换：书名、作者、正文稿、两项已确认开场文字、四张背景图、最近 8 本封面、旁白、字幕时间和最终混音。
- 布局、CSS 层级、字号、描边、镜头算法、字幕动画、柔焦转场、片头 24 序列、六层 Ripple Waves、4.800 秒片头、0.033 秒正文入口和编码参数必须与 V2 黄金母版一致。
- 正文必须运行 `scripts/build_v9_body.js`；片头必须运行 `scripts/build_v9_intro.js`。禁止手写替代 HTML 或从旧 Skill 直接复制另一套视觉实现。
- `assets/golden-master-v2/body/index.html` 与 `intro/index.html` 仅用于结构和视觉回归检查，禁止直接交付，避免残留《我们内心的冲突》内容。

## 固定边界

- 1080x1920、30fps、H.264 High、yuv420p、BT.709。
- AAC-LC、48kHz、双声道。
- 片头 `0.000–4.800s`；单帧入口 `4.800–4.833s`；正文从 `4.833s` 开始。
- V2 黄金最终时长为 27.989 秒；每日正文时长跟随当日最终混音，不强制等于 V2 的 23.133 秒正文。
- 正文四幕切点来自确认稿和 ASR，但每幕的运动向量、0.68 秒柔焦覆盖、字幕入场 0.22 秒、字幕退场 0.13 秒及结尾 0.414 秒淡出均锁定。

## 验收

- 运行 `validate_v9_contract.py` 时必须通过 V2 黄金母版哈希、正文模板标记、片头模板标记、`body_start_seconds=4.833`、四幕、标题单行、纯白黑边字幕、最近 8 本、六层 Ripple Waves、人声和 ASR 全部检查。
- 接触表必须与 V2 捆绑的两张黄金接触表逐项对照结构，不要求日更图片像素相同，但序列、层级、位置、入退场状态和正文入口必须相同。
