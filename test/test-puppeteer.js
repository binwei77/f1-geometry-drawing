// F1几何绘图 - Puppeteer自动化测试
// 使用方法：node test-puppeteer.js

const puppeteer = require('puppeteer');

(async () => {
    console.log('========================================');
    console.log('F1几何绘图 - Puppeteer自动化测试');
    console.log('========================================\n');

    const browser = await puppeteer.launch({
        headless: false, // 显示浏览器窗口
        defaultViewport: { width: 1280, height: 800 },
        args: [
            '--disable-extensions',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    const page = await browser.newPage();

    try {
        console.log('1. 打开F1页面...');
        await page.goto('http://39.106.26.127/f1/', {
            waitUntil: 'networkidle2',
            timeout: 10000
        });
        console.log('✓ 页面加载成功\n');

        // 等待页面元素加载
        await page.waitForSelector('#commandInput', { timeout: 5000 });

        const tests = [
            { name: '清空画布', command: '清空', expected: '画布应该被清空' },
            { name: '绘制矩形', command: '矩形abcd', expected: '应该显示矩形ABCD' },
            { name: '绘制中点', command: '中点 a b e', expected: '应该创建中点E' },
            { name: '绘制三角形', command: '三角形ace', expected: '应该显示三角形ACE' },
            { name: '设置红色', command: '颜色为红', expected: '颜色应该变为红色' },
            { name: '绘制圆', command: '圆 e ab', expected: '应该显示圆心E，半径为AB' },
            { name: '撤销', command: '撤销', expected: '应该撤销上一步操作' },
            { name: '重做', command: '重做', expected: '应该重做上一次撤销的操作' },
            { name: '设置蓝色', command: '颜色为蓝', expected: '颜色应该变为蓝色' },
            { name: '绘制线段', command: '线段ab', expected: '应该显示蓝色线段AB' },
            { name: '绘制角', command: '角 a b c', expected: '应该显示角ABC（顶点B）' },
            { name: '创建1/3分点', command: '分点 a b f 1/3', expected: '应该创建AB的1/3分点F' },
            { name: '设置绿色', command: '颜色为绿', expected: '颜色应该变为绿色' },
            { name: '绘制三角形ABF', command: '三角形abf', expected: '应该显示绿色三角形ABF' },
            { name: '清空', command: '清空', expected: '画布应该被清空' }
        ];

        console.log('2. 开始执行测试用例...\n');
        let passCount = 0;
        let failCount = 0;

        for (let i = 0; i < tests.length; i++) {
            const test = tests[i];
            console.log(`[${i + 1}/${tests.length}] ${test.name}`);
            console.log(`  命令: ${test.command}`);
            console.log(`  预期: ${test.expected}`);

            try {
                // 输入命令
                await page.type('#commandInput', test.command, { delay: 50 });

                // 按回车
                await page.keyboard.press('Enter');

                // 等待处理
                await page.waitForTimeout(800);

                console.log(`  ✓ 命令已执行`);
                passCount++;

            } catch (error) {
                console.error(`  ✗ 错误: ${error.message}`);
                failCount++;
            }

            console.log('');
        }

        console.log('========================================');
        console.log('测试完成！');
        console.log('========================================');
        console.log(`总测试数: ${tests.length}`);
        console.log(`通过: ${passCount}`);
        console.log(`失败: ${failCount}`);
        console.log(`成功率: ${(passCount / tests.length * 100).toFixed(2)}%`);

        console.log('\n3. 截图保存...');
        await page.screenshot({ path: '/tmp/f1-test-result.png', fullPage: true });
        console.log('✓ 截图已保存: /tmp/f1-test-result.png');

        console.log('\n4. 等待10秒后关闭浏览器...');
        console.log('   (请在此期间检查画布上的图形结果)');
        await page.waitForTimeout(10000);

    } catch (error) {
        console.error('测试过程中发生错误:', error);
    }

    await browser.close();
    console.log('\n浏览器已关闭');
})();
