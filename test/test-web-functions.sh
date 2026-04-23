#!/bin/bash

# F1项目Web功能测试脚本
# 使用可用的工具进行测试

echo "======================================"
echo "F1几何绘图项目 - Web功能测试"
echo "======================================"
echo ""

URL="http://39.106.26.127/f1/"
TEST_DIR="/tmp/f1-test-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$TEST_DIR"

echo "测试目录: $TEST_DIR"
echo ""

# 测试1: HTTP状态检查
echo "[测试1] HTTP状态检查"
echo "--------------------------------------"
HTTP_STATUS=$(curl --noproxy "*" -s -o /dev/null -w "%{http_code}" "$URL")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ HTTP状态: $HTTP_STATUS (成功)"
else
    echo "✗ HTTP状态: $HTTP_STATUS (失败)"
fi
echo ""

# 测试2: 关键内容验证
echo "[测试2] 关键内容验证"
echo "--------------------------------------"
CONTENT=$(curl --noproxy "*" -s "$URL")

# 检查页面标题
if echo "$CONTENT" | grep -q "几何图形生成器"; then
    echo "✓ 页面标题正确"
else
    echo "✗ 页面标题未找到"
fi

# 检查Canvas元素
if echo "$CONTENT" | grep -q "<canvas"; then
    echo "✓ Canvas元素存在"
else
    echo "✗ Canvas元素未找到"
fi

# 检查命令输入
if echo "$CONTENT" | grep -q "input"; then
    echo "✓ 输入框元素存在"
else
    echo "✗ 输入框元素未找到"
fi

# 检查功能按钮
BUTTONS=0
echo "$CONTENT" | grep -q "撤销" && ((BUTTONS++))
echo "$CONTENT" | grep -q "重做" && ((BUTTONS++))
echo "$CONTENT" | grep -q "缩放" && ((BUTTONS++))
echo "$CONTENT" | grep -q "+" && ((BUTTONS++))
echo "$CONTENT" | grep -q "-" && ((BUTTONS++))

echo "  找到 $BUTTONS 个功能按钮"
echo ""

# 测试3: headless chrome截图
echo "[测试3] headless chrome截图"
echo "--------------------------------------"
unset HTTP_PROXY HTTPS_PROXY NO_PROXY
google-chrome --headless --disable-gpu --screenshot="$TEST_DIR/headless-screenshot.png" \
    --window-size=1280,720 "$URL" 2>&1 | \
    grep -v "SSL" | grep -v "handshake" | grep -v "Fontconfig"

if [ -f "$TEST_DIR/headless-screenshot.png" ]; then
    FILE_SIZE=$(stat -f%z "$TEST_DIR/headless-screenshot.png" 2>/dev/null || stat -c%s "$TEST_DIR/headless-screenshot.png" 2>/dev/null || echo "0")
    if [ "$FILE_SIZE" -gt 1000 ]; then
        echo "✓ 截图生成成功 ($FILE_SIZE bytes)"
        cp "$TEST_DIR/headless-screenshot.png" /mnt/c/Users/bw77/Desktop/f1-screenshot.png
        echo "  已复制到桌面: f1-screenshot.png"
    else
        echo "✗ 截图大小异常 ($FILE_SIZE bytes)"
    fi
else
    echo "✗ 截图生成失败"
fi
echo ""

# 测试4: Playwright截图
echo "[测试4] Playwright截图"
echo "--------------------------------------"
unset HTTP_PROXY HTTPS_PROXY NO_PROXY
npx --yes playwright screenshot "$URL" "$TEST_DIR/playwright-screenshot.png" 2>&1 | grep -E "(Navigating|Capturing|Error)"

if [ -f "$TEST_DIR/playwright-screenshot.png" ]; then
    FILE_SIZE=$(stat -f%z "$TEST_DIR/playwright-screenshot.png" 2>/dev/null || stat -c%s "$TEST_DIR/playwright-screenshot.png" 2>/dev/null || echo "0")
    if [ "$FILE_SIZE" -gt 1000 ]; then
        echo "✓ Playwright截图成功 ($FILE_SIZE bytes)"
        cp "$TEST_DIR/playwright-screenshot.png" /mnt/c/Users/bw77/Desktop/f1-playwright-screenshot.png
        echo "  已复制到桌面: f1-playwright-screenshot.png"
    else
        echo "✗ Playwright截图大小异常 ($FILE_SIZE bytes)"
    fi
else
    echo "✗ Playwright截图失败"
fi
echo ""

# 测试总结
echo "======================================"
echo "测试总结"
echo "======================================"
echo "测试文件保存在: $TEST_DIR"
echo ""
echo "可用测试工具："
echo "  ✓ curl - HTTP状态和内容验证"
echo "  ✓ google-chrome --headless - 截图"
echo "  ✓ npx playwright screenshot - 截图"
echo ""
echo "不可用工具："
echo "  ✗ browser_navigate - 超时（工具内部问题）"
echo "  ✗ vision - 连接错误（网络限制）"
echo ""
echo "推荐测试方式："
echo "  1. 使用桌面上的F1测试页面.html"
echo "  2. 直接在Chrome浏览器中访问 $URL"
echo "  3. 使用桌面上的F1自动化测试.html"
echo ""
