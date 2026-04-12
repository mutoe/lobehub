@AGENTS.md

## Fork 仓库说明

本仓库是 [lobehub/lobehub](https://github.com/lobehub/lobehub) 的 fork，会定期与上游保持同步。

### 同步策略

- 当上游发布新的稳定版 tag（`vX.Y.Z`）时，通过 `/sync-upstream` 命令 rebase 到该 tag
- 本仓库的版本号格式为 `X.Y.Z-N`（如 `2.1.49-1`），其中 `X.Y.Z` 对应上游版本，`-N` 是本地 patch 序号
- `canary` 分支上，上游代码在下、fork 专属 commit 在上

### Fork 专属功能

本仓库包含一些不打算合并到上游的专属功能。这些功能的 commit message 会明确说明目的和涉及的文件，以便未来 rebase 时解决冲突。

**解决 rebase 冲突的原则：**

1. 先阅读冲突 commit 的 message，理解该 commit 的目的
2. 如果冲突来自 fork 专属功能：保留我们的改动，同时适配上游的新代码结构
3. 如果冲突来自上游重构了我们也修改过的文件：以上游新结构为准，将我们的改动迁移到新结构上
4. fork 专属代码应尽量放在**新文件**中（如 `src/utils/`、`src/features/` 下的新模块），对上游文件只做最小侵入式修改，以减少冲突概率

### 降低冲突的编码规范

- 新功能的核心逻辑放在独立的新文件中
- 对上游文件的修改控制在最少的 "接入点"（import + 调用），避免大段内联代码
- commit message 中说明：改了哪些上游文件、为什么改、改动的性质（新增接入点 vs 修改逻辑）
- fork 专属的数据库表放在独立 schema 文件中（如 `schemas/fork_*.ts`），不修改上游 schema 文件；若必须给上游表加列，在 commit message 中明确写出

### 数据库 Migration 冲突处理

本项目使用 Drizzle ORM，migration 采用顺序编号（`NNNN_name.sql`），rebase 上游时编号必然冲突。**migration SQL 和 meta 是生成产物**，冲突时不手动合并，按以下流程处理：

1. 对 `packages/database/migrations/` 目录下的所有冲突文件，**全部接受上游版本**（`git checkout --theirs packages/database/migrations/`）
2. 正常解决 `packages/database/src/schemas/*.ts` 中的冲突，保留 fork 的改动
3. 运行 `bun run db:generate` 重新生成 migration — Drizzle 会对比当前 schema 和上游最新 snapshot 的差异，自动生成正确编号的新 migration
4. 重命名生成的 migration 文件为有意义的名字，更新 `_journal.json` 中对应的 tag
5. `git add` 新生成的文件，继续 rebase
