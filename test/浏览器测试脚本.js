========================================
  F1几何绘图 - 浏览器控制台测试脚本
========================================

使用方法：
1. 打开 http://39.106.26.127/f1/
2. 按F12打开开发者工具
3. 切换到Console标签
4. 复制下面的脚本并粘贴执行

========================================

(function() {
    console.log('========================================');
    console.log('F1几何绘图 - 自动化测试');
    console.log('========================================\n');

    const tests = [
        { name: '清空画布', command: '清空', delay: 500 },
        { name: '绘制矩形', command: '矩形abcd', delay: 1000 },
        { name: '绘制中点', command: '中点 a b e', delay: 1000 },
        { name: '绘制三角形', command: '三角形ace', delay: 1000 },
        { name: '设置颜色', command: '颜色为红', delay: 500 },
        { name: '绘制圆', command: '圆 e ab', delay: 1000 },
        { name: '撤销操作', command: '撤销', delay: 500 },
        { name: '重做操作', command: '重做', delay: 500 },
        { name: '显示帮助', command: '帮助', delay: 1000 },
        { name: '清空画布', command: '清空', delay: 500 }
    ];

    let currentTest = 0;
    let passCount = 0;
    let failCount = 0;

    async function executeTest(test, index) {
        console.log(`\n[${index + 1}/${tests.length}] 测试: ${test.name}`);
        console.log(`命令: ${test.command}`);

        try {
            const input = document.getElementById('commandInput');
            if (!input) {
                throw new Error('找不到命令输入框');
            }

            input.value = test.command;

            // 触发Enter键事件
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            });
            input.dispatchEvent(enterEvent);

            console.log(`✓ 命令已执行`);
            passCount++;

        } catch (error) {
            console.error(`✗ 错误: ${error.message}`);
            failCount++;
        }

        await new Promise(resolve => setTimeout(resolve, test.delay));
    }

    async function runAllTests() {
        console.log('开始执行测试用例...\n');

        for (let i = 0; i < tests.length; i++) {
            await executeTest(tests[i], i);
        }

        console.log('\n========================================');
        console.log('测试完成！');
        console.log('========================================');
        console.log(`总测试数: ${tests.length}`);
        console.log(`通过: ${passCount}`);
        console.log(`失败: ${failCount}`);
        console.log(`成功率: ${(passCount / tests.length * 100).toFixed(2)}%`);
        console.log('\n提示：请查看画布上的图形结果');
    }

    // 开始测试
    runAllTests();

})();

========================================
