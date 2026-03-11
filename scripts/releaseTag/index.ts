/**
 * 改 version、打 tag 的发布脚本
 * - 显示当前版本，默认建议「下一个版本」（2.1.39 -> 2.1.39-1，2.1.39-1 -> 2.1.39-2）
 * - 用户可修改版本号后，更新 root + apps/desktop package.json，commit 并打 tag
 */
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import path from 'node:path';

import { confirm, input } from '@inquirer/prompts';
import { consola } from 'consola';
import * as semver from 'semver';

const ROOT_DIR = process.cwd();
const ROOT_PKG = path.join(ROOT_DIR, 'package.json');
const DESKTOP_PKG = path.join(ROOT_DIR, 'apps', 'desktop', 'package.json');

function checkGitRepo(): void {
  try {
    execSync('git rev-parse --git-dir', { cwd: ROOT_DIR, stdio: 'ignore' });
  } catch {
    consola.error('❌ 当前目录不是 Git 仓库');
    process.exit(1);
  }
}

function getCurrentVersion(): string {
  try {
    const pkg = JSON.parse(fs.readFileSync(ROOT_PKG, 'utf8'));
    const v = pkg?.version;
    if (!v || typeof v !== 'string') {
      consola.error('❌ package.json 中缺少 version 字段');
      process.exit(1);
    }
    return v;
  } catch (e) {
    consola.error('❌ 无法读取 package.json:', e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

/**
 * 计算「下一个版本」：
 * - 2.1.39 -> 2.1.39-1
 * - 2.1.39-1 -> 2.1.39-2
 * - 2.1.39-2 -> 2.1.39-3
 */
function getNextVersion(current: string): string {
  const parsed = semver.parse(current);
  if (!parsed) return `${current}-1`;

  const pre = parsed.prerelease;
  if (pre && pre.length > 0) {
    const next = semver.inc(current, 'prerelease');
    return next ?? `${parsed.major}.${parsed.minor}.${parsed.patch}-${Number(pre[0]) + 1}`;
  }
  return `${parsed.major}.${parsed.minor}.${parsed.patch}-1`;
}

function setVersion(version: string): void {
  for (const file of [ROOT_PKG, DESKTOP_PKG]) {
    if (!fs.existsSync(file)) continue;
    const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
    pkg.version = version;
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    consola.success(`  ${path.relative(ROOT_DIR, file)} -> ${version}`);
  }
}

async function main(): Promise<void> {
  consola.info('📦 发布：改 version + 打 tag\n');

  checkGitRepo();
  const current = getCurrentVersion();
  const defaultNext = getNextVersion(current);

  consola.info(`当前版本: ${current}`);
  consola.info(`建议下一版本: ${defaultNext}\n`);

  const version = await input({
    default: defaultNext,
    message: '新版本号',
    validate: (value) => {
      const v = value.trim();
      if (!v) return '请输入版本号';
      if (!semver.valid(v)) return `无效的 semver: ${v}`;
      return true;
    },
  });

  const newVersion = version.trim();
  consola.info(
    `\n将执行:\n  1. 将 version 改为 ${newVersion}（root + apps/desktop）\n  2. git add & commit\n  3. git tag v${newVersion}\n`,
  );

  const ok = await confirm({ default: true, message: '确认执行？' });
  if (!ok) {
    consola.info('已取消');
    process.exit(0);
  }

  setVersion(newVersion);

  execSync('git add package.json apps/desktop/package.json', { cwd: ROOT_DIR, stdio: 'inherit' });
  execSync(`git commit --no-verify -m "chore: release v${newVersion}"`, {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  });
  execSync(`git tag v${newVersion}`, { cwd: ROOT_DIR, stdio: 'inherit' });

  consola.success(`\n✅ 已提交并打 tag: v${newVersion}`);

  const shouldPush = await confirm({
    default: true,
    message: '是否自动推送到远程？(git push + git push origin v' + newVersion + ')',
  });
  if (shouldPush) {
    execSync('git push', { cwd: ROOT_DIR, stdio: 'inherit' });
    execSync(`git push origin v${newVersion}`, { cwd: ROOT_DIR, stdio: 'inherit' });
    consola.success('已推送分支与 tag');
  } else {
    consola.info('\n稍后手动推送:\n  git push\n  git push origin v' + newVersion);
  }
}

main().catch((e) => {
  consola.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
