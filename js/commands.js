/**
 * 命令解析模块
 * 负责解析用户输入的命令并执行相应的绘制操作
 */

// 命令历史，用于撤销
const commandHistory = [];

// 重做栈，用于重做
const redoStack = [];

// 存储清空前的状态（用于撤销清空操作）
let clearedState = null;

// 全局颜色
let globalColor = '#333333';  // 默认黑色

// 存储已绘制的函数信息
const functions = {};

/**
 * 根据模式解析参数的辅助函数
 */
function parseByPattern(str, pattern) {
    const result = [];
    let i = 0;
    
    // 如果需要拆分点名称
    if (pattern.splitPoints) {
        let pointStr = '';
        while (i < str.length && /[A-Za-z]/.test(str[i])) {
            pointStr += str[i];
            i++;
        }
        
        // 根据 maxPoints 决定如何拆分
        if (pointStr.length > 0) {
            if (pattern.maxPoints && pointStr.length > pattern.maxPoints) {
                // 超过maxPoints，全部拆分为单个字母
                result.push(...pointStr.split(''));
            } else if (pattern.maxPoints === 2 && pointStr.length === 2) {
                // 正好2个点，拆分
                result.push(pointStr[0], pointStr[1]);
            } else if (pattern.maxPoints === 3 && pointStr.length === 3) {
                // 正好3个点，拆分
                result.push(pointStr[0], pointStr[1], pointStr[2]);
            } else if (pointStr.length === 1) {
                // 单个点
                result.push(pointStr);
            } else {
                // 多于maxPoints但不超过太多，全部拆分
                result.push(...pointStr.split(''));
            }
        }
        
        // 跳过空格
        while (i < str.length && /\s/.test(str[i])) i++;
    } else {
        // 不拆分点名称，读取整个参数
        let param = '';
        while (i < str.length && /[A-Za-z0-9]/.test(str[i])) {
            param += str[i];
            i++;
        }
        if (param) result.push(param);
        
        // 跳过空格
        while (i < str.length && /\s/.test(str[i])) i++;
    }
    
    // 处理新点名称
    if (pattern.thenNewPoint && i < str.length) {
        let newPoint = '';
        while (i < str.length && /[A-Za-z]/.test(str[i])) {
            newPoint += str[i];
            i++;
        }
        if (newPoint) result.push(newPoint);
        
        // 跳过空格
        while (i < str.length && /\s/.test(str[i])) i++;
    }
    
    // 处理剩余部分（数字、关键字等）
    const remaining = str.slice(i).trim();
    if (remaining) {
        // 按空格分割剩余部分
        const parts = remaining.split(/\s+/).filter(p => p.trim());
        result.push(...parts);
    }
    
    return result;
}

/**
 * 智能分割参数
 * @param {string} remaining - 命令关键词后的剩余部分
 * @param {string} commandType - 命令类型
 * @returns {Array} 参数数组
 */
function smartSplitParameters(remaining, commandType) {
    if (!remaining) return [];
    
    // 定义不同命令的参数模式
    const patterns = {
        // 线段/直线：连续点名称，最多2个
        '线段': { splitPoints: true, maxPoints: 2 },
        '直线': { splitPoints: true, maxPoints: 2 },
        
        // 中点：连续点名称，最多2个，然后是新点名称
        '中点': { splitPoints: true, maxPoints: 2, thenNewPoint: true },
        
        // 分点：连续点名称，最多2个，然后是新点名称和比例
        '分点': { splitPoints: true, maxPoints: 2, thenNewPoint: true, thenNumber: true },
        
        // 角：连续点名称，最多3个
        '角': { splitPoints: true, maxPoints: 3 },
        
        // 矩形/三角形：点名称不拆分，保持整体
        '矩形': { splitPoints: false },
        '长方形': { splitPoints: false },
        '三角形': { splitPoints: false },
        
        // 圆：点名称不拆分，后面跟数字或线段
        '圆': { splitPoints: false },
        
        // 旋转/对称/对折/平移：图形名不拆分，后面跟关键字
        '旋转': { splitPoints: false },
        '对称': { splitPoints: false },
        '对折': { splitPoints: false },
        '平移': { splitPoints: false },
        
        // 点：可以拆分
        '点': { splitPoints: true, maxPoints: 10 }
    };
    
    const pattern = patterns[commandType];
    if (!pattern) {
        // 默认按空格分割
        return remaining.split(/\s+/).filter(p => p.trim());
    }
    
    return parseByPattern(remaining, pattern);
}

/**
 * 创建图形对象并添加到shapes数组
 * @param {string} type - 图形类型：'rectangle', 'triangle', 'line', 'circle', 'point', 'segment'等
 * @param {string} name - 图形名称
 * @param {Array} pointNames - 点名称数组
 * @param {string} color - 颜色
 * @param {boolean} fill - 是否填充
 * @returns {Object} 图形对象
 */
function createShape(type, name, pointNames, color, fill = false) {
    // 检查是否已存在同名图形
    const existingIndex = shapes.findIndex(s => s.name === name);
    if (existingIndex !== -1) {
        // 更新现有图形
        shapes[existingIndex] = {
            type: type,
            name: name,
            pointNames: pointNames,
            color: color,
            fill: fill
        };
        console.log(`已更新图形 ${name}`);
        return shapes[existingIndex];
    }
    
    // 创建新图形
    const shape = {
        type: type,
        name: name,
        pointNames: pointNames,
        color: color,
        fill: fill
    };
    shapes.push(shape);
    console.log(`已创建图形 ${name} (${type})`);
    return shape;
}

/**
 * 根据图形名称获取所有点
 * @param {string} shapeName - 图形名称（如"abc"、"abcd"）
 * @returns {Array} 点数组
 */
function getShapePoints(shapeName) {
    const pts = [];
    for (let i = 0; i < shapeName.length; i++) {
        const pointName = shapeName[i];
        if (points[pointName]) {
            pts.push(points[pointName]);
        }
    }
    return pts.length > 0 ? pts : null;
}

