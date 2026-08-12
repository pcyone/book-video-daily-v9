# 自动化契约

- 北京时间 Asia/Shanghai 计算日期与时段。
- 08:00、16:00、20:00 分别对应当天第 1、2、3 本。
- 每次触发只推荐并启动一本书；同日不同时段必须去重。
- 新的一天必须创建本日候选，不因前一天等待确认而跳过。
- 用户说“继续工作”时读取 state、ledger 和锁定产物，从最后成功阶段恢复。
- 恢复时依次识别 `script_wait`、`opening_hook_wait`、`opening_keyword_wait`、`images_wait`。不得把开场旁白确认与两字关键词确认合并，也不得跳过其中任何一步。
- 旧 V9 run 若已进入图片或渲染阶段但缺少任一开场锁定文件，必须回补到对应等待阶段；保留现有图片和视频，不覆盖产物，补齐两项确认后只新建 revision。
- 用户换书时保留旧书为 rejected/excluded，不得删除历史。
- 每次完成或停在确认点时更新自动化 memory，记录 run_id、当前阶段、锁定产物和下一步。
- 自动化 prompt 应显式调用 `$book-video-daily-v9`。不要移除旧 Skill，也不要把旧 Skill 的默认行为修改为 V9。
- 自动化每次启动必须先校验唯一黄金成片 `final-with-recent-8-intro-plain-single-line-title.mp4` 的 SHA-256；正文和片头只能调用 V9 捆绑生成器，不得由旧 prompt 中的其它模板规则覆盖。
- 最终回复同时列出原始正文和 V9 修正版路径，明确原始文件未覆盖。
