// F1几何绘图 - 自动化功能测试
// 使用方法：打开 http://39.106.26.127/f1/ → 按F12 → Console → 粘贴执行

(function() {
    console.clear();
    console.log('========================================');
    console.log('F1几何绘图 - 功能测试');
    console.log('========================================\n');

    const tests = [
        { 
            name: '1. 清空画布', 
            command: '清空', 
            expected: '画布应该被清空',
            delay: 500 
        },
        { 
            name: '2. 绘制矩形', 
            command: '矩形abcd', 
            expected: '应该显示矩形ABCD',
            delay: 1000 
        },
        { 
            name: '3. 绘制中点', 
            command: '中点 a b e', 
            expected: '应该创建中点E',
            delay: 1000 
        },
        { 
            name: '4. 绘制三角形', 
            command: '三角形ace', 
            expected: '应该显示三角形ACE',
            delay: 1000 
        },
        { 
            name: '5. 设置颜色', 
            command: '颜色为红', 
            expected: '后续图形应该为红色',
            delay: 500 
        },
        { 
            name: '6. 绘制圆', 
            command: '圆 e ab', 
            expected: '应该显示圆心E，半径为AB的圆',
            delay: 1000 
        },
        { 
            name: '7. 测试撤销', 
            command: '撤销', 
            expected: '应该撤销上一步操作',
            delay: 500 
        },
        { 
            name: '8. 测试重做', 
            command: '重做', 
            expected: '应该重做上一次撤销的操作',
            delay: 500 
        },
        { 
            name: '9. 测试帮助', 
            command: '帮助', 
            expected: '应该显示命令帮助',
            delay: 1000 
        },
        { 
            name: '10. 清空画布', 
            command: '清空', 
            expected: '画布应该被清空',
            delay: 500 
        },
        { 
            name: '11. 绘制线段', 
            command: '线段ab', 
            expected: '应该显示线段AB',
            delay: 1000 
        },
        { 
            name: '12. 绘制角', 
            command: '角 a b c', 
            expected: '应该显示角ABC（顶点B）',
            delay: 1000 
        },
        { 
            name: '13. 创建分点', 
            command: '分点 a b f 1/3', 
            expected: '应该创建AB的1/3分点F',
            delay: 1000 
        },
        { 
            name: '14. 设置绿色', 
            command: '颜色为绿', 
            expected: '颜色应该变为绿色',
            delay: 500 
        },
        { 
            name: '15. 绘制新三角形', 
            command: '三角形abf', 
            expected: '应该显示绿色三角形ABF',
            delay: 1000 
        }
    ];

    let currentTest = 0;
    let passCount = 0;
    let failCount = 0;

    async function executeTest(test, index) {
        console.log(`\n[${index + 1}/${tests.length}] ${test.name}`);
        console.log(`命令: ${test.command}`);
        console.log(`预期: ${test.expected}`);

        try {
            const input = document.getElementById('commandInput');
            if (!input) {
                throw new Error('❌ 找不到命令输入框');
            }

            // 清空输入框
            input.value = '';

            // 输入命令
            input.value = test.command;

            // 触发Enter键
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            });
            input.dispatchEvent(enterEvent);

            // 同时触发input事件（某些浏览器需要）
            input.dispatchEvent(new Event('input', { bubbles: true }));

            console.log('✓ 命令已发送');
            passCount++;

        } catch (error) {
            console.error(`✗ 错误: ${error.message}`);
            failCount++;
        }

        // 等待
        await new Promise(resolve => setTimeout(resolve, test.delay));
    }

    async function runAllTests() {
        console.log('=== 开始执行测试 ===\n');

        for (let i = 0; i < tests.length; i++) {
            await executeTest(tests[i], i);
        }

        console.log('\n========================================');
        console.log('测试完成！');
        console.log('========================================');
        console.log(`总测试数: ${tests.length}`);
        console.log(`执行成功: ${passCount}`);
        console.log(`执行失败: ${failCount}`);
        console.log(`成功率: ${(passCount / tests.length * 100).toFixed(2)}%`);
        
        console.log('\n========================================');
        console.log('后续测试建议：');
        console.log('========================================');
        console.log('1. 检查画布上是否显示了所有图形');
        console.log('2. 验证颜色是否正确设置');
        console.log('3. 测试撤销/重做按钮是否正常');
        console.log('4. 测试缩放按钮是否正常');
        console.log('5. 尝试输入：坐标系');
        console.log('6. 尝试输入：正比例 1');
        console.log('7. 尝试输入：旋转 矩形abcd 绕a 90');
    }

    // 开始测试
    runAllTests();

})();
