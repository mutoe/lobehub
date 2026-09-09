#!/usr/bin/env bash
# 把 lobehub 部署到 NAS（本地交叉编译 → docker save/load 直传 → compose up → 健康检查）
#
# fork 专属脚本，不经过 GitHub Actions / ghcr：
#   1. git archive 干净上下文 + buildx 交叉编译 linux/amd64 镜像（Mac 是 arm64，NAS 是 amd64）
#   2. docker save | gzip | ssh ds docker load（镜像不进 registry）
#   3. 给 NAS 上的旧 latest 打 rollback-nas-<日期> 标签留退路
#   4. ssh 到 NAS docker compose up -d lobe（容器启动时自动跑 db migration）
#   5. 轮询 /signin 直到 200，并核对容器镜像的版本 label
#
# 用法：
#   scripts/deploy-nas.sh                # 部署 HEAD
#   scripts/deploy-nas.sh v2.2.16-canary.26-1   # 部署指定 tag / commit
#   scripts/deploy-nas.sh --build-only   # 只构建不推送（验证构建链路）
#   scripts/deploy-nas.sh --skip-build   # 复用本地已有镜像，只做传输 + 重启
#
# 前提：
#   - ~/.ssh/config 有 ds 别名；NAS 上 docker 全路径 /usr/local/bin/docker，当前用户免 sudo
#   - colima 已启用 rosetta，VM 内挂了 8G swap（Dockerfile 的 --max-old-space-size=8192 需要）
#   - NAS 侧 /volume3/docker/lobehub/{docker-compose.yml,.env} 已就绪，本脚本只换镜像不动编排
#   - 为什么 git archive：.dockerignore 只排除根目录 node_modules，packages/*/node_modules 的
#     宿主 pnpm 符号链接会被 COPY 进镜像变成断链；archive 等价于 CI 的 fresh checkout
#   - 为什么 USE_CN_MIRROR：ffmpeg-static 的 postinstall 从 release-assets.githubusercontent.com
#     下载二进制，家庭网络不通；fork 的 Dockerfile 在该开关下改走 npmmirror
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

TARGET_HOST="ds"
IMAGE="ghcr.io/mutoe/lobehub"
SERVICE_DIR="/volume3/docker/lobehub"
SERVICE_NAME="lobe"
CONTAINER_NAME="lobehub"
HOST_PORT=3211
NAS_DOCKER="/usr/local/bin/docker"
HEALTH_TIMEOUT=180

REF="HEAD"
BUILD_ONLY=false
SKIP_BUILD=false
for arg in "$@"; do
  case "$arg" in
    --build-only) BUILD_ONLY=true ;;
    --skip-build) SKIP_BUILD=true ;;
    -h|--help) sed -n '2,25p' "$0"; exit 0 ;;
    *) REF="$arg" ;;
  esac
done

# ^{commit} 把 annotated tag 剥成 commit，否则 revision label 会写成 tag 对象的 sha
COMMIT="$(git rev-parse "$REF^{commit}")"
SHA_SHORT="$(git rev-parse --short "$REF^{commit}")"
VERSION="$(git show "$COMMIT:package.json" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).version")"
LOG_DIR="${TMPDIR:-/tmp}/lobehub-deploy"
mkdir -p "$LOG_DIR"
BUILD_LOG="$LOG_DIR/build-$VERSION-$SHA_SHORT.log"

echo "==> Deploy target: $TARGET_HOST:$SERVICE_DIR ($CONTAINER_NAME)"
echo "==> Source: $REF -> $SHA_SHORT, version $VERSION"

if [ "$REF" = "HEAD" ] && [ -n "$(git status --porcelain)" ]; then
  echo "!! 工作区有未提交改动，镜像只包含已提交内容（git archive HEAD）。" >&2
  git status --short | head -10 >&2
fi

# ---------- 前置检查 ----------
if [ "$SKIP_BUILD" = false ]; then
  if ! docker info >/dev/null 2>&1; then
    echo "FAIL: 本地 docker 不可用（colima 没起来？）" >&2; exit 1
  fi
  SWAP_KB="$(colima ssh -- sh -c 'grep SwapTotal /proc/meminfo' 2>/dev/null | awk '{print $2}' || echo 0)"
  if [ "${SWAP_KB:-0}" -lt 4000000 ]; then
    echo "!! colima VM 没有足够 swap（当前 ${SWAP_KB:-0} kB）。Vite 构建会 OOM。" >&2
    echo "   修复：colima ssh -- sudo sh -c 'fallocate -l 8G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile'" >&2
    exit 1
  fi
fi
if [ "$BUILD_ONLY" = false ]; then
  if ! ssh -o ConnectTimeout=8 "$TARGET_HOST" "$NAS_DOCKER compose version" >/dev/null 2>&1; then
    echo "FAIL: 无法通过 ssh $TARGET_HOST 调用 docker compose" >&2; exit 1
  fi
