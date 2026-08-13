# book-video-daily-v9 安装教程

本教程说明如何把 `book-video-daily-v9` 安装到 Codex，并验证仓库内置的 V2 黄金母版示例视频。

## 1. 适用场景

`book-video-daily-v9` 是一个 Codex Skill，用于生产中文竖屏每日图书号视频。它不是一个独立的一键视频软件，而是一个编排层：负责固定选书、确认点、正文模板、片头模板、配音、字幕、混音和 QA 的执行顺序。

安装后，你可以在 Codex 里用类似下面的方式触发它：

```text
使用 $book-video-daily-v9 执行今晚 20:00 的每日图书号视频
```

## 2. 前置条件

本仓库包含 V9 Skill、V2 黄金模板资源和示例 MP4。完整生产一条视频还需要本机环境已经具备下列能力：

- Codex 桌面端或支持本地 Skills 的 Codex 环境。
- Python 3。
- Node.js。
- FFmpeg 和 ffprobe。
- HyperFrames 渲染环境。
- 可用的图像生成能力，例如 Codex `imagegen`。
- 可用的微信读书资料查询能力，例如 `weread-skills`。
- 可用的 TTS、ASR、字幕对齐和混音链路。
- 同机安装或可调用的旧版相关 Skills：`book-video-pipeline`、`book-video-intro-transition`。

如果只想验证本仓库是否下载完整，只需要 Python 3 和 ffprobe。

## 3. 推荐安装方式：让 Codex 安装 GitHub Skill

在 Codex 里输入：

```text
Install the skill from https://github.com/pcyone/book-video-daily-v9/tree/main/book-video-daily-v9
```

Codex 的 Skill Installer 会把仓库里的 `book-video-daily-v9/` 目录安装到：

```text
$CODEX_HOME/skills/book-video-daily-v9
```

如果你没有设置 `CODEX_HOME`，通常等价于：

```text
~/.codex/skills/book-video-daily-v9
```

安装完成后，下一轮对话即可使用该 Skill。

## 4. 手动安装方式

先克隆仓库：

```bash
git clone https://github.com/pcyone/book-video-daily-v9.git
cd book-video-daily-v9
```

创建本地 Skills 目录：

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
```

复制 Skill 目录：

```bash
cp -R book-video-daily-v9 "${CODEX_HOME:-$HOME/.codex}/skills/book-video-daily-v9"
```

确认安装结果：

```bash
ls "${CODEX_HOME:-$HOME/.codex}/skills/book-video-daily-v9"
```

至少应该看到：

```text
SKILL.md
assets
references
scripts
```

## 5. 验证 V2 黄金母版

进入仓库根目录后运行：

```bash
python3 book-video-daily-v9/scripts/verify_golden_master.py
```

或在安装后的 Skill 目录运行：

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/book-video-daily-v9/scripts/verify_golden_master.py"
```

成功时会看到 JSON 输出，其中包含：

```json
{
  "ok": true,
  "golden_sha256": "3207899ece95c87dc958c360a87cc0a8721ffeac95ab999ffe7ea6174b2dc697",
  "error_count": 0
}
```

如果 `ok` 不是 `true`，不要继续用于生产。通常原因是示例 MP4 没下载完整、文件被替换，或 ffprobe 不可用。

## 6. 验证 Codex 能识别 Skill

在 Codex 新开一轮对话，输入：

```text
请读取 $book-video-daily-v9，并告诉我它的四个确认点是什么
```

正常情况下，Codex 应该能回答四个顺序确认点：

```text
文案确认
开场旁白确认
两字关键词确认
图片确认
```

## 7. 安装后的目录结构

安装完成后，Skill 目录大致如下：

```text
book-video-daily-v9/
  SKILL.md
  agents/
  assets/
    golden-master-v2/
    hyperframes/
  references/
    workflow.md
    visual-contract.md
    audio-qa-contract.md
    golden-master-contract.md
    automation-contract.md
  scripts/
    build_v9_body.js
    build_v9_intro.js
    prepare_recent8.js
    validate_v9_contract.py
    verify_golden_master.py
```

`assets/golden-master-v2/` 是当前默认黄金母版资产。不要覆盖或手动替换里面的文件。

## 8. 升级方式

如果已经手动安装过旧版本，可以先备份旧目录：

```bash
mv "${CODEX_HOME:-$HOME/.codex}/skills/book-video-daily-v9" \
   "${CODEX_HOME:-$HOME/.codex}/skills/book-video-daily-v9.backup"
```

然后重新复制新版：

```bash
cp -R book-video-daily-v9 "${CODEX_HOME:-$HOME/.codex}/skills/book-video-daily-v9"
python3 "${CODEX_HOME:-$HOME/.codex}/skills/book-video-daily-v9/scripts/verify_golden_master.py"
```

确认新版本可用后，再删除备份。

## 9. 常见问题

### Codex 没有识别 `$book-video-daily-v9`

检查目录是否在正确位置：

```bash
ls "${CODEX_HOME:-$HOME/.codex}/skills/book-video-daily-v9/SKILL.md"
```

如果文件存在但仍未识别，重启 Codex 或开启新对话。

### `verify_golden_master.py` 报找不到视频

本仓库的 manifest 使用相对路径指向 `examples/` 下的示例 MP4。请确认你是完整克隆仓库，而不是只下载了 `book-video-daily-v9/` 子目录。

### 只能验证模板，不能完整出片

这通常说明本机缺少完整生产链路，例如微信读书查询、图像生成、VoxCPM、faster-whisper、HyperFrames 或 FFmpeg。先补齐依赖，再执行每日视频工作流。

### 想保留旧版 Skill

可以保留。V9 Skill 是最终编排层，不要求删除或改名旧 Skill。它会按需调用旧 `book-video-pipeline` 和 `book-video-intro-transition`，但不修改它们。
