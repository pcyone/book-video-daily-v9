# 音频与 QA 契约

## 固定声线

- 读取工作区 `assets/voice/default-profile.json` 和 `assets/voice/README.md`。
- 固定 `voice_id=book-channel-sahara-v1`，使用 VoxCPM2 Ultimate Cloning。
- 同一锚点同时作为 prompt audio 与 reference audio；精确 prompt text 使用配套 `.txt`。
- 锚点 SHA-256 必须为 `c4a868e6cf0a89d7bd82b5a4748438120a3c44eb582b8cbd9b358bfc835652c1`。
- `cfg_value=2.0`、`inference_timesteps=10`、整稿一次生成、不做 text normalize、不使用 control。
- 禁止 voice design、随机换说话人、逐句拼接或回退其它声音。锚点异常或 clone 不可用时硬阻塞失败关闭。

## 旁白与字幕

- 旁白后期为 48kHz，目标约 -16 LUFS。
- faster-whisper：中文、int8、词级时间戳、VAD。
- 必须运行旧 `book-video-pipeline/scripts/align_subtitles.py`，时间来自 ASR，文字只来自 `script-approved.txt`。
- 校验覆盖率、单调性、重叠、首尾空白和专名。
- 片头完整口播只能由 `opening-hook-approved.txt` 加固定后缀 `。今天分享《<书名短名>》。` 组成，并保存为 `intro-script-approved.txt`；不得改写已确认的开场旁白。
- `audio/intro-narration.wav` 必须使用同一固定声线整句生成。单独运行 faster-whisper，并与 `intro-script-approved.txt` 单调对齐，覆盖率必须 >= 0.80；确认的开场旁白不得缺字或被替换。

## BGM 与混音

- 优先复用已授权 MeeGiStudio《Calm Moments》及记录；不适配时从已授权曲库自动选相近音乐。
- 旁白先 `asplit` 为 `narration_mix` 和 `narration_key`。
- `[BGM][narration_key]` 经 `sidechaincompress` 得到 ducked BGM，再与 `[narration_mix]` 显式 `amix`。
- 保留 `mix-premaster.wav`、`ducked-bgm.wav`、`bgm-bed-unducked.wav`；premaster 两遍 loudnorm 后输出唯一 `audio/final-mix.wav`。

## QA 门槛

- HyperFrames strict：0 error、0 warning、0 contrast failure、0 dropped transition sample。
- 视频：H.264 High、yuv420p、1080x1920、30fps。
- 音频：AAC-LC、48kHz；音画时长一致。
- 完整解码通过；无 `>=80ms` 黑帧、溢出、遮挡、字幕残留或音频截断。
- `audio/final-mix.wav` 对 `narration-master.wav` 的 SI-SDR > +10dB。
- 最终 MP4 正文音轨对 `narration-master.wav` 的 SI-SDR > +10dB。
- 最终 MP4 faster-whisper 对确认稿覆盖率 >= 0.80。
- 必须抽查首尾、四幕、三处正文转场、字幕最长帧、书名单行帧、片头 24 序列和正文入口。

## 黄金参考

频道音频黄金基准为工作区已验收的《东京八平米》修正版：`audio/narration-master.wav`、`audio/final-mix.wav`、`final.mp4` 和 `qa/final-qa.json`。除非用户明确要求，固定音色与音频链路不得改变。