/**
 * 解析并执行命令
 * @param {string} cmd - 命令字符串
 * @param {boolean} skipHistory - 是否跳过历史记录
 */
function executeCommand(cmd, skipHistory = false) {
    cmd = cmd.trim();
    if (!cmd) return;
    
    // 处理帮助命令
    if (cmd === '帮助' || cmd === 'help' || cmd === '?') {
        showHelp();
        return;
    }
    
    // 处理撤销命令
    if (cmd === '撤销' || cmd === 'undo') {
        if (commandHistory.length > 0) {
            const lastCmd = commandHistory.pop();
            
            // 提取实际的命令字符串（可能是一个对象）
            const cmdStr = typeof lastCmd === 'string' ? lastCmd : lastCmd.cmd;
            redoStack.push(lastCmd);

            // 如果撤销的是删除命令，恢复删除状态
            if (typeof lastCmd === 'object' && lastCmd.deletedState) {
                // 恢复点的状态
                Object.keys(points).forEach(key => delete points[key]);
                Object.assign(points, lastCmd.deletedState.points);
                
                // 恢复labeledPoints
                labeledPoints.clear();
                lastCmd.deletedState.labeledPoints.forEach(pointName => {
                    labeledPoints.add(pointName);
                });
                
                // 恢复图形对象（如果有）
                if (lastCmd.deletedShape) {
                    shapes.push(lastCmd.deletedShape);
                    console.log('已恢复图形对象');
                }
                
                // 重绘画布（不重绘历史命令，因为已经恢复了删除前的状态）
                clearCanvas(false);
                commandHistory.forEach(c => {
                    const cmdToExecute = typeof c === 'string' ? c : c.cmd;
                    // 跳过删除命令，避免重新执行删除
                    if (!cmdToExecute.includes('删除') && !cmdToExecute.includes('remove') && !cmdToExecute.includes('del')) {
                        executeCommand(cmdToExecute, true);
                    }
                });
                
                console.log('撤销删除，已恢复对象');
            }
            // 如果撤销的是清空命令，需要恢复清空前的状态
            else if ((cmdStr === '清空' || cmdStr === '清除') && clearedState) {
                // 恢复点的状态
                Object.keys(points).forEach(key => delete points[key]);
                Object.assign(points, clearedState.points);
                
                // 恢复函数的状态
                Object.keys(functions).forEach(key => delete functions[key]);
                Object.assign(functions, clearedState.functions);
                
                // 恢复全局颜色
                globalColor = clearedState.globalColor;
                
                // 恢复labeledPoints
                labeledPoints.clear();
                clearedState.labeledPoints.forEach(pointName => {
                    labeledPoints.add(pointName);
                });
                
                // 恢复shapes数组
                shapes.length = 0;
                if (clearedState.shapes) {
                    clearedState.shapes.forEach(shape => {
                        shapes.push(shape);
                    });
                }
                
                // 重绘画布
                clearCanvas(false);
                
                console.log('撤销清空，已恢复所有内容');
            } else {
                // 正常撤销：：清空画布并重新执行剩余命令
                clearCanvas();
                
                // 重新执行所有剩余命令
                commandHistory.forEach(c => {
                    const cmdToExecute = typeof c === 'string' ? c : c.cmd;
                    executeCommand(cmdToExecute, true);
                });
            }
            
            console.log('撤销: ' + cmdStr);
        } else {
            console.log('没有可撤销的操作');
        }
        return;
    }
    
    // 处理重做命令
    if (cmd === '重做' || cmd === 'redo') {
        if (redoStack.length > 0) {
            const cmdToRedo = redoStack.pop();
            
            // 提取实际的命令字符串
            const cmdStr = typeof cmdToRedo === 'string' ? cmdToRedo : cmdToRedo.cmd;
            
            // 如果重做的是删除命令
            if (typeof cmdToRedo === 'object' && cmdToRedo.deletedState) {
                // 执行删除操作，跳过历史记录
                executeCommand(cmdStr, true);
                
                // 恢复deletedState到commandHistory
                if (commandHistory.length > 0) {
                    commandHistory[commandHistory.length - 1] = {
                        cmd: cmdStr,
                        deletedState: cmdToRedo.deletedState,
                        deletedShape: cmdToRedo.deletedShape
                    };
                }
                
                // 重绘画布
                clearCanvas(false);
                commandHistory.forEach(c => {
                    const cmdToExecute = typeof c === 'string' ? c : c.cmd;
                    executeCommand(cmdToExecute, true);
                });
                
                console.log('重做: ' + cmdStr);
            } else {
                // 正常重做：执行命令（不跳过历史，让它正常加入commandHistory）
                // 但是需要临时保存redoStack，因为executeCommand会清空它
                const tempRedoStack = [...redoStack];
                executeCommand(cmdStr, false);
                // 恢复redoStack
                redoStack.length = 0;
                redoStack.push(...tempRedoStack);
                
                console.log('重做: ' + cmdStr);
            }
        } else {
            console.log('没有可重做的操作');
        }
        return;
    }
    
    // 保存到历史（除非跳过）
    if (!skipHistory) {
        // 如果是清空命令，先保存当前状态
        if (cmd === '清空' || cmd === '清除') {
            // 深拷贝保存当前状态
            clearedState = {
                points: JSON.parse(JSON.stringify(points)),
                functions: JSON.parse(JSON.stringify(functions)),
                globalColor: globalColor,
                commandHistory: [...commandHistory],
                labeledPoints: Array.from(labeledPoints),  // 将Set转换为数组保存
                shapes: JSON.parse(JSON.stringify(shapes))  // 保存shapes数组
            };
            
            // 清空重做栈（新操作时清空）
            redoStack.length = 0;
            // 将清空命令加入历史
            commandHistory.push(cmd);
        } else {
            // 新操作时清空重做栈
            redoStack.length = 0;
            commandHistory.push(cmd);
        }
    }
    
    // 智能解析：处理"矩形abcd"这种连写的情况
    let type = '';
    let remaining = '';
    
    const typeKeywords = ['矩形', '长方形', '直线', '线段', '角', '圆', '点', '中点', '分点', '三角形', '坐标系', '正比例', '反比例', '二次函数', '函数', '旋转', '对称', '对折', '平移', '移动', '交点', '清空', '清除', '删除', 'remove', 'del'];
    for (const keyword of typeKeywords) {
        if (cmd.startsWith(keyword)) {
            type = keyword;
            remaining = cmd.substring(keyword.length).trim();
            break;
        }
    }
    
    // 如果没有匹配到关键词，使用原来的空格分割方式
    let parts;
    if (!type) {
        parts = cmd.split(/\s+/);
        type = parts[0];
        remaining = parts.slice(1).join(' ');
    }
    
    // 重新构建parts数组，使用智能分割
    parts = [type];
    if (remaining) {
        // 使用智能分割函数
        const remainingParts = smartSplitParameters(remaining, type);
        parts = parts.concat(remainingParts);
    }
    
    const colorResult = parseColor(parts);
    const color = colorResult.index !== -1 ? colorResult.color : globalColor;
    
    // 检查是否需要填充
    const needsFill = parts.some(p => p === '填充' || p === 'fill');
    
    // 检查是否是颜色设置命令
    if (type === '颜色') {
        if (parts[1] === '为') {
            const colorName = parts[2];
            if (colorMap[colorName]) {
                globalColor = colorMap[colorName];
                console.log('全局颜色已设置为：' + colorName);
            }
        }
        return;
    }
    
    if (type === '矩形' || type === '长方形') {
        const pointArgs = [];
        for (let i = 1; i < parts.length; i++) {
            if (i === colorResult.index) continue;
            if (parts[i] === '填充' || parts[i] === 'fill') continue;
            pointArgs.push(parts[i]);
        }
        
        // 检查是否需要自动布局
        const hasCoordinates = pointArgs.some(p => p.includes('(') && p.includes(')'));
        
        if (!hasCoordinates) {
            // 自动布局模式
            let allPointNames = [];
            pointArgs.forEach(arg => {
                allPointNames = allPointNames.concat(extractPointNames(arg));
            });
            // 如果没有提供点名称，自动分配4个
            if (allPointNames.length === 0) {
                allPointNames = getNextAvailableLetters(4);
            }
            // 如果不够4个点，补充默认名称
            while (allPointNames.length < 4) {
                allPointNames.push(String.fromCharCode(65 + allPointNames.length));
            }
            const rectPoints = autoRectangle(allPointNames);
            drawRectangle(rectPoints, color, needsFill);
            // 创建图形对象
            createShape('rectangle', allPointNames.join(''), allPointNames, color, needsFill);
        } else {
            // 原有坐标模式
            const rectPoints = [];
            pointArgs.forEach(p => {
                const parsed = parsePoint(p);
                if (parsed) rectPoints.push(parsed);
            });
            drawRectangle(rectPoints, color, needsFill);
            // 创建图形对象（使用所有点的名称）
            const pointNames = rectPoints.map(p => p.name).filter(n => n);
            if (pointNames.length === 4) {
                createShape('rectangle', pointNames.join(''), pointNames, color, needsFill);
            }
        }
    }
    else if (type === '直线' || type === '线段') {
        const pointArgs = [];
        for (let i = 1; i < parts.length; i++) {
            if (i === colorResult.index) continue;
            pointArgs.push(parts[i]);
        }
        
        // 检查是否需要自动布局
        const hasCoordinates = pointArgs.some(p => p.includes('(') && p.includes(')'));
        const hasExistingPoints = pointArgs.some(p => points[p]);
        
        if (!hasCoordinates && !hasExistingPoints) {
            // 自动布局模式（既没有坐标也没有已存在的点）
            let allPointNames = [];
            pointArgs.forEach(arg => {
                allPointNames = allPointNames.concat(extractPointNames(arg));
            });
            // 如果没有提供点名称，自动分配2个
            if (allPointNames.length === 0) {
                allPointNames = getNextAvailableLetters(2);
            }
            const linePoints = autoLine(allPointNames);
            drawLine(linePoints, color);
            // 创建图形对象
            createShape(type === '线段' ? 'segment' : 'line', allPointNames.join(''), allPointNames, color);
        } else {
            // 使用已存在的点或坐标
            const linePoints = [];
            const pointNames = [];
            pointArgs.forEach(p => {
                const parsed = parsePoint(p);
                if (parsed) {
                    linePoints.push(parsed);
                    if (parsed.name) pointNames.push(parsed.name);
                }
            });
            drawLine(linePoints, color);
            // 创建图形对象
            if (pointNames.length >= 2) {
                createShape(type === '线段' ? 'segment' : 'line', pointNames.join(''), pointNames, color);
            }
        }
    }
    else if (type === '角') {
        const pointArgs = [];
        for (let i = 1; i < parts.length; i++) {
            if (i === colorResult.index) continue;
            pointArgs.push(parts[i]);
        }
        
        const hasCoordinates = pointArgs.some(p => p.includes('(') && p.includes(')'));
        
        if (hasCoordinates) {
            const p1 = parsePoint(pointArgs[0]);
            const p2 = parsePoint(pointArgs[1]);
            const p3 = parsePoint(pointArgs[2]);
            if (p1 && p2 && p3) {
                drawAngle(p1, p2, p3, color);
            }
        } else {
            let allPointNames = [];
            pointArgs.forEach(arg => {
                allPointNames = allPointNames.concat(extractPointNames(arg));
            });
            if (allPointNames.length === 0) {
                allPointNames = getNextAvailableLetters(3);
            }
            while (allPointNames.length < 3) {
                allPointNames.push(String.fromCharCode(65 + allPointNames.length));
            }
            const anglePoints = autoAngle(allPointNames);
            drawAngle(anglePoints[0], anglePoints[1], anglePoints[2], color);
        }
    }
    else if (type === '圆') {
        let center = null;
        let radius = 0;
        let centerName = null;
        let segmentName = null;  // 用于存储线段名称
        
        for (let i = 1; i < parts.length; i++) {
            if (i === colorResult.index) continue;
            if (parts[i] === '填充' || parts[i] === 'fill') continue;
            
            const p = parsePoint(parts[i]);
            if (p) {
                center = p;
            } else if (isSegmentName(parts[i])) {
                // 这是一个线段名称，如"CD"
                segmentName = parts[i];
            } else if (!isNaN(parseInt(parts[i]))) {
                radius = parseInt(parts[i]);
            } else if (isPurePointName(parts[i])) {
                centerName = parts[i];
            }
        }
        
        // 如果有线段名称，计算线段长度作为半径
        if (segmentName) {
            radius = calculateSegmentLength(segmentName);
        }
        
        let circleName = centerName || (center ? center.name : '');
        
        if (center && radius > 0) {
            drawCircle(center, radius, color, needsFill);
            if (circleName) {
                createShape('circle', '圆' + circleName, [circleName], color, needsFill);
            }
        } else if (center) {
            // 有圆心但没有半径，使用默认大小
            drawCircle(center, autoSize, color, needsFill);
            if (circleName) {
                createShape('circle', '圆' + circleName, [circleName], color, needsFill);
            }
        } else {
            // 自动布局模式
            if (!centerName) {
                centerName = getNextAvailableLetter(14); // 从O开始（第15个字母，索引14）
            }
            const autoResult = autoCircle(centerName);
            drawCircle(autoResult.center, autoResult.radius, color, needsFill);
            createShape('circle', '圆' + centerName, [centerName], color, needsFill);
        }
    }
    else if (type === '点') {
        const pointArgs = [];
        for (let i = 1; i < parts.length; i++) {
            if (i === colorResult.index) continue;
            pointArgs.push(parts[i]);
        }
        
        let pointIndex = 0;
        pointArgs.forEach(arg => {
            const names = extractPointNames(arg);
            names.forEach(name => {
                const existing = points[name];
                if (existing) {
                    drawPoint(existing, color);
                    // 创建图形对象
                    createShape('point', name, [name], color);
                } else if (isPurePointName(name)) {
                    const p = autoPoint(name, pointIndex);
                    drawPoint(p, color);
                    pointIndex++;
                    // 创建图形对象
                    createShape('point', name, [name], color);
                } else {
                    const p = parsePoint(name);
                    if (p) {
                        drawPoint(p, color);
                        pointIndex++;
                        // 创建图形对象
                        if (p.name) {
                            createShape('point', p.name, [p.name], color);
                        }
                    }
                }
            });
        });
    }
    else if (type === '中点') {
        // 格式：中点 A B M
        const p1 = parsePoint(parts[1]);
        const p2 = parsePoint(parts[2]);
        const newName = parts[3];
        const newPoint = createRelativePoint('中点', p1, p2, newName);
        if (newPoint) {
            drawPoint(newPoint, color);
            // 创建图形对象
            createShape('point', newName, [newName], color);
        }
    }
    else if (type === '分点') {
        // 格式：分点 A B M 1/3  或 分点 A B M 0.333
        const p1 = parsePoint(parts[1]);
        const p2 = parsePoint(parts[2]);
        const newName = parts[3];
        let ratio = 0.5;
        
        if (parts[4]) {
            const ratioStr = parts[4];
            if (ratioStr.includes('/')) {
                const [num, den] = ratioStr.split('/').map(Number);
                ratio = num / den;
            } else {
                ratio = parseFloat(ratioStr);
            }
        }
        
        const newPoint = createRelativePoint('分点', p1, p2, newName, ratio);
        if (newPoint) {
            drawPoint(newPoint, color);
            // 创建图形对象
            createShape('point', newName, [newName], color);
        }
    }
    else if (type === '三角形') {
        const pointArgs = [];
        for (let i = 1; i < parts.length; i++) {
            if (i === colorResult.index) continue;
            if (parts[i] === '填充' || parts[i] === 'fill') continue;
            pointArgs.push(parts[i]);
        }
        
        const hasCoordinates = pointArgs.some(p => p.includes('(') && p.includes(')'));
        
        if (!hasCoordinates) {
            let allPointNames = [];
            pointArgs.forEach(arg => {
                allPointNames = allPointNames.concat(extractPointNames(arg));
            });
            // 如果没有提供点名称，自动分配3个
            if (allPointNames.length === 0) {
                allPointNames = getNextAvailableLetters(3);
            }
            while (allPointNames.length < 3) {
                allPointNames.push(String.fromCharCode(65 + allPointNames.length));
            }
            const triPoints = autoTriangle(allPointNames);
            drawTriangle(triPoints, color, needsFill);
            // 创建图形对象
            createShape('triangle', allPointNames.join(''), allPointNames, color, needsFill);
        } else {
            const triPoints = [];
            const pointNames = [];
            pointArgs.forEach(p => {
                const parsed = parsePoint(p);
                if (parsed) {
                    triPoints.push(parsed);
                    if (parsed.name) pointNames.push(parsed.name);
                }
            });
            drawTriangle(triPoints, color, needsFill);
            // 创建图形对象
            if (pointNames.length === 3) {
                createShape('triangle', pointNames.join(''), pointNames, color, needsFill);
            }
        }
    }
    else if (type === '坐标系') {
        let axisColor = null;
        for (let i = 1; i < parts.length; i++) {
            if (colorMap[parts[i]]) {
                axisColor = colorMap[parts[i]];
            }
        }
        drawMathAxis(axisColor);
    }
    else if (type === '正比例') {
        let k = 1;
        let funcColor = color;
        for (let i = 1; i < parts.length; i++) {
            if (colorMap[parts[i]]) {
                funcColor = colorMap[parts[i]];
            } else if (!isNaN(parseFloat(parts[i]))) {
                k = parseFloat(parts[i]);
            }
        }
        drawLinear(k, funcColor);
    }
    else if (type === '反比例') {
        let k = 1;
        let funcColor = color;
        for (let i = 1; i < parts.length; i++) {
            if (colorMap[parts[i]]) {
                funcColor = colorMap[parts[i]];
            } else if (!isNaN(parseFloat(parts[i]))) {
                k = parseFloat(parts[i]);
            }
        }
        drawInverse(k, funcColor);
    }
    else if (type === '二次函数') {
        let a = 1, b = 0, c = 0;
        let funcColor = color;
        let paramIndex = 0;
        for (let i = 1; i < parts.length; i++) {
            if (colorMap[parts[i]]) {
                funcColor = colorMap[parts[i]];
            } else if (!isNaN(parseFloat(parts[i]))) {
                if (paramIndex === 0) a = parseFloat(parts[i]);
                else if (paramIndex === 1) b = parseFloat(parts[i]);
                else if (paramIndex === 2) c = parseFloat(parts[i]);
                paramIndex++;
            }
        }
        drawQuadratic(a, b, c, funcColor);
    }
    else if (type === '函数') {
        // 支持两种格式：
        // 1. 函数 y=ax+b (一次函数)
        // 2. 函数一次 a b
        // 3. 函数 y=ax²+bx+c (二次函数)
        // 4. 函数二次 a b c
        
        let funcType = remaining.split(/\s+/)[0] || '';
        let a = 1, b = 0, c = 0;
        let funcColor = color;
        
        if (funcType === '一次' || remaining.includes('y=')) {
            // 一次函数
            for (let i = 1; i < parts.length; i++) {
                if (parts[i] === '一次') continue;
                if (colorMap[parts[i]]) {
                    funcColor = colorMap[parts[i]];
                } else if (!isNaN(parseFloat(parts[i]))) {
                    if (a === 1 && b === 0) {
                        a = parseFloat(parts[i]);
                    } else {
                        b = parseFloat(parts[i]);
                    }
                }
            }
            drawLinear(a, b, funcColor);
            // 保存函数信息
            const funcName = 'F' + (Object.keys(functions).length + 1);
            functions[funcName] = { type: 'linear', a, b, color: funcColor };
            console.log(`已保存一次函数 ${funcName}: y=${a}x${b >= 0 ? '+' + b : b}`);
        } else if (funcType === '二次' || remaining.includes('²')) {
            // 二次函数
            let paramIndex = 0;
            for (let i = 1; i < parts.length; i++) {
                if (parts[i] === '二次') continue;
                if (colorMap[parts[i]]) {
                    funcColor = colorMap[parts[i]];
                } else if (!isNaN(parseFloat(parts[i]))) {
                    if (paramIndex === 0) a = parseFloat(parts[i]);
                    else if (paramIndex === 1) b = parseFloat(parts[i]);
                    else if (paramIndex === 2) c = parseFloat(parts[i]);
                    paramIndex++;
                }
            }
            drawQuadratic(a, b, c, funcColor);
            // 保存函数信息
            const funcName = 'F' + (Object.keys(functions).length + 1);
            functions[funcName] = { type: 'quadratic', a, b, c, color: funcColor };
            console.log(`已保存二次函数 ${funcName}: y=${a}x²${b >= 0 ? '+' + b : b}x${c >= 0 ? '+' + c : c}`);
        }
    }
    else if (type === '旋转') {
        // 格式：旋转 三角形abc 绕o 45
        const shapeName = parts[1];
        let center = null;
        let angle = 0;
        
        for (let i = 2; i < parts.length; i++) {
            if (parts[i] === '绕' && i + 1 < parts.length) {
                center = points[parts[i + 1]];
            } else if (parts[i] === '绕') {
                // 可能圆心是坐标形式
                center = parsePoint(parts[i + 1]);
            } else if (!isNaN(parseFloat(parts[i]))) {
                angle = parseFloat(parts[i]);
            }
        }
        
        if (center && angle !== 0 && shapeName) {
            // 获取图形的所有点
            const shapePoints = getShapePoints(shapeName);
            if (shapePoints && shapePoints.length > 0) {
                const newPoints = [];
                shapePoints.forEach((p, i) => {
                    const rotated = rotatePoint(p, center, angle);
                    const newName = shapeName[i] + "'";  // 添加撇号
                    const newPoint = { name: newName, x: rotated.x, y: rotated.y };
                    points[newName] = newPoint;
                    newPoints.push(newPoint);
                });
                
                // 绘制新图形
                const newShapeName = shapeName + "'";
                if (shapePoints.length === 3) {
                    drawTriangle(newPoints, color, false);
                    // 创建旋转后三角形的shape对象
                    const shape = {
                        type: 'triangle',
                        name: newShapeName,
                        pointNames: newPoints.map(p => p.name),
                        color: color,
                        fill: false
                    };
                    shapes.push(shape);
                } else if (shapePoints.length === 4) {
                    drawRectangle(newPoints, color, false);
                    // 创建旋转后矩形的shape对象
                    const shape = {
                        type: 'rectangle',
                        name: newShapeName,
                        pointNames: newPoints.map(p => p.name),
                        color: color,
                        fill: false
                    };
                    shapes.push(shape);
                }
            }
        }
    }
    else if (type === '对称' || type === '对折') {
        // 格式：对称 三角形abc 关于直线l
        const shapeName = parts[1];
        let linePoint1 = null;
        let linePoint2 = null;
        
        for (let i = 2; i < parts.length; i++) {
            if (parts[i] === '关于' && i + 1 < parts.length) {
                const lineRef = parts[i + 1];
                // 检查是否是线段名称（如"ab"）
                if (lineRef.length === 2) {
                    linePoint1 = points[lineRef[0]];
                    linePoint2 = points[lineRef[1]];
                }
            }
        }
        
        if (linePoint1 && linePoint2 && shapeName) {
            const shapePoints = getShapePoints(shapeName);
            if (shapePoints && shapePoints.length > 0) {
                const newPoints = [];
                shapePoints.forEach((p, i) => {
                    const reflected = reflectPoint(p, linePoint1, linePoint2);
                    const newName = shapeName[i] + "'";
                    const newPoint = { name: newName, x: reflected.x, y: reflected.y };
                    points[newName] = newPoint;
                    newPoints.push(newPoint);
                });
                
                const newShapeName = shapeName + "'";
                if (shapePoints.length === 3) {
                    drawTriangle(newPoints, color, false);
                    // 创建对称后三角形的shape对象
                    const shape = {
                        type: 'triangle',
                        name: newShapeName,
                        pointNames: newPoints.map(p => p.name),
                        color: color,
                        fill: false
                    };
                    shapes.push(shape);
                } else if (shapePoints.length === 4) {
                    drawRectangle(newPoints, color, false);
                    // 创建对称后矩形的shape对象
                    const shape = {
                        type: 'rectangle',
                        name: newShapeName,
                        pointNames: newPoints.map(p => p.name),
                        color: color,
                        fill: false
                    };
                    shapes.push(shape);
                }
            }
        }
    }
    else if (type === '平移') {
        // 格式：平移 三角形abc 使a到m
        const shapeName = parts[1];
        let refPoint = null;  // 参考点
        let targetPoint = null;  // 目标点
        
        for (let i = 2; i < parts.length; i++) {
            if (parts[i] === '使') {
                refPoint = points[parts[i + 1]];
            } else if (parts[i] === '到' && i + 1 < parts.length) {
                targetPoint = points[parts[i + 1]];
                if (!targetPoint) {
                    targetPoint = parsePoint(parts[i + 1]);
                }
            }
        }
        
        if (refPoint && targetPoint && shapeName) {
            const dx = targetPoint.x - refPoint.x;
            const dy = targetPoint.y - refPoint.y;
            
            const shapePoints = getShapePoints(shapeName);
            if (shapePoints && shapePoints.length > 0) {
                const newPoints = [];
                shapePoints.forEach((p, i) => {
                    const translated = translatePoint(p, dx, dy);
                    const newName = shapeName[i] + "'";
                    const newPoint = { name: newName, x: translated.x, y: translated.y };
                    points[newName] = newPoint;
                    newPoints.push(newPoint);
                });
                
                const newShapeName = shapeName + "'";
                if (shapePoints.length === 3) {
                    drawTriangle(newPoints, color, false);
                    // 创建平移后三角形的shape对象
                    const shape = {
                        type: 'triangle',
                        name: newShapeName,
                        pointNames: newPoints.map(p => p.name),
                        color: color,
                        fill: false
                    };
                    shapes.push(shape);
                } else if (shapePoints.length === 4) {
                    drawRectangle(newPoints, color, false);
                    // 创建平移后矩形的shape对象
                    const shape = {
                        type: 'rectangle',
                        name: newShapeName,
                        pointNames: newPoints.map(p => p.name),
                        color: color,
                        fill: false
                    };
                    shapes.push(shape);
                }
            }
        }
    }
    else if (type === '移动' || type === 'move') {
        // 格式：移动a 使角abc=90
        let pointToMove = null;  // 要移动的点
        let anglePoint1 = null;  // 角的点1
        let angleVertex = null;  // 角的顶点
        let anglePoint3 = null;  // 角的点3
        let targetAngle = 0;
        
        for (let i = 1; i < parts.length; i++) {
            if (parts[i] === '使' || parts[i] === '令') {
                // 下一个是要移动的点
                if (i + 1 < parts.length && parts[i + 1].length === 1) {
                    pointToMove = parts[i + 1];
                }
            } else if (parts[i].includes('角') && parts[i].length >= 4) {
                // 解析角名称，如"角abc"
                const angleStr = parts[i];
                if (angleStr.startsWith('角')) {
                    const angleName = angleStr.substring(1);
                    if (angleName.length === 3) {
                        anglePoint1 = angleName[0];
                        angleVertex = angleName[1];
                        anglePoint3 = angleName[2];
                    }
                }
            } else if (parts[i].includes('=')) {
                // 解析目标角度，如"=90"
                const angleStr = parts[i].split('=')[1];
                targetAngle = parseFloat(angleStr);
            }
        }
        
        if (pointToMove && anglePoint1 && angleVertex && anglePoint3 && targetAngle > 0) {
            // 验证点是否存在
            const p1 = points[anglePoint1];
            const pv = points[angleVertex];
            const p3 = points[anglePoint3];
            const ptm = points[pointToMove];
            
            if (p1 && pv && p3 && ptm) {
                // 确定要旋转的是起点还是终点
                const rotateStart = (pointToMove === anglePoint1);
                
                // 计算新的点位置
                const newPosition = calculatePointForAngle(p1, pv, p3, targetAngle, rotateStart);
                
                // 更新点的位置
                points[pointToMove].x = newPosition.x;
                points[pointToMove].y = newPosition.y;
                
                // 重绘画布
                clearCanvas(false);
                commandHistory.forEach(c => {
                    executeCommand(c, true);
                });
                
                console.log(`已移动点 ${pointToMove}，使角${anglePoint1}${angleVertex}${anglePoint3}=${targetAngle}`);
            }
        }
    }
    else if (type === '交点') {
        // 格式：交点 ab cd (线段ab和线段cd的交点)
        //      交点 ab 圆O (线段ab和圆O的交点)
        //      交点 圆A 圆B (圆A和圆B的交点)
        //      交点 F1 ab (函数F1和线段ab的交点)
        //      交点 F1 圆O (函数F1和圆O的交点)
        
        let geom1 = parts[1];  // 第一个几何图形名称
        let geom2 = parts[2];  // 第二个几何图形名称
        
        if (geom1 && geom2) {
            // 判断类型
            const isLine1 = geom1.length >= 2;
            const isLine2 = geom2.length >= 2;
            const isCircle1 = geom1.startsWith('圆') || geom1.length === 1;
            const isCircle2 = geom2.startsWith('圆') || geom2.length === 1;
            const isFunc1 = geom1.startsWith('F') && functions[geom1];
            const isFunc2 = geom2.startsWith('F') && functions[geom2];
            
            // 线与线交点
            if (isLine1 && isLine2) {
                const p1 = points[geom1[0]];
                const p2 = points[geom1[1]];
                const p3 = points[geom2[0]];
                const p4 = points[geom2[1]];
                
                if (p1 && p2 && p3 && p4) {
                    const intersection = getLineIntersection(p1, p2, p3, p4);
                    if (intersection) {
                        drawIntersections([intersection], `线段${geom1}与线段${geom2}`);
                    } else {
                        console.log(`线段${geom1}与线段${geom2}无交点`);
                    }
                }
            }
            // 线与圆交点
            else if (isLine1 && isCircle2) {
                const p1 = points[geom1[0]];
                const p2 = points[geom1[1]];
                const circleName = geom2.startsWith('圆') ? geom2[1] : geom2;
                const circle = points[circleName];
                
                if (p1 && p2 && circle) {
                    const radius = circle.radius || 50;
                    const intersections = getLineCircleIntersection(p1, p2, circle, radius);
                    if (intersections.length > 0) {
                        drawIntersections(intersections, `线段${geom1}与圆${circleName}`);
                    } else {
                        console.log(`线段${geom1}与圆${circleName}无交点`);
                    }
                }
            }
            // 圆与圆交点
            else if (isCircle1 && isCircle2) {
                const circle1Name = geom1.startsWith('圆') ? geom1[1] : geom1;
                const circle2Name = geom2.startsWith('圆') ? geom2[1] : geom2;
                const circle1 = points[circle1Name];
                const circle2 = points[circle2Name];
                
                if (circle1 && circle2) {
                    const radius1 = circle1.radius || 50;
                    const radius2 = circle2.radius || 50;
                    const intersections = getCircleCircleIntersection(circle1, radius1, circle2, radius2);
                    if (intersections.length > 0) {
                        drawIntersections(intersections, `圆${circle1Name}与圆${circle2Name}`);
                    } else {
                        console.log(`圆${circle1Name}与圆${circle2Name}无交点`);
                    }
                }
            }
            // 函数与线交点
            else if (isFunc1 && isLine2) {
                const func = functions[geom1];
                const p1 = points[geom2[0]];
                const p2 = points[geom2[1]];
                
                if (func && p1 && p2) {
                    let intersections = [];
                    if (func.type === 'linear') {
                        intersections = getLinearLineIntersection(func.a, func.b, p1, p2);
                    } else if (func.type === 'quadratic') {
                        intersections = getQuadraticLineIntersection(func.a, func.b, func.c, p1, p2);
                    }
                    
                    if (intersections.length > 0) {
                        drawIntersections(intersections, `函数${geom1}与线段${geom2}`);
                    } else {
                        console.log(`函数${geom1}与线段${geom2}无交点`);
                    }
                }
            }
            // 函数与圆交点
            else if (isFunc1 && isCircle2) {
                const func = functions[geom1];
                const circleName = geom2.startsWith('圆') ? geom2[1] : geom2;
                const circle = points[circleName];
                
                if (func && circle) {
                    const radius = circle.radius || 50;
                    let intersections = [];
                    
                    if (func.type === 'linear') {
                        intersections = getLinearCircleIntersection(func.a, func.b, circle, radius);
                    } else if (func.type === 'quadratic') {
                        intersections = getQuadraticCircleIntersection(func.a, func.b, func.c, circle, radius);
                    }
                    
                    if (intersections.length > 0) {
                        drawIntersections(intersections, `函数${geom1}与圆${circleName}`);
                    } else {
                        console.log(`函数${geom1}与圆${circleName}无交点`);
                    }
                }
            }
            // 线与函数交点（对称情况）
            else if (isLine1 && isFunc2) {
                const func = functions[geom2];
                const p1 = points[geom1[0]];
                const p2 = points[geom1[1]];
                
                if (func && p1 && p2) {
                    let intersections = [];
                    if (func.type === 'linear') {
                        intersections = getLinearLineIntersection(func.a, func.b, p1, p2);
                    } else if (func.type === 'quadratic') {
                        intersections = getQuadraticLineIntersection(func.a, func.b, func.c, p1, p2);
                    }
                    
                    if (intersections.length > 0) {
                        drawIntersections(intersections, `线段${geom1}与函数${geom2}`);
                    } else {
                        console.log(`线段${geom1}与函数${geom2}无交点`);
                    }
                }
            }
            // 圆与函数交点（对称情况）
            else if (isCircle1 && isFunc2) {
                const func = functions[geom2];
                const circleName = geom1.startsWith('圆') ? geom1[1] : geom1;
                const circle = points[circleName];
                
                if (func && circle) {
                    const radius = circle.radius || 50;
                    let intersections = [];
                    
                    if (func.type === 'linear') {
                        intersections = getLinearCircleIntersection(func.a, func.b, circle, radius);
                    } else if (func.type === 'quadratic') {
                        intersections = getQuadraticCircleIntersection(func.a, func.b, func.c, circle, radius);
                    }
                    
                    if (intersections.length > 0) {
                        drawIntersections(intersections, `圆${circleName}与函数${geom2}`);
                    } else {
                        console.log(`圆${circleName}与函数${geom2}无交点`);
                    }
                }
            }
        }
    }
    else if (type === '删除' || type === 'remove' || type === 'del') {
        // 删除指定的图形、点或线段
        // 格式：删除 a (删除点a)
        //       删除 ab (删除线段ab)
        //       删除 三角形abc (删除三角形abc)
        //       删除 矩形abcd (删除矩形abcd)
        
        const target = parts[1];
        if (!target) {
            console.log('请指定要删除的对象');
            return;
        }
        
        // 检查是否是重做命令（从redoStack来的）
        const isRedo = typeof skipHistory === 'boolean' && skipHistory === false && 
                      redoStack.length > 0 && 
                      typeof redoStack[redoStack.length - 1] === 'object' &&
                      redoStack[redoStack.length - 1].deletedState &&
                      redoStack[redoStack.length - 1].cmd === cmd;
        
        let deletedState;
        let deletedShape = null;
        
        if (isRedo) {
            // 重做时，使用之前保存的删除状态
            deletedState = redoStack[redoStack.length - 1].deletedState;
            deletedShape = redoStack[redoStack.length - 1].deletedShape;
        } else {
            // 正在删除时，保存当前状态用于撤销
            deletedState = {
                points: JSON.parse(JSON.stringify(points)),
                labeledPoints: Array.from(labeledPoints),
                target: target
            };
            
            // 在shapes数组中查找要删除的图形
            deletedShape = shapes.find(s => s.name === target || 
                                         (target.includes('三角形') && s.name === target.substring(3)) ||
                                         ((target.includes('矩形') || target.includes('长方形')) && s.name === target.substring(2)) ||
                                         (target.includes('圆') && s.name === target));
        }
        
        // 根据找到的图形或直接删除
        if (deletedShape) {
            // 删除图形对象
            const shapeIndex = shapes.findIndex(s => s === deletedShape);
            if (shapeIndex !== -1) {
                shapes.splice(shapeIndex, 1);
            }
            
            // 删除图形关联的点
            deletedShape.pointNames.forEach(pointName => {
                if (points[pointName]) {
                    delete points[pointName];
                    labeledPoints.delete(pointName);
                }
            });
            
            console.log(`已删除图形 ${deletedShape.name}`);
        } else {
            // 未找到图形对象，按旧逻辑删除
            if (target.length === 1) {
                // 删除单个点
                if (points[target]) {
                    delete points[target];
                    labeledPoints.delete(target);
                    console.log(`已删除点 ${target}`);
                } else {
                    console.log(`点 ${target} 不存在`);
                    return;
                }
            } else if (target.length === 2) {
                // 删除线段（删除两个点）
                const p1 = target[0];
                const p2 = target[1];
                let deleted = false;
                if (points[p1]) {
                    delete points[p1];
                    labeledPoints.delete(p1);
                    deleted = true;
                }
                if (points[p2]) {
                    delete points[p2];
                    labeledPoints.delete(p2);
                    deleted = true;
                }
                if (deleted) {
                    console.log(`已删除线段 ${target}`);
                } else {
                    console.log(`线段 ${target} 不存在`);
                    return;
                }
            } else if (target.startsWith('三角形') || target.startsWith('矩形') || target.startsWith('长方形')) {
                // 删除图形的所有点
                const shapeName = target.includes('三角形') ? target.substring(3) : 
                                  (target.includes('矩形') || target.includes('长方形')) ? target.substring(2) : '';
                
                if (shapeName) {
                    let deleted = false;
                    for (let i = 0; i < shapeName.length; i++) {
                        const pointName = shapeName[i];
                        if (points[pointName]) {
                            delete points[pointName];
                            labeledPoints.delete(pointName);
                            deleted = true;
                        }
                    }
                    if (deleted) {
                        console.log(`已删除 ${target}`);
                    } else {
                        console.log(`${target} 不存在`);
                        return;
                    }
                }
            } else {
                // 可能是直接的图形名称（如abc、abcd）
                let deleted = false;
                for (let i = 0; i < target.length; i++) {
                    const pointName = target[i];
                    if (points[pointName]) {
                        delete points[pointName];
                        labeledPoints.delete(pointName);
                        deleted = true;
                    }
                }
                if (deleted) {
                    console.log(`已删除图形 ${target}`);
                } else {
                    console.log(`图形 ${target} 不存在`);
                    return;
                }
            }
        }
        
        // 只有在非重做且非重绘情况下，才将删除状态存储在命令历史中
        if (!isRedo && !skipHistory && commandHistory.length > 0) {
            commandHistory[commandHistory.length - 1] = {
                cmd: cmd,
                deletedState: deletedState,
                deletedShape: deletedShape
            };
        }
        
        // 重做时不需要重绘，因为重做流程会处理
        if (isRedo) {
            return;
        }
        
        // 重绘画布
        clearCanvas(false);
        commandHistory.forEach(c => {
            const cmdToExecute = typeof c === 'string' ? c : c.cmd;
            // 跳过删除命令，避免重新执行删除
            if (!cmdToExecute.includes('删除') && !cmdToExecute.includes('remove') && !cmdToExecute.includes('del')) {
                executeCommand(cmdToExecute, true);
            }
        });
    }
    else if (type === '清空' || type === '清除') {
        clearCanvas();
    }
}

