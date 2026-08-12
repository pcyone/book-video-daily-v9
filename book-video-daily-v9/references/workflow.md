# 工作流与确认点

## 1. 选书与幂等

- 扫描工作区 `runs/` 下全部 `state.json`、`script-review.md`、`script-approved.txt` 和 `run-report.md`。
- 读取或创建 `automation/book-video-selection-ledger.json`。
- 使用“北京时间日期 + 时段”作为唯一键。同键存在时只恢复原 run，不再选书。
- 排除所有已推荐、已开始、已完成、已否决和同日其它时段已占用的书。
- 每次只锁定一本；用户换书时把旧书记为 `rejected/excluded`，再选未出现过的书。
- 优先用微信读书核验书籍、作者、热门划线、公开点评和读者反馈；不可用时记录降级来源。

## 2. 运行目录

创建 `runs/YYYYMMDD-HHMM-<book-slug>/`，持续写入 `state.json`。选定后立即把日期、时段、书名、作者、run_id 和状态写入 ledger 与 state。

## 3. 文案确认

- 只选一个适合约 30 秒传播的切口。
- 正文旁白为 125–165 个中文字符；开头直接制造具体张力，中段给事实或生活细节，结尾克制。
- `script-review.md` 包含书名、作者、选书理由、单一传播角度、逐字旁白、预计时长及 3–5 条来源摘要和链接。
- 同时生成 `platform-descriptions.md`，但不新增确认点。
- 用户确认后写入并锁定 `script-approved.txt`；后续可见字幕只能来自该文件。

## 4. 开场旁白确认

- 正文确认后，从已确认的单一传播角度只提炼一个开场旁白候选。
- 候选含 1–20 个汉字，标点不计入汉字数；优先 10–20 个汉字。禁止英文、数字、书名推荐套话和第二候选。
- 在任务中显示“开场旁白确认”、候选全文、汉字数及片头完整口播预览：`<候选>。今天分享《<书名短名>》。`
- 写入 `opening-hook-review.md`，把 state 更新为 `opening_hook_wait` 并停止。用户修改时只修订同一候选，再次等待确认。
- 仅在用户明确回复“开场旁白确认”后写入并锁定 `opening-hook-approved.txt`，记录 `state.confirmations.opening_hook.status=approved`。
- 未锁定该文件，禁止提炼两字关键词、生成图片、生成音频或开始片头。
- 从旧 V9 run 恢复且该文件缺失时，即使图片已经存在，也必须先停在 `opening_hook_wait`；不得把既有成片视为用户已确认该文案。

## 5. 两字关键词确认

- 只从 `opening-hook-approved.txt` 和已确认传播角度提炼一个关键词，必须恰好两个汉字，不含标点、空格、英文或数字。
- 在任务中显示“两字关键词确认”、唯一候选及其与开场旁白的对应关系。
- 写入 `opening-keyword-review.md`，把 state 更新为 `opening_keyword_wait` 并停止。用户修改时只修订同一候选，再次等待确认。
- 仅在用户明确回复“两字确认”或“两字关键词确认”后写入并锁定 `opening-keyword-approved.txt`，记录 `state.confirmations.opening_keyword.status=approved`。
- 未锁定该文件，禁止生成图片、生成音频或开始片头。
- 从旧 V9 run 恢复且该文件缺失时，必须停在 `opening_keyword_wait`；确认后可复用已确认图片，但只能生成新的 revision。

## 6. 图片确认

- 按确认稿拆成四幕，生成 4 张独立原生高分辨率 9:16 图片，不生成拼图。
- 图片必须明亮、干净、壁纸级、构图完整，统一人物锚点、综合色板、光线和镜头语言。
- 图片不得含文字、字母、数字、书名、作者、字幕、logo、水印、签名或伪文字。
- 内部重生不合格图，只展示最终 4 张及段落映射。
- 用户确认后锁定图片，自动完成所有后续阶段。

## 7. 自动阶段

1. 固定声线整稿生成旁白。
2. 48kHz 后期和响度处理。
3. faster-whisper 词级时间戳 + `align_subtitles.py` 回映确认稿。
4. 授权 BGM、sidechain ducking、显式混回旁白、两遍 loudnorm。
5. 从已确认书目、四张图片、`aligned.json` 和 `final-mix.wav` 写入 `body-config.json`，运行 `scripts/build_v9_body.js` 生成黄金母版正文；禁止手写替代正文 HTML。
6. 从两份开场确认文件生成并锁定 `intro-script-approved.txt` 与 `intro-config.json`；使用 `scripts/prepare_recent8.js` 和 `scripts/build_v9_intro.js` 生成已验收 V7 的 24 序列最近 8 本片头，禁止另写近似实现。
7. `0.033s` 单帧正文入口合成。
8. 完整 QA、接触表、报告、state 和 ledger 更新。

## 8. 发布描述

每个平台恰好 5 个话题，至少含去掉书名号的书名话题。08:00/16:00/20:00 分别固定为第 1/2/3 本；恢复或换书不得改变编号。

格式：

```text
视频号：
第N本：<核验短句或明确标注为原创的感悟>；
#话题1 #话题2 #话题3 #话题4 #话题5

抖音号：
第N本：<核验短句或明确标注为原创的感悟>；
#话题1 #话题2 #话题3 #话题4 #话题5
```
