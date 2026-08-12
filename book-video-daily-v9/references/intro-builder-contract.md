# 已验收片头生成器契约

使用以下固定命令，不得另写片头动画：

```bash
node book-video-daily-v9/scripts/prepare_recent8.js \
  /absolute/run /absolute/run/revisions/v9-YYYYMMDD /absolute/current-cover.png

node book-video-daily-v9/scripts/build_v9_intro.js \
  /absolute/run/revisions/v9-YYYYMMDD
```

revision 目录在执行生成器前必须包含：

- `intro-config.json`
- `cover-manifest.json`
- `covers/cover-01.png` 至 `cover-08.png`
- `scene-01.png`：当日第一幕已确认图片
- `scene-02.png`：当日第二幕已确认图片
- `current-lock-frame.png`：当前书封面锁定画面
- `audio/intro-narration.wav`：固定频道声线生成的完整片头口播
- `audio/cover-ratchet.wav`：已确认封面轮换音效

`prepare_recent8.js` 固定读取最近 7 本已完成且可核验的历史封面，再把命令行指定的当前书封面放在第 8 个锁定位置。当前 run 不需要提前伪装成 `done`。

run 根目录必须包含：

- `opening-hook-approved.txt`
- `opening-keyword-approved.txt`
- `intro-script-approved.txt`：由已确认开场旁白与固定书名后缀自动组成，不增加确认点
- `state.json`，其中两项开场确认均为 `approved`

`intro-config.json` 格式：

```json
{
  "run_dir": "/absolute/run",
  "opening_hook": "用户已确认且不超过二十个汉字的旁白",
  "keyword": "两字",
  "intro_narration_text": "<已确认开场旁白>。今天分享《<书名短名>》。",
  "narration_duration_seconds": 4.2,
  "scene_1_file": "scene-01.png",
  "scene_2_file": "scene-02.png"
}
```

生成器硬校验：开场旁白 1–20 个汉字、关键词恰好两个汉字、配置与三份锁定文字文件逐字一致、完整口播以前者开头、时长不超过 4.8 秒、最近封面恰好 8 本且当前书在最后。任一不满足即失败关闭。

生成器输出 `hyperframes/index.html`、`index.motion.json` 和 `DESIGN.md`，使用已验收《翦商》V7 的固定时间线、字形镂空、中线揭开、封面快切及六层 Ripple Waves 参数。