/**
 * 显示帮助信息
 */
function showHelp() {
    const helpText = `╔════════════════════════════════════════════════════════════╗
║                    F1 几何图形生成器 - 帮助              ║
╚════════════════════════════════════════════════════════════╝

【基础图形】
  矩形abcd            自动居中绘制矩形
  直线ab              绘制连接a和b的直线
  角 a b c            绘制以b为顶点的角
  圆 O 100            绘制圆心为O、半径为100的圆
  圆 e ab             绘制圆心为e、半径为ab线段长度的圆
  三角形abc           自动居中绘制三角形

【相对位置】
  中点 a b e          创建a和b的中点e
  分点 a b f 1/3      创建ab的1/3分点f
  分点 c d g 2/3      创建cd的2/3分点g

【变换功能】
  旋转 矩形abcd 绕a 90      绕点a旋转矩形90度，生成A'B'C'D'
  对称 矩形abcd 关于直线ac  关于直线ac对称，生成A'B'C'D'
  平移 矩形abcd 使a到e      平移矩形使a点到e位置

【函数曲线】
  坐标系              绘制数学坐标系
  正比例 1            绘制y=x函数曲线
  反比例 1            绘制y=1/x函数曲线
  二次函数 1 0 0      绘制y=x²函数曲线

【样式控制】
  颜色为红            设置全局颜色为红色
  矩形abcd 蓝         绘制蓝色矩形
  矩形abcd 填充       绘制填充的矩形
  颜色为红；矩形abcd 填充；颜色为蓝；圆O 50；颜色为绿；三角形abc

【操作管理】
  撤销/undo          撤销上一个操作
  重做/redo           重做上一次撤销的操作
  清空/清除           清空画布
  删除 a              删除点a
  删除 ab             删除线段ab
  删除 三角形abc       删除三角形abc
  删除 矩形abcd       删除矩形abcd

【其他】
  帮助/help/?        显示此帮助信息

提示：所有图形自动布局，无需手动指定坐标（坐标系除外）`;
    
    console.log(helpText);
    
    // 尝试在页面上显示
    if (typeof alert !== 'undefined') {
        alert(helpText);
    }
}