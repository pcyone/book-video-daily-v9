# 黄金正文生成器契约

固定命令：

```bash
node book-video-daily-v9/scripts/build_v9_body.js \
  /absolute/run/revisions/v9-YYYYMMDD
```

revision 目录必须包含：

- `body-config.json`
- 四张已确认背景图
- `final-mix.wav`

run 根目录必须包含 `script-approved.txt`。生成器会校验所有字幕片段按顺序拼接后与确认稿逐字一致。

`body-config.json`：

```json
{
  "run_dir": "/absolute/run",
  "book_title": "不含书名号的完整书名",
  "author": "作者名",
  "duration_seconds": 25.314,
  "background_files": [
    "background-01.png",
    "background-02.png",
    "background-03.png",
    "background-04.png"
  ],
  "audio_file": "final-mix.wav",
  "captions": [
    {"id": "c001", "text": "确认稿片段", "start": 0.08, "end": 2.06}
  ],
  "scenes": [
    {"label": "第一幕", "start": 0, "end": 4.48},
    {"label": "第二幕", "start": 4.48, "end": 8.82},
    {"label": "第三幕", "start": 8.82, "end": 11.96},
    {"label": "第四幕", "start": 11.96, "end": 25.314}
  ]
}
```

四幕边界必须连续，第一幕从 0 开始，第四幕结束点必须等于最终混音时长。字幕时间来自 ASR 对齐，不得平均分配。生成器固定黄金母版的正文 DOM、CSS、四组镜头向量、0.68 秒柔焦覆盖、字幕入退场、书名作者动画、主题光漏和 0.414 秒结尾淡出。

输出：`hyperframes/index.html`、`index.motion.json`、`DESIGN.md`。HTML 必须包含 `data-template-version="golden-final-v9-body"`，缺少该标记时最终验收失败。
