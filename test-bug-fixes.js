// Bug修复测试脚本 - 使用Node.js

console.log('开始测试Bug修复...\n');

// 加载F1应用的所有JS文件
const points = {};
const labeledPoints = new Set();
const shapes = [];
const commandHistory = [];
const redoStack = [];

// 模拟全局变量
global.points = points;
global.labeledPoints = labeledPoints;
global.shapes = shapes;
global.commandHistory = commandsHistory;
global.redoStack = redoStack;

// 加载实际的JS模块
try {
    require('./js/points.js');
    require('./js/canvas.js');
    require('./js/shapes.js');
    require('./js/functions.js');
    const commands = require('./js/commands.js');
    const executeCommand = commands.executeCommand;
    
    console.log('✓ 成功加载所有模块\n');
    
    // 测试Bug #1
    console.log('=== 测试Bug #1：删除撤销不完整 ===');
    
    // 重置状态
    for (let key in points) delete points[key];
    labeledPoints.clear();
    shapes.length = 0;
    commandHistory.length = 0;
    redoStack.length = 0;
    
    executeCommand('矩形abcd');
    console.log(`1. 绘制矩形abcd后 shapes.length = ${shapes.length}，shapes[0].name = ${shapes[0] ? shapes[0].name : 'undefined'}`);
    
    executeCommand('删除 矩形abcd');
    console.log(`2. 删除矩形后 shapes.length = ${shapes.length}`);
    
    executeCommand('撤销');
    console.log(`3. 撤销删除后 shapes.length = ${shapes.length}，shapes[0].name = ${shapes[0] ? shapes[0].name : 'undefined'}`);
    
    if (shapes.length === 1 && shapes[0].name === 'abcd') {
        console.log('✅ Bug #1 修复成功：撤销后shapes数组正确恢复\n');
    } else {
        console.log(`❌ Bug #1 未修复：撤销后shapes数组状态错误\n`);
    }
    
    // 测试Bug #2
    console.log('=== 测试Bug #2：清除未清空shapes ===');
    
    for (let key in points) delete points[key];
    labeledPoints.clear();
    shapes.length = 0;
    commandHistory.length = 0;
    redoStack.length = 0;
    
    executeCommand('矩形abcd');
    executeCommand('三角形abc');
    console.log(`4. 绘制矩形和三角形后 shapes.length = ${shapes.length}`);
    
    executeCommand('清空');
    console.log(`5. 清空后 shapes.length = ${shapes.length}`);
    
    if (shapes.length === 0) {
        console.log('✅ Bug #2 修复成功：清空后shapes数组被清空\n');
    } else {
        console.log(`❌ Bug #2 未修复：清空后shapes数组仍有 ${shapes.length} 个元素\n`);
    }
    
    // 测试Bug #3
    console.log('=== 测试Bug #3：清除恢复不一致 ===');
    
    for (let key in points) delete points[key];
    labeledPoints.clear();
    shapes.length = 0;
    commandHistory.length = 0;
    redoStack.length = 0;
    
    executeCommand('矩形abcd');
    console.log(`6. 绘制矩形abcd后 shapes.length = ${shapes.length}，shapes[0].name = ${shapes[0] ? shapes[0].name : 'undefined'}`);
    
    executeCommand('清空');
    console.log(`7. 清空后 shapes.length = ${shapes.length}`);
    
    executeCommand('三角形efg');
    console.log(`8. 绘制新三角形后 shapes.length = ${shapes.length}，shapes[0].name = ${shapes[0] ? shapes[0].name : 'undefined'}`);
    
    executeCommand('撤销');
    console.log(`9. 撤销清空后 shapes.length = ${shapes.length}，shapes[0].name = ${shapes[0] ? shapes[0].name : 'undefined'}`);
    
    if (shapes.length === 1 && shapes[0].name === 'abcd') {
        console.log('✅ Bug #3 修复成功：撤销清空后正确恢复到矩形abcd\n');
    } else {
        console.log(`❌ Bug #3 未修复：撤销清空后shapes数组状态错误\n`);
    }
    
    console.log('=== 测试完成 ===');
    
} catch (error) {
    console.error('加载模块失败:', error.message);
    console.error(error.stack);
}
