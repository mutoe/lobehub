# CLAUDE.md

Guidelines for using Claude Code in this LobeHub repository.

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- SPA inside Next.js with `react-router-dom`
- `@lobehub/ui`, antd for components; antd-style for CSS-in-JS — **prefer `createStaticStyles` with `cssVar.*`** (zero-runtime); only fall back to `createStyles` + `token` when styles genuinely need runtime computation. See `.cursor/docs/createStaticStyles_migration_guide.md`.
- react-i18next for i18n; zustand for state management
- SWR for data fetching; TRPC for type-safe backend
- Drizzle ORM with PostgreSQL; Vitest for testing

## Project Structure

```plaintext
lobehub/
├── apps/desktop/           # Electron desktop app
├── packages/               # Shared packages (@lobechat/*)
│   ├── database/           # Database schemas, models, repositories
│   ├── agent-runtime/      # Agent runtime
│   └── ...
├── src/
│   ├── app/                # Next.js App Router (backend API + auth)
│   │   ├── (backend)/     # API routes (trpc, webapi, etc.)
│   │   ├── spa/            # SPA HTML template service
│   │   └── [variants]/(auth)/  # Auth pages (SSR required)
│   ├── routes/             # SPA page components (Vite)
│   │   ├── (main)/         # Desktop pages
│   │   ├── (mobile)/       # Mobile pages
│   │   ├── (desktop)/      # Desktop-specific pages
│   │   ├── onboarding/     # Onboarding pages
│   │   └── share/          # Share pages
│   ├── spa/                # SPA entry points and router config
│   │   ├── entry.web.tsx   # Web entry
│   │   ├── entry.mobile.tsx
│   │   ├── entry.desktop.tsx
│   │   └── router/         # React Router configuration
│   ├── store/              # Zustand stores
│   ├── services/           # Client services
│   ├── server/             # Server services and routers
│   └── ...
└── e2e/                    # E2E tests (Cucumber + Playwright)
```

## SPA Routes and Features

SPA-related code is grouped under `src/spa/` (entries + router) and `src/routes/` (page segments). We use a **roots vs features** split: route trees only hold page segments; business logic and UI live in features.

- **`src/spa/`** – SPA entry points (`entry.web.tsx`, `entry.mobile.tsx`, `entry.desktop.tsx`) and React Router config (`router/`). Keeps router config next to entries to avoid confusion with `src/routes/`.

- **`src/routes/` (roots)**\
  Only page-segment files: `_layout/index.tsx`, `index.tsx` (or `page.tsx`), and dynamic segments like `[id]/index.tsx`. Keep these **thin**: they should only import from `@/features/*` and compose layout/page, with no business logic or heavy UI.

- **`src/features/`**\
  Business components by **domain** (e.g. `Pages`, `PageEditor`, `Home`). Put layout chunks (sidebar, header, body), hooks, and domain-specific UI here. Each feature exposes an `index.ts` (or `index.tsx`) with clear exports.

When adding or changing SPA routes:

1. In `src/routes/`, add only the route segment files (layout + page) that delegate to features.
2. Implement layout and page content under `src/features/<Domain>/` and export from there.
3. In route files, use `import { X } from '@/features/<Domain>'` (or `import Y from '@/features/<Domain>/...'`). Do not add new `features/` folders inside `src/routes/`.
4. **Register the desktop route tree in both configs:** `src/spa/router/desktopRouter.config.tsx` and `src/spa/router/desktopRouter.config.desktop.tsx` must stay in sync (same paths and nesting). Updating only one can cause **blank screens** if the other build path expects the route.

See the **spa-routes** skill (`.agents/skills/spa-routes/SKILL.md`) for the full convention and file-division rules.

## Development

### Starting the Dev Environment

```bash
# SPA dev mode (frontend only, proxies API to localhost:3010)
bun run dev:spa

# Full-stack dev (Next.js + Vite SPA concurrently)
bun run dev
```

After `dev:spa` starts, the terminal prints a **Debug Proxy** URL:

```plaintext
Debug Proxy: https://app.lobehub.com/_dangerous_local_dev_proxy?debug-host=http%3A%2F%2Flocalhost%3A9876
```

Open this URL to develop locally against the production backend (app.lobehub.com). The proxy page loads your local Vite dev server's SPA into the online environment, enabling HMR with real server config.

### Git Workflow

- **Branch strategy**: `canary` is the development branch (cloud production); `main` is the release branch (periodically cherry-picks from canary)
- New branches should be created from `canary`; PRs should target `canary`
- Use rebase for `git pull`
- Commit messages: prefix with gitmoji
- Branch format: `<type>/<feature-name>`

### Package Management

- `pnpm` for dependency management
- `bun` to run npm scripts
- `bunx` for executable npm packages

### Testing

```bash
# Run specific test (NEVER run `bun run test` - takes ~10 minutes)
bunx vitest run --silent='passed-only' '[file-path]'

# Database package
cd packages/database && bunx vitest run --silent='passed-only' '[file]'
```

- Prefer `vi.spyOn` over `vi.mock`
- Tests must pass type check: `bun run type-check`
- After 2 failed fix attempts, stop and ask for help

### i18n

- Add keys to `src/locales/default/namespace.ts`
- For dev preview: translate `locales/zh-CN/` and `locales/en-US/`
- Don't run `pnpm i18n` - CI handles it

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

## Skills (Auto-loaded by Claude)

Claude Code automatically loads relevant skills from `.agents/skills/`.