fi

# ---------- 构建 ----------
if [ "$SKIP_BUILD" = false ]; then
  echo "==> Building $IMAGE:$VERSION (linux/amd64), log: $BUILD_LOG"
  START=$(date +%s)
  # pipefail 保证 git archive 或 buildx 任一失败都会让整条管道失败，避免"假成功"
  git archive --format=tar "$COMMIT" \
    | docker buildx build --platform linux/amd64 \
        --build-arg USE_CN_MIRROR=true \
        --build-arg "SHA=$SHA_SHORT" \
        --label "org.opencontainers.image.version=$VERSION" \
        --label "org.opencontainers.image.revision=$COMMIT" \
        -t "$IMAGE:latest" -t "$IMAGE:$VERSION" \
        --load - >"$BUILD_LOG" 2>&1
  echo "==> Build OK in $(( $(date +%s) - START ))s"
  docker image inspect "$IMAGE:$VERSION" --format '    image {{.Id}} size {{.Size}} arch {{.Architecture}}'
else
  docker image inspect "$IMAGE:$VERSION" >/dev/null 2>&1 || { echo "FAIL: 本地没有 $IMAGE:$VERSION，不能 --skip-build" >&2; exit 1; }
  docker tag "$IMAGE:$VERSION" "$IMAGE:latest"
fi

if [ "$BUILD_ONLY" = true ]; then
  echo "==> --build-only，到此为止。"; exit 0
fi

# ---------- 保留退路 ----------
echo "==> Tagging current NAS latest as rollback-nas-$(date +%Y%m%d)..."
ssh "$TARGET_HOST" "$NAS_DOCKER tag $IMAGE:latest $IMAGE:rollback-nas-$(date +%Y%m%d) 2>/dev/null || echo '    (NAS 上没有现成的 latest，跳过)'"

# ---------- 传输 ----------
echo "==> Transferring image to $TARGET_HOST (save | gzip | ssh load)..."
START=$(date +%s)
docker save "$IMAGE:latest" "$IMAGE:$VERSION" | gzip -1 | ssh "$TARGET_HOST" "$NAS_DOCKER load"
echo "==> Transfer OK in $(( $(date +%s) - START ))s"

# ---------- 重启 ----------
# --no-deps 必须带：不带时 compose 会顺手重建配置 hash 有漂移的 postgres/redis，
# 并重跑一次性的 rustfs-init（它在新版 RustFS 上因 bucket.config.json 的 "ID" 字段失败），
# depends_on 的 service_completed_successfully 不满足，lobe 根本不会启动 → 站点直接宕机。
# diun-authz 的 webhook 路径同样是 rm -sf + up -d --no-deps（2026-09-04 实测踩坑）。
echo "==> Recreating $SERVICE_NAME on $TARGET_HOST (容器启动时自动跑 migration)..."
ssh "$TARGET_HOST" "cd $SERVICE_DIR && $NAS_DOCKER compose up -d --no-deps $SERVICE_NAME"

# ---------- 健康检查 ----------
echo "==> Health check (最多 ${HEALTH_TIMEOUT}s)..."
ssh "$TARGET_HOST" "
  for i in \$(seq 1 $HEALTH_TIMEOUT); do
    code=\$(curl -s -o /dev/null -w '%{http_code}' -m 5 http://127.0.0.1:$HOST_PORT/signin 2>/dev/null)
    if [ \"\$code\" = '200' ]; then
      echo \"OK signin 200 (\${i}s)\"
      $NAS_DOCKER inspect $CONTAINER_NAME --format '    running: {{index .Config.Labels \"org.opencontainers.image.version\"}} @ {{index .Config.Labels \"org.opencontainers.image.revision\"}}'
      exit 0
    fi
    sleep 1
  done
  echo 'FAIL: signin 未在 ${HEALTH_TIMEOUT}s 内返回 200，最近日志：'
  $NAS_DOCKER logs --tail 40 $CONTAINER_NAME 2>&1
  exit 1
"

RUNNING="$(ssh "$TARGET_HOST" "$NAS_DOCKER inspect $CONTAINER_NAME --format '{{index .Config.Labels \"org.opencontainers.image.version\"}}'")"
if [ "$RUNNING" != "$VERSION" ]; then
  echo "FAIL: 容器在跑的版本是 $RUNNING，期望 $VERSION" >&2; exit 1
fi

echo "==> Done. $IMAGE:$VERSION is live on $TARGET_HOST."
echo "    回滚：ssh $TARGET_HOST '$NAS_DOCKER tag $IMAGE:rollback-nas-$(date +%Y%m%d) $IMAGE:latest && cd $SERVICE_DIR && $NAS_DOCKER compose up -d --no-deps $SERVICE_NAME'"
