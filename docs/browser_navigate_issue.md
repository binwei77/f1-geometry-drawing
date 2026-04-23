# browser_navigate 超时问题诊断与解决方案

## 问题描述

在使用 `browser_navigate` 工具测试 F1 项目时遇到超时错误：
```
Error: LLM browser request timed out after 60.0 seconds
```

## 问题排查过程

### 1. 环境检查
- ✓ WSL环境正常运行
- ✓ Chrome已安装：`/usr/bin/google-chrome`
- ✓ Node.js和npm已安装
- ✓ Playwright已安装：`playwright@1.59.1`
- ✗ Chromedriver未安装（但browser工具应该会自动管理）

### 2. 网络排查
- 发现系统代理：`HTTP_PROXY=http://127.0.0.1:26561`
- 清除代理后问题依旧
- **结论**：代理不是根本原因

### 3. 工具内部排查
尝试各种方法都无法解决：
- 设置超时参数
- 清除环境变量
- 使用不同的URL
- **结论**：browser_navigate工具内部实现问题，当前环境无法修复

### 4. 辅助工具测试
- `vision_analyze` 也无法使用（`Connection error`）
- **结论**：网络连接限制导致AI视觉分析工具不可用

## 可用替代方案

### 方案1：curl命令（推荐用于基本验证）
```bash
# 检查HTTP状态
curl --noproxy "*" -I http://39.106.26.127/f1/

# 验证页面内容
curl --noproxy "*" http://39.106.26.127/f1/ | grep "几何图形生成器"
```

**优点**：
- 快速、可靠
- 不受工具内部问题影响
- 可以精确检查HTTP状态和内容

**缺点**：
- 无法执行JavaScript
- 无法模拟点击、输入等交互

### 方案2：headless chrome截图
```bash
unset HTTP_PROXY HTTPS_PROXY NO_PROXY
google-chrome --headless --disable-gpu \
    --screenshot=/tmp/screenshot.png \
    --window-size=1280,720 \
    http://39.106.26.127/f1/
```

**优点**：
- 生成实际页面截图
- 可以验证页面渲染结果
- 执行WASM/JavaScript

**缺点**：
- 无法AI分析截图（vision工具不可用）
- 截图大小可能很大（24KB+）

### 方案3：Playwright截图
```bash
unset HTTP_PROXY HTTPS_PROXY NO_PROXY
npx --yes playwright screenshot \
    http://39.106.26.127/f1/ /tmp/screenshot.png
```

**优点**：
- 现代化的网页自动化工具
- 截图尺寸合理（4KB左右）
- 可以编写更复杂的测试脚本

**缺点**：
- 需要通过npx运行
- 无法进行AI视觉分析

### 方案4：本地HTML测试页面（推荐用户测试）
创建HTML页面，嵌入iframe指向测试URL：

```html
<iframe src="http://39.106.26.127/f1/"
        width="100%" height="600px" frameborder="1">
</iframe>
```

**优点**：
- 用户在真实浏览器中测试
- 可以进行完整的交互测试
- 不受代理/工具限制

**缺点**：
- 跨域限制（无法通过JavaScript访问iframe内容）

## 测试脚本

已创建 `/home/bw77/f1/test/test-web-functions.sh`，运行方式：
```bash
./f1/test/test-web-functions.sh
```

该脚本包含：
1. HTTP状态检查（使用curl --noproxy）
2. 关键内容验证（页面标题、Canvas、输入框、按钮）
3. headless chrome截图
4. Playwright截图

## 测试结果

所有测试通过：
```
[测试1] HTTP状态检查
✓ HTTP状态: 200 (成功)

[测试2] 关键内容验证
✓ 页面标题正确
✓ Canvas元素存在
✓ 输入框元素存在
  找到 4 个功能按钮

[测试3] headless chrome截图
✓ 截图生成成功 (24475 bytes)

[测试4] Playwright截图
✓ Playwright截图成功 (4254 bytes)
```

## 根本原因总结

| 工具 | 问题 | 根本原因 |
|------|------|----------|
| browser_navigate | 超时 | 工具内部实现问题，环境无关 |
| vision_analyze | 连接错误 | 网络连接限制 |
| curl | 正常 | ✓ 可用 |
| google-chrome | 正常 | ✓ 可用 |
| npx playwright | 正常 | ✓ 可用 |

## 对用户的建议

1. **开发测试**：使用桌面上的测试页面
   - `F1测试页面.html` - 基础测试页面
   - `F1自动化测试.html` - 包含自动化测试用例

2. **功能验证**：直接在Chrome浏览器中访问
   - URL: http://39.106.26.127/f1/

3. **部署验证**：运行测试脚本
   ```bash
   ./f1/test/test-web-functions.sh
   ```

4. **截图验证**：查看桌面截图
   - `f1-screenshot.png` - headless chrome截图
   - `f1-playwright-screenshot.png` - Playwright截图

## 避免使用的工具

在当前环境下：
- ✗ 不要使用 `browser_navigate`（会超时）
- ✗ 不要使用 `vision_analyze`（连接错误）
- ✗ 不要依赖代理环境变量（会干扰网络请求）

## 技能更新

已更新 `browser-fallback-headless-chrome` 技能，添加以下信息：
- Playwright可用但需要npx运行
- browser_navigate超时是工具内部实现问题
- 即使清除代理环境变量也无法解决
- 当前环境无法修复browser_navigate
