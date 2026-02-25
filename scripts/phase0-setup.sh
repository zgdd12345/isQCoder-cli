#!/usr/bin/env bash
# =============================================================================
# Phase 0: 预备阶段 — 自动化设置脚本
# isQCoder-cli 开发环境初始化
# =============================================================================
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ISQCODEAGENT_ROOT="$(cd "$PROJECT_ROOT/../isQCodeAgent" && pwd)"

# Counters
PASS=0
FAIL=0
SKIP=0

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

print_step() {
    echo -e "\n${YELLOW}▸ $1${NC}"
}

print_pass() {
    echo -e "  ${GREEN}✅ $1${NC}"
    ((PASS++))
}

print_fail() {
    echo -e "  ${RED}❌ $1${NC}"
    ((FAIL++))
}

print_skip() {
    echo -e "  ${YELLOW}⏭️  $1${NC}"
    ((SKIP++))
}

print_info() {
    echo -e "  ${BLUE}ℹ️  $1${NC}"
}

# =============================================================================
# 0.1 npm scope 验证
# =============================================================================
task_01_npm_scope() {
    print_header "0.1 npm @isqcoder scope 验证"

    print_step "检查 package.json 中是否使用 @isqcoder scope..."
    local pkg_name
    pkg_name=$(node -p "require('$PROJECT_ROOT/package.json').name" 2>/dev/null)

    if [[ "$pkg_name" == @isqcoder/* ]]; then
        print_pass "package.json name = '$pkg_name' (使用 @isqcoder scope)"
    else
        print_fail "package.json name = '$pkg_name' (未使用 @isqcoder scope)"
    fi

    print_step "检查 npmjs.com 上 @isqcoder scope 可用性..."
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "https://registry.npmjs.org/@isqcoder%2fisqcoder-cli" 2>/dev/null || echo "000")

    if [[ "$http_code" == "404" ]]; then
        print_info "包 @isqcoder/isqcoder-cli 尚未发布 (404) — 名称可用"
        print_info "请手动前往 https://www.npmjs.com/org/create 创建 @isqcoder organization"
    elif [[ "$http_code" == "200" ]]; then
        print_pass "@isqcoder/isqcoder-cli 已在 npmjs.com 上存在"
    else
        print_info "无法访问 npmjs.com (HTTP $http_code)，请手动验证"
    fi

    # Check all workspace package names
    print_step "检查各 workspace 包名..."
    for pkg_json in "$PROJECT_ROOT"/packages/*/package.json; do
        local ws_name
        ws_name=$(node -p "require('$pkg_json').name" 2>/dev/null || echo "PARSE_ERROR")
        local ws_dir
        ws_dir=$(basename "$(dirname "$pkg_json")")
        echo -e "    📦 $ws_dir: $ws_name"
    done
}

# =============================================================================
# 0.2 MCP Python SDK 兼容性验证
# =============================================================================
task_02_mcp_sdk() {
    print_header "0.2 MCP Python SDK 兼容性验证"

    if [[ ! -d "$ISQCODEAGENT_ROOT" ]]; then
        print_fail "isQCodeAgent 目录不存在: $ISQCODEAGENT_ROOT"
        return
    fi

    print_step "检查 Python 版本..."
    local py_version
    py_version=$(python3 --version 2>/dev/null || echo "NOT FOUND")
    echo -e "    Python: $py_version"

    print_step "检查/创建 isQCodeAgent 虚拟环境..."
    local venv_path="$ISQCODEAGENT_ROOT/.venv"

    if [[ ! -d "$venv_path" ]]; then
        print_info "创建虚拟环境: $venv_path"
        python3 -m venv "$venv_path"
        if [[ $? -eq 0 ]]; then
            print_pass "虚拟环境创建成功"
        else
            print_fail "虚拟环境创建失败"
            return
        fi
    else
        print_pass "虚拟环境已存在: $venv_path"
    fi

    print_step "激活虚拟环境并安装 mcp-python-sdk..."
    # shellcheck disable=SC1091
    source "$venv_path/bin/activate"

    # Install mcp SDK
    pip install --quiet mcp 2>/dev/null
    if [[ $? -eq 0 ]]; then
        print_pass "mcp-python-sdk 安装成功"
    else
        print_fail "mcp-python-sdk 安装失败"
        deactivate 2>/dev/null || true
        return
    fi

    print_step "验证 MCP SDK 可导入..."
    local mcp_test
    mcp_test=$(python3 -c "from mcp.server import Server; print('MCP SDK OK')" 2>&1)
    if [[ "$mcp_test" == *"MCP SDK OK"* ]]; then
        print_pass "MCP SDK 导入成功: $mcp_test"
    else
        print_fail "MCP SDK 导入失败: $mcp_test"
    fi

    print_step "检查与 isQCodeAgent 依赖的兼容性..."
    # Install isQCodeAgent dependencies
    if [[ -f "$ISQCODEAGENT_ROOT/requirements.txt" ]]; then
        print_info "安装 isQCodeAgent 依赖..."
        pip install --quiet -r "$ISQCODEAGENT_ROOT/requirements.txt" 2>&1 | tail -5
        if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
            print_pass "isQCodeAgent 依赖安装成功 — 无冲突"
        else
            print_fail "isQCodeAgent 依赖安装存在冲突"
        fi
    fi

    # Verify MCP still works after installing all deps
    local mcp_retest
    mcp_retest=$(python3 -c "from mcp.server import Server; print('MCP STILL OK')" 2>&1)
    if [[ "$mcp_retest" == *"MCP STILL OK"* ]]; then
        print_pass "安装所有依赖后 MCP SDK 仍可正常工作 — 无冲突"
    else
        print_fail "安装所有依赖后 MCP SDK 不可用: $mcp_retest"
    fi

    # Check if mcp is already in requirements
    print_step "检查 mcp 是否已在 requirements.txt 中..."
    if grep -q "^mcp" "$ISQCODEAGENT_ROOT/requirements.txt" 2>/dev/null; then
        print_pass "mcp 已在 requirements.txt 中"
    else
        print_info "mcp 不在 requirements.txt 中 — 将自动添加"
        echo "" >> "$ISQCODEAGENT_ROOT/requirements.txt"
        echo "# MCP Server SDK" >> "$ISQCODEAGENT_ROOT/requirements.txt"
        echo "mcp>=1.0.0" >> "$ISQCODEAGENT_ROOT/requirements.txt"
        print_pass "已将 mcp 添加到 requirements.txt"
    fi

    # Show MCP SDK version
    local mcp_ver
    mcp_ver=$(pip show mcp 2>/dev/null | grep -i "^version:" || echo "unknown")
    print_info "MCP SDK 版本: $mcp_ver"

    deactivate 2>/dev/null || true
}

# =============================================================================
# 0.3 Docker 镜像验证
# =============================================================================
task_03_docker() {
    print_header "0.3 Docker 镜像验证"

    print_step "检查 Docker 是否安装..."
    if command -v docker &>/dev/null; then
        local docker_ver
        docker_ver=$(docker --version)
        print_pass "Docker 已安装: $docker_ver"
    else
        print_fail "Docker 未安装"
        return
    fi

    print_step "检查 Docker daemon 是否运行..."
    if docker info &>/dev/null; then
        print_pass "Docker daemon 正在运行"
    else
        print_fail "Docker daemon 未运行 — 请启动 Docker Desktop"
        return
    fi

    print_step "检查 isqc-python / arclightquantum/isqc 镜像..."
    local image_name="arclightquantum/isqc:ubuntu-0.0.1"

    if docker image inspect "$image_name" &>/dev/null; then
        print_pass "镜像已存在本地: $image_name"
    else
        print_info "本地不存在镜像，尝试拉取: $image_name"
        if docker pull "$image_name" 2>&1; then
            print_pass "镜像拉取成功: $image_name"
        else
            print_fail "镜像拉取失败: $image_name"
            print_info "可以尝试构建自定义镜像: docker build -t isq-sandbox:latest -f $ISQCODEAGENT_ROOT/docker/Dockerfile.isq $ISQCODEAGENT_ROOT"
            return
        fi
    fi

    print_step "验证 isqc 编译器可用..."
    local isqc_ver
    isqc_ver=$(docker run --rm "$image_name" isqc --version 2>&1 || echo "FAILED")
    if [[ "$isqc_ver" != "FAILED" ]]; then
        print_pass "isqc 编译器可用: $isqc_ver"
    else
        print_fail "isqc 编译器不可用"
    fi

    print_step "验证 isqtools Python 模块..."
    local isqtools_test
    isqtools_test=$(docker run --rm "$image_name" python3 -c "import isqtools; print('isqtools OK')" 2>&1 || echo "FAILED")
    if [[ "$isqtools_test" == *"isqtools OK"* ]]; then
        print_pass "isqtools 在 Docker 中可正常导入"
    else
        print_info "isqtools 测试结果: $isqtools_test"
        print_info "isqtools 可能需要在镜像中额外安装 (pip install isqtools)"
        # Try with pip install
        local isqtools_test2
        isqtools_test2=$(docker run --rm "$image_name" bash -c "pip3 install isqtools 2>/dev/null && python3 -c 'import isqtools; print(\"isqtools OK\")'" 2>&1 || echo "FAILED")
        if [[ "$isqtools_test2" == *"isqtools OK"* ]]; then
            print_pass "isqtools 可通过 pip 安装后使用"
        else
            print_fail "isqtools 在 Docker 镜像中不可用: $isqtools_test2"
        fi
    fi
}

# =============================================================================
# 0.4 上游同步基线
# =============================================================================
task_04_upstream() {
    print_header "0.4 上游同步基线"

    print_step "检查 upstream remote..."
    if git -C "$PROJECT_ROOT" remote get-url upstream &>/dev/null; then
        local upstream_url
        upstream_url=$(git -C "$PROJECT_ROOT" remote get-url upstream)
        print_pass "upstream remote 已配置: $upstream_url"
    else
        print_info "添加 upstream remote..."
        git -C "$PROJECT_ROOT" remote add upstream https://github.com/google-gemini/gemini-cli.git
        git -C "$PROJECT_ROOT" fetch upstream --tags
        print_pass "upstream remote 已添加并 fetch"
    fi

    print_step "检查 upstream 跟踪分支..."
    if git -C "$PROJECT_ROOT" rev-parse --verify upstream &>/dev/null; then
        local upstream_commit
        upstream_commit=$(git -C "$PROJECT_ROOT" rev-parse --short upstream)
        print_pass "upstream 分支已存在 @ $upstream_commit"
    else
        print_info "创建 upstream 分支 @ v0.30.0-nightly.20260210.8257ec447..."
        git -C "$PROJECT_ROOT" branch upstream v0.30.0-nightly.20260210.8257ec447
        print_pass "upstream 分支已创建"
    fi

    print_step "当前分支状态..."
    local current_branch
    current_branch=$(git -C "$PROJECT_ROOT" branch --show-current)
    local commit_count
    commit_count=$(git -C "$PROJECT_ROOT" log --oneline v0.30.0-nightly.20260210.8257ec447..HEAD 2>/dev/null | wc -l | tr -d ' ')
    print_info "当前分支: $current_branch (基线后 $commit_count 个提交)"

    print_step "显示 upstream/main 最新状态..."
    local upstream_head
    upstream_head=$(git -C "$PROJECT_ROOT" log --oneline -1 upstream/main 2>/dev/null || echo "未 fetch")
    print_info "upstream/main HEAD: $upstream_head"

    local commits_behind
    commits_behind=$(git -C "$PROJECT_ROOT" log --oneline HEAD..upstream/main 2>/dev/null | wc -l | tr -d ' ')
    print_info "当前落后 upstream $commits_behind 个提交"
}

# =============================================================================
# 0.5 npm preflight 检查
# =============================================================================
task_05_preflight() {
    print_header "0.5 npm preflight 检查"

    print_step "检查 node_modules..."
    if [[ -d "$PROJECT_ROOT/node_modules" ]]; then
        print_pass "node_modules 已存在"
    else
        print_info "node_modules 不存在, 运行 npm install..."
        (cd "$PROJECT_ROOT" && npm install 2>&1 | tail -5)
        if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
            print_pass "npm install 成功"
        else
            print_fail "npm install 失败"
            return
        fi
    fi

    print_step "运行 npm run build..."
    (cd "$PROJECT_ROOT" && npm run build 2>&1 | tail -10)
    if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
        print_pass "npm run build 成功"
    else
        print_fail "npm run build 失败"
    fi

    print_step "运行 npm run typecheck..."
    (cd "$PROJECT_ROOT" && npm run typecheck 2>&1 | tail -10)
    if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
        print_pass "typecheck 通过"
    else
        print_fail "typecheck 失败"
    fi

    print_step "运行 npm run test..."
    (cd "$PROJECT_ROOT" && npm run test 2>&1 | tail -10)
    if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
        print_pass "tests 通过"
    else
        print_fail "tests 失败"
    fi
}

# =============================================================================
# Verification Summary
# =============================================================================
print_summary() {
    print_header "Phase 0 验证结果总结"
    echo ""
    echo -e "  ${GREEN}✅ 通过: $PASS${NC}"
    echo -e "  ${RED}❌ 失败: $FAIL${NC}"
    echo -e "  ${YELLOW}⏭️  跳过: $SKIP${NC}"
    echo ""

    if [[ $FAIL -eq 0 ]]; then
        echo -e "${GREEN}🎉 Phase 0 所有检查通过！可以开始 Phase 1 开发。${NC}"
    else
        echo -e "${RED}⚠️  Phase 0 有 $FAIL 项未通过，请检查上述输出并修复。${NC}"
    fi
}

# =============================================================================
# Main
# =============================================================================
main() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     isQCoder-cli Phase 0: 预备阶段自动化设置             ║${NC}"
    echo -e "${BLUE}║     $(date '+%Y-%m-%d %H:%M:%S')                                  ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  项目根目录: $PROJECT_ROOT"
    echo -e "  isQCodeAgent: $ISQCODEAGENT_ROOT"

    # Parse arguments for selective task execution
    local tasks="${1:-all}"

    case "$tasks" in
        all)
            task_01_npm_scope
            task_02_mcp_sdk
            task_03_docker
            task_04_upstream
            task_05_preflight
            ;;
        01|npm)     task_01_npm_scope ;;
        02|mcp)     task_02_mcp_sdk ;;
        03|docker)  task_03_docker ;;
        04|upstream) task_04_upstream ;;
        05|preflight) task_05_preflight ;;
        *)
            echo "Usage: $0 [all|01|02|03|04|05|npm|mcp|docker|upstream|preflight]"
            exit 1
            ;;
    esac

    print_summary
}

main "$@"
