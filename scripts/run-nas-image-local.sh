#!/usr/bin/env bash
# 在本机跑一份和 NAS 同款的镜像，给 Android 模拟器测 PWA / Service Worker 用
#
# fork 专属脚本。为什么需要它：Service Worker、manifest、Web Share Target 只在
# 生产构建里存在（dev 模式直接跳过注册），而模拟器里只有 http://localhost 算安全
# 上下文。所以路线是：deploy-nas.sh --build-only 产出的镜像在本机起一个容器，
# 用 adb reverse 把模拟器的 localhost:PORT 映射到本机，模拟器里打开
# http://localhost:PORT 就是一个 SW 可注册、可安装、可收分享的完整实例。
#
# 数据侧接的是 NAS 上的生产 Postgres / Redis / RustFS —— 和线上是同一份数据，
# 只是 APP_URL 换成 localhost。容器启动会跑 db migration，和部署到 NAS 时跑的是
# 同一套，因此本地起容器前先确认 HEAD 没有还没打算上线的 migration。
#
# 用法：
#   scripts/run-nas-image-local.sh            # 跑 package.json 版本对应的镜像
#   scripts/run-nas-image-local.sh 2.2.17-canary.15-2
#   scripts/run-nas-image-local.sh --stop     # 停容器、撤 adb reverse
#
# 前提：ssh 别名 ds 可用；docker（colima + rosetta）可跑 linux/amd64；
#       模拟器已启动时会自动做 adb reverse，没启动也不影响容器本身。
set -euo pipefail

PORT="${LOCAL_PORT:-3210}"
NAME=lobehub-local
ADB="${ADB:-$HOME/Library/Android/sdk/platform-tools/adb}"

if [[ "${1:-}" == "--stop" ]]; then
  docker rm -f "$NAME" >/dev/null 2>&1 && echo "==> Stopped $NAME" || echo "==> $NAME not running"
  [[ -x "$ADB" ]] && "$ADB" reverse --remove "tcp:$PORT" >/dev/null 2>&1 || true
  exit 0
fi

cd "$(dirname "$0")/.."

TAG="${1:-$(node -p "require('./package.json').version")}"
IMAGE="ghcr.io/mutoe/lobehub:$TAG"

if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "FAIL: 本地没有镜像 $IMAGE，先跑 scripts/deploy-nas.sh --build-only" >&2
  exit 1
fi

NAS_HOST="$(ssh -G ds | awk '/^hostname /{print $2}')"
ENV_DIR="${TMPDIR:-/tmp}/lobehub-local"
mkdir -p "$ENV_DIR"
chmod 700 "$ENV_DIR"
NAS_ENV="$ENV_DIR/nas.env"
LOCAL_ENV="$ENV_DIR/local.env"

echo "==> Fetching NAS .env (kept only under $ENV_DIR)"
ssh ds cat /volume3/docker/lobehub/.env > "$NAS_ENV"

# 取 .env 里某个键的值，去掉包裹引号
val() { grep -E "^$1=" "$NAS_ENV" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }

# compose 里由 environment: 块拼出来的变量，这里按本机可达的地址重新拼；
# 被覆盖的键先从 NAS .env 里剔掉，避免 --env-file 里同名键谁生效的歧义。
OVERRIDE_KEYS='APP_URL|DATABASE_URL|REDIS_URL|REDIS_PREFIX|REDIS_TLS|S3_ENDPOINT|S3_BUCKET|S3_ENABLE_PATH_STYLE|S3_ACCESS_KEY|S3_ACCESS_KEY_ID|S3_SECRET_ACCESS_KEY|S3_SET_ACL|KEY_VAULTS_SECRET|AUTH_SECRET|LLM_VISION_IMAGE_USE_BASE64|SSRF_ALLOW_PRIVATE_IP_ADDRESS'
{
  grep -vE "^($OVERRIDE_KEYS)=" "$NAS_ENV" | grep -vE '^\s*(#|$)'
  cat <<EOF
APP_URL=http://localhost:$PORT
KEY_VAULTS_SECRET=$(val KEY_VAULTS_SECRET)
AUTH_SECRET=$(val AUTH_SECRET)
DATABASE_URL=postgresql://postgres:$(val POSTGRES_PASSWORD)@$NAS_HOST:$(val POSTGRES_PORT)/$(val LOBE_DB_NAME)
REDIS_URL=redis://$NAS_HOST:$(val REDIS_PORT)
REDIS_PREFIX=lobechat
REDIS_TLS=0
S3_ENDPOINT=$(val S3_ENDPOINT)
S3_BUCKET=$(val RUSTFS_LOBE_BUCKET)
S3_ENABLE_PATH_STYLE=1
S3_ACCESS_KEY=$(val RUSTFS_ACCESS_KEY)
S3_ACCESS_KEY_ID=$(val RUSTFS_ACCESS_KEY)
S3_SECRET_ACCESS_KEY=$(val RUSTFS_SECRET_KEY)
S3_SET_ACL=0
LLM_VISION_IMAGE_USE_BASE64=1
SSRF_ALLOW_PRIVATE_IP_ADDRESS=1
EOF
} > "$LOCAL_ENV"
chmod 600 "$NAS_ENV" "$LOCAL_ENV"

docker rm -f "$NAME" >/dev/null 2>&1 || true
echo "==> Starting $IMAGE as $NAME on :$PORT (linux/amd64 under rosetta)"
docker run -d --rm --name "$NAME" --platform linux/amd64 \
  -p "$PORT:3210" --env-file "$LOCAL_ENV" "$IMAGE" >/dev/null

if [[ -x "$ADB" ]] && "$ADB" get-state >/dev/null 2>&1; then
  "$ADB" reverse "tcp:$PORT" "tcp:$PORT" >/dev/null
  echo "==> adb reverse tcp:$PORT -> host (模拟器里打开 http://localhost:$PORT)"
else
  echo "==> 没检测到模拟器，跳过 adb reverse；起了以后手动: adb reverse tcp:$PORT tcp:$PORT"
fi

echo "==> Health check (最多 180s)..."
for i in $(seq 1 180); do
  code="$(curl -s -o /dev/null -w '%{http_code}' -m 5 "http://127.0.0.1:$PORT/signin" 2>/dev/null || true)"
  if [[ "$code" == "200" ]]; then
    echo "OK signin 200 (${i}s)"
    echo "==> http://localhost:$PORT  （停：scripts/run-nas-image-local.sh --stop；日志：docker logs -f $NAME）"
    exit 0
  fi
  sleep 1
done

echo "FAIL: signin 未在 180s 内返回 200，最近日志：" >&2
docker logs --tail 40 "$NAME" >&2 || true
exit 1
