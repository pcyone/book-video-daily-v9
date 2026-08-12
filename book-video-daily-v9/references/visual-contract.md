# V9 视觉契约

唯一视觉母版与哈希见 [golden-master-contract.md](golden-master-contract.md)。正文必须按 [body-builder-contract.md](body-builder-contract.md) 运行 `scripts/build_v9_body.js`，片头必须按 [intro-builder-contract.md](intro-builder-contract.md) 运行 `scripts/build_v9_intro.js`；不得只参照文字说明近似重建。

## 正文

- 画布：1080x1920、9:16、30fps、四幕。
- 背景：4 张已确认图片，仅做缓慢、克制的电影感推近或平移；文字层不参与背景模糊。
- 书目信息层：`top=286px`、`left/right=54px`、`width=972px`、水平居中、全片常驻。

### 书名与作者

- 书名：完整中文书名号；纯白 `#FFFFFF`，6px 纯黑 `#000000` 描边，最大 104px、900、line-height 1.12、letter-spacing 0。
- 书名强制 `white-space: nowrap`；文字安全宽度 948px。调用 HyperFrames `fitTextFontSize`，`baseFontSize=104`、`minFontSize=16`、`step=1`，直到完整单行显示。
- 禁止换行、裁切、`scaleX` 压缩和负字距。
- 作者：书名下方 24px；纯白、3px 纯黑描边、52px、800、line-height 1.2。
- 书名与作者均禁止底板、背景、伪阴影、光晕、文字阴影、模糊、渐变或其它装饰。

### 字幕

- 区域：`x=72..1008`、`top=1300px`、`width=936px`、容器高 260px，底部至少 320px。
- 文字：纯白、4px 纯黑描边、54px、700、line-height 1.34、letter-spacing 0、居中、最多两行。
- 同一时刻只显示一组，结束点强制隐藏；不得手插 `<br>`。
- 禁止面板背景、半透明底板、边框、圆角、阴影、模糊、发光或其它装饰。

以上数值已固化在正文生成器中。`assets/hyperframes/plain-text-overlays.css` 与 `fit-title.js` 仅用于检查或维护生成器，不得替代完整正文生成器。

## 片头

- 总长 4.800 秒；正文以 0.033 秒单帧切换进入，正文入口为 4.833 秒。
- 序列 3–4 的开场旁白只来自 `opening-hook-approved.txt`，含 1–20 个汉字；标点不计入汉字数。完整片头口播预览为：`<已确认开场旁白>。今天分享《<每日书名短名>》。`
- 两字关键词只来自 `opening-keyword-approved.txt`，必须恰好两个汉字，并从已确认开场旁白与传播角度提炼。
- 两份文字必须先后由用户单独确认。未确认不得生成 `intro-config.json`、配音或片头。
- 最近 8 本封面每次重新扫描已完成运行；当前书最后锁定，不重复。
- 必须使用 Skill 内 `scripts/build_v9_intro.js` 生成片头，不得重新实现或近似复刻。输入文件格式见 [intro-builder-contract.md](intro-builder-contract.md)。

### 24 序列

| 序列 | 30fps 帧 | 规则 |
|---|---:|---|
| 1 | 0 | 当日第一幕图 + 当日书名作者 |
| 2 | 2 | 当日第一幕图保持 |
| 3 | 3 | 黑底；两字关键词镂空透出第二幕图 |
| 4 | 60 | 只保持字形镂空，不开始水平揭开 |
| 5–12 | 75,78,81,84,87,90,93,96 | 从中线直接向上、向下揭开第二幕图；无彩色边、纤维边或笔刷边 |
| 13 | 100 | 第二幕图完整、无滤镜显示 |
| 14–20 | 104,108,112,116,120,124,127 | 最近 8 本封面依次轮换 |
| 21 | 132 | 当前书锁定并开始六层 Ripple Waves |
| 22 | 138 | 六层同心环继续向外扩散扭曲 |
| 23 | 143 | 波纹收稳 |
| 24 | 145 | 正文首帧 |

Ripple Waves 必须由六个独立同心环形取样层实现，交替轻微放大与缩小并由中心向外传播；禁止用整幅画面统一缩放冒充。

使用 `assets/hyperframes/intro-sequence-map.json` 生成和核对接触表。参考实现只用于结构，不得残留示例书名、作者、口播、关键词、图片或封面。
