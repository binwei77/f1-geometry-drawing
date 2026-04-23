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

// 图形列表，用于删除功能（单一数据源）
const shapeList = [];
window.shapeList = shapeList;

/**
 * 添加图形到列表
 * @param {string} type - 图形类型
 * @param {string} name - 图形名称
 * @param {Array} points - 涉及的点名称数组
 * @param {Object} data - 图形数据（坐标、颜色等）
 * @returns {string} 图形ID
 */
function addShapeToList(type, name, pointNames, data) {
    const shape = {
        id: 'shape_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type: type,
        name: name,
        points: pointNames,
        data: data,
        createdAt: Date.now()
    };
    shapeList.push(shape);
    // 同步到shapes数组（shapes是shapeList的镜像）
    if (data && data.shape) {
        shapes.push(data.shape);
    }
    return shape.id;
}

/**
 * 从列表中删除图形
 * @param {string} shapeId - 图形ID
 * @returns {boolean} 是否成功删除
 */
function removeShapeFromList(shapeId) {
    const index = shapeList.findIndex(s => s.id === shapeId);
    if (index !== -1) {
        const removed = shapeList.splice(index, 1)[0];
        // 同步从shapes数组中删除
        if (removed && removed.data && removed.data.shape) {
            const shapeIdx = shapes.findIndex(s => s === removed.data.shape || s.name === removed.name);
            if (shapeIdx !== -1) {
                shapes.splice(shapeIdx, 1);
            }
        }
        return true;
    }
    return false;
}

/**
 * 按类型删除图形
 * @param {string} type - 图形类型
 * @returns {Array} 被删除的图形ID数组
 */
function removeShapesByType(type) {
    // 中文类型到英文类型的映射
    const typeMap = {
        '矩形': 'rectangle', '长方形': 'rectangle',
        '三角形': 'triangle',
        '圆': 'circle',
        '线段': 'segment', '直线': 'line',
        '角': 'angle',
        '中点': 'midpoint', '分点': 'division',
        '旋转': 'rotate', '对称': 'reflect', '对折': 'fold', '平移': 'translate'
    };
    const targetType = typeMap[type] || type;  // 如果已经是英文类型则直接使用
    
    const toRemove = shapeList.filter(s => s.type === targetType);
    const ids = toRemove.map(s => s.id);

    // 从列表中移除，同时从shapes数组中删除
    for (let i = shapeList.length - 1; i >= 0; i--) {
        if (shapeList[i].type === targetType) {
            const removed = shapeList.splice(i, 1)[0];
            // 同步从shapes数组中删除
            if (removed && removed.data && removed.data.shape) {
                const shapeIdx = shapes.findIndex(s => s === removed.data.shape || s.name === removed.name);
                if (shapeIdx !== -1) {
                    shapes.splice(shapeIdx, 1);
                }
            }
        }
    }

    return ids;
}

/**
 * 按名称删除图形
 * @param {string} name - 图形名称
 * @returns {Array} 被删除的图形ID数组
 */
function removeShapesByName(name) {
    // 匹配函数：支持精确匹配和前缀匹配
    function matchName(shapeEntry, name) {
        const s = shapeEntry;
        // 精确匹配
        if (s.name === name) return true;
        // 矩形前缀匹配："矩形abcd"→去掉2字, "长方形abcd"→去掉3字
        if (s.type === 'rectangle') {
            if (name.startsWith('矩形') && name.substring(2) === s.name) return true;
            if (name.startsWith('长方形') && name.substring(3) === s.name) return true;
        }
        // 三角形前缀匹配："三角形abc"→去掉3字
        if (s.type === 'triangle' && name.startsWith('三角形') && name.substring(3) === s.name) return true;
        // 圆前缀匹配："圆O"→去掉1字
        if (s.type === 'circle' && name.startsWith('圆') && name.substring(1) === s.name) return true;
        // 直线前缀匹配："直线ab"→去掉2字
        if (s.type === 'line' && name.startsWith('直线') && name.substring(2) === s.name) return true;
        // 线段前缀匹配："线段ab"→去掉2字
        if (s.type === 'segment' && name.startsWith('线段') && name.substring(2) === s.name) return true;
        // 角前缀匹配："角abc"→去掉1字
        if (s.type === 'angle' && name.startsWith('角') && name.substring(1) === s.name) return true;
        // 点匹配
        if (s.type === 'point' && name === s.name) return true;
        // 无前缀的名称匹配（如"ab"匹配线段,"abc"匹配三角形等）
        if (s.name === name) return true;
        return false;
    }

    const toRemove = shapeList.filter(s => matchName(s, name));
    const ids = toRemove.map(s => s.id);

    // 从列表中移除，同时从shapes数组中删除
    for (let i = shapeList.length - 1; i >= 0; i--) {
        if (matchName(shapeList[i], name)) {
            const removed = shapeList.splice(i, 1)[0];
            // 同步从shapes数组中删除
            if (removed && removed.data && removed.data.shape) {
                const shapeIdx = shapes.findIndex(s => s === removed.data.shape || s.name === removed.name);
                if (shapeIdx !== -1) {
                    shapes.splice(shapeIdx, 1);
                }
            }
        }
    }

    return ids;
}

/**
 * 按点删除图形
 * @param {string} pointName - 点名称
 * @returns {Array} 被删除的图形ID数组
 */
function removeShapesByPoint(pointName) {
    const toRemove = shapeList.filter(s => s.points && s.points.includes(pointName));
    const ids = toRemove.map(s => s.id);

    // 从列表中移除，同时从shapes数组中删除
    for (let i = shapeList.length - 1; i >= 0; i--) {
        if (shapeList[i].points && shapeList[i].points.includes(pointName)) {
            const removed = shapeList.splice(i, 1)[0];
            // 同步从shapes数组中删除
            if (removed && removed.data && removed.data.shape) {
                const shapeIdx = shapes.findIndex(s => s === removed.data.shape || s.name === removed.name);
                if (shapeIdx !== -1) {
                    shapes.splice(shapeIdx, 1);
                }
            }
        }
    }

    return ids;
}

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
        // 不拆分点名称，读取整个参数（包括括号内的坐标）
        let param = '';
        while (i < str.length && /[A-Za-z0-9]/.test(str[i])) {
            param += str[i];
            i++;
        }
        // 如果紧跟括号（如O(400,300)），将括号内容一起读取
        if (i < str.length && str[i] === '(') {
            const start = i;
            let depth = 0;
            while (i < str.length) {
                if (str[i] === '(') depth++;
                if (str[i] === ')') depth--;
                param += str[i];
                i++;
                if (depth === 0) break;
            }
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
function createShape(type, name, pointNames, color, fill = false, extraProps = {}) {
    // 收集所有点的坐标信息
    const pointsData = [];
    pointNames.forEach(pName => {
        if (points[pName]) {
            pointsData.push({
                name: pName,
                x: points[pName].x,
                y: points[pName].y
            });
        }
    });
    
    // 检查是否已存在同名图形
    const existingIndex = shapes.findIndex(s => s.name === name);
    if (existingIndex !== -1) {
        // 更新现有图形
        const shape = {
            type: type,
            name: name,
            pointNames: pointNames,
            color: color,
            fill: fill,
            ...extraProps
        };
        shapes[existingIndex] = shape;
        console.log(`已更新图形 ${name}`);
        
        // 更新shapeList中的记录
        const shapeListIndex = shapeList.findIndex(s => s.name === name);
        if (shapeListIndex !== -1) {
            shapeList[shapeListIndex] = {
                id: shapeList[shapeListIndex].id,
                type: type,
                name: name,
                points: pointNames,
                data: {
                    shape: shape,
                    points: pointsData,
                    type: type,
                    color: color,
                    fill: fill,
                    ...extraProps
                },
                createdAt: shapeList[shapeListIndex].createdAt
            };
        }
        
        return shape;
    }
    
    // 创建新图形
    const shape = {
        type: type,
        name: name,
        pointNames: pointNames,
        color: color,
        fill: fill,
        ...extraProps
    };
    // shapes.push(shape) 已由 addShapeToList 同步
    console.log(`已创建图形 ${name} (${type})`);
    
    // 记录到shapeList（同时会同步到shapes数组）
    addShapeToList(type, name, pointNames, {
        shape: shape,
        points: pointsData,
        type: type,
        color: color,
        fill: fill,
        ...extraProps
    });
    
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
                
                // 恢复图形对象（如果有）— 同时恢复到shapes和shapeList
                if (lastCmd.deletedShape) {
                    shapes.push(lastCmd.deletedShape);
                    // 同步到shapeList（重新添加图形记录）
                    if (lastCmd.deletedShapeListEntry) {
                        shapeList.push(lastCmd.deletedShapeListEntry);
                    }
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
            else if ((cmdStr === '清空' || cmdStr === '清除') && lastCmd.clearedState) {
                // 恢复点的状态
                Object.keys(points).forEach(key => delete points[key]);
                Object.assign(points, lastCmd.clearedState.points);
                
                // 恢复labeledPoints
                labeledPoints.clear();
                lastCmd.clearedState.labeledPoints.forEach(pointName => {
                    labeledPoints.add(pointName);
                });
                
                // 恢复shapes数组和shapeList
                shapes.length = 0;
                shapeList.length = 0;
                if (lastCmd.clearedState.shapes) {
                    lastCmd.clearedState.shapes.forEach(shape => {
                        shapes.push(shape);
                    });
                }
                if (lastCmd.clearedState.shapeList) {
                    lastCmd.clearedState.shapeList.forEach(entry => {
                        shapeList.push(entry);
                    });
                }
                
                // 重绘画布（不重绘历史命令，因为已经恢复了清空前的状态）
                clearCanvas(false);
                commandHistory.forEach(c => {
                    const cmdToExecute = typeof c === 'string' ? c : c.cmd;
                    // 跳过清空和删除命令，避免重新执行
                    if (!cmdToExecute.includes('删除') && !cmdToExecute.includes('remove') && 
                        !cmdToExecute.includes('del') && !cmdToExecute.includes('清空') && 
                        !cmdToExecute.includes('清除')) {
                        executeCommand(cmdToExecute, true);
                    }
                });
                
                console.log('撤销清空，已恢复对象');
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
                        deletedShape: cmdToRedo.deletedShape,
                        deletedShapeListEntry: cmdToRedo.deletedShapeListEntry
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
    
    // 处理列表命令
    if (cmd === '列表' || cmd === 'list') {
        showShapeList();
        return;
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
    
    // 处理删除命令
    if (type === '删除' || type === 'remove' || type === 'del') {
        handleDeleteCommand(cmd, parts);
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
        
        // 提取点名称
        let allPointNames = [];
        pointArgs.forEach(arg => {
            allPointNames = allPointNames.concat(extractPointNames(arg));
        });
        
        // 检查是否有坐标
        const hasCoordinates = pointArgs.some(p => p.includes('(') && p.includes(')'));
        
        // 如果既没有点名称也没有坐标，提示用户
        if (allPointNames.length === 0 && !hasCoordinates) {
            console.log('请输入4个点的名称，如：矩形abcd');
            return;
        }
        
        // 检查所有点是否都已存在
        const allPointsExist = allPointNames.length === 4 && 
                               allPointNames.every(name => points[name]);
        
        if (allPointsExist) {
            // 使用已存在的点绘制矩形
            const rectPoints = allPointNames.map(name => points[name]);
            drawRectangle(rectPoints, color, needsFill);
            // 创建图形对象
            createShape('rectangle', allPointNames.join(''), allPointNames, color, needsFill);
        } else if (hasCoordinates) {
            // 原有坐标模式
            const rectPoints = [];
            pointArgs.forEach(p => {
                const parsed = parsePoint(p);
                if (parsed) rectPoints.push(parsed);
            });
            if (rectPoints.length === 4) {
                drawRectangle(rectPoints, color, needsFill);
                // 创建图形对象（使用所有点的名称）
                const pointNames = rectPoints.map(p => p.name).filter(n => n);
                if (pointNames.length === 4) {
                    createShape('rectangle', pointNames.join(''), pointNames, color, needsFill);
                }
            } else {
                console.log('请提供4个点的坐标，如：矩形 A(100,200) B(200,200) C(200,300) D(100,300)');
            }
        } else if (allPointNames.length === 4) {
            // 提供了点名称但点不存在，自动生成这些点
            const rectPoints = autoRectangle(allPointNames);
            drawRectangle(rectPoints, color, needsFill);
            // 创建图形对象
            createShape('rectangle', allPointNames.join(''), allPointNames, color, needsFill);
        } else {
            console.log('请输入4个点的名称，如：矩形abcd');
        }
    }
    else if (type === '直线' || type === '线段') {
        const pointArgs = [];
        for (let i = 1; i < parts.length; i++) {
            if (i === colorResult.index) continue;
            pointArgs.push(parts[i]);
        }
        
        // 提取点名称
        let allPointNames = [];
        pointArgs.forEach(arg => {
            allPointNames = allPointNames.concat(extractPointNames(arg));
        });
        
        // 检查是否有坐标
        const hasCoordinates = pointArgs.some(p => p.includes('(') && p.includes(')'));
        
        // 如果既没有点名称也没有坐标，提示用户
        if (allPointNames.length === 0 && !hasCoordinates) {
            console.log('请输入2个点的名称，如：线段ab');
            return;
        }
        
        // 检查所有点是否都已存在
        const allPointsExist = allPointNames.length === 2 && 
                               allPointNames.every(name => points[name]);
        
        if (allPointsExist) {
            // 使用已存在的点绘制线段
            const linePoints = allPointNames.map(name => points[name]);
            drawLine(linePoints, color);
            // 创建图形对象
            createShape(type === '线段' ? 'segment' : 'line', allPointNames.join(''), allPointNames, color);
        } else if (hasCoordinates) {
            // 使用坐标坐标模式
            const linePoints = [];
            const pointNames = [];
            pointArgs.forEach(p => {
                const parsed = parsePoint(p);
                if (parsed) {
                    linePoints.push(parsed);
                    if (parsed.name) pointNames.push(parsed.name);
                }
            });
            if (linePoints.length >= 2) {
                drawLine(linePoints, color);
                // 创建图形对象
                if (pointNames.length >= 2) {
                    createShape(type === '线段' ? 'segment' : 'line', pointNames.join(''), pointNames, color);
                }
            } else {
                console.log('请提供至少2个点的坐标');
            }
        } else if (allPointNames.length === 2) {
            // 提供了点名称但点不存在，自动生成这些点
            const linePoints = autoLine(allPointNames);
            drawLine(linePoints, color);
            // 创建图形对象
            createShape(type === '线段' ? 'segment' : 'line', allPointNames.join(''), allPointNames, color);
        } else {
            console.log('请输入2个点的名称，如：线段ab');
        }
    }
    else if (type === '角') {
        const pointArgs = [];
        for (let i = 1; i < parts.length; i++) {
            if (i === colorResult.index) continue;
            pointArgs.push(parts[i]);
        }
        
        // 提取点名称
        let allPointNames = [];
        pointArgs.forEach(arg => {
            allPointNames = allPointNames.concat(extractPointNames(arg));
        });
        
        // 检查是否有坐标
        const hasCoordinates = pointArgs.some(p => p.includes('(') && p.includes(')'));
        
        // 如果既没有点名称也没有坐标，提示用户
        if (allPointNames.length === 0 && !hasCoordinates) {
            console.log('请输入3个点的名称，如：角abc');
            return;
        }
        
        // 检查所有点是否都已存在
        const allPointsExist = allPointNames.length === 3 && 
                               allPointNames.every(name => points[name]);
        
        if (allPointsExist) {
            // 使用已存在的点绘制角
            const anglePoints = allPointNames.map(name => points[name]);
            drawAngle(anglePoints[0], anglePoints[1], anglePoints[2], color);
            createShape('angle', allPointNames.join(''), allPointNames, color, false);
        } else if (hasCoordinates) {
            // 使用坐标绘制角
            if (pointArgs.length >= 3) {
                const p1 = parsePoint(pointArgs[0]);
                const p2 = parsePoint(pointArgs[1]);
                const p3 = parsePoint(pointArgs[2]);
                if (p1 && p2 && p3) {
                    drawAngle(p1, p2, p3, color);
                    const anglePointNames = [p1.name, p2.name, p3.name].filter(n => n);
                    if (anglePointNames.length >= 3) {
                        createShape('angle', anglePointNames.join(''), anglePointNames, color, false);
                    }
                } else {
                    console.log('请提供3个有效的点的坐标');
                }
            } else {
                console.log('请提供3个点的坐标，如：角 A(100,200) B(150,250) C(200,200)');
            }
        } else if (allPointNames.length === 3) {
            // 提供了点名称但点不存在，自动生成这些点
            const anglePoints = autoAngle(allPointNames);
            drawAngle(anglePoints[0], anglePoints[1], anglePoints[2], color);
            createShape('angle', allPointNames.join(''), allPointNames, color, false);
        } else {
            console.log('请输入3个点的名称，如：角abc');
        }
    }
    else if (type === '圆') {
        let center = null;
        let radius = 0;
        let centerName = null;
        let segmentName = null;  // 用于存储线段名称
        
        console.log('[DEBUG圆] parts=' + JSON.stringify(parts) + ', colorResult.index=' + colorResult.index);
        
        for (let i = 1; i < parts.length; i++) {
            if (i === colorResult.index) continue;
            if (parts[i] === '填充' || parts[i] === 'fill') continue;
            
            const p = parsePoint(parts[i]);
            console.log('[DEBUG圆] i=' + i + ' part="' + parts[i] + '" parsePoint=' + JSON.stringify(p) + ' isSegmentName=' + isSegmentName(parts[i]) + ' isNaN=' + isNaN(parseInt(parts[i])) + ' isPurePointName=' + isPurePointName(parts[i]));
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
        
        console.log('[DEBUG圆] center=' + JSON.stringify(center) + ' radius=' + radius + ' centerName=' + centerName + ' segmentName=' + segmentName);
        
        // 检查是否提供了圆心或线段
        if (!center && !centerName && !segmentName) {
            console.log('请输入圆心点和半径，或使用线段作为半径，如：圆 O r 或 圆 O CD');
            return;
        }
        
        // 如果有线段名称，计算线段长度作为半径
        if (segmentName) {
            radius = calculateSegmentLength(segmentName);
            if (radius === 0) {
                console.log(`线段 ${segmentName} 不存在或长度为0`);
                return;
            }
        }
        
        // 如果提供了圆心名称但圆心不存在，使用点名称绘制
        if (centerName && !center) {
            center = points[centerName];
            if (!center) {
                console.log(`点 ${centerName} 不存在，请先定义该点或提供坐标`);
                return;
            }
        }
        
        if (center && radius > 0) {
            // 确保圆心点已保存到points对象（parsePoint可能已保存，但这里确保不遗漏）
            if (center.name && !points[center.name]) {
                points[center.name] = center;
            }
            console.log('[DEBUG圆] 调用drawCircle center=' + JSON.stringify(center) + ' radius=' + radius + ' color=' + color);
            drawCircle(center, radius, color, needsFill);
            if (centerName) {
                createShape('circle', '圆' + centerName, [centerName], color, needsFill, {radius: radius});
            } else {
                // 当parsePoint返回了点对象但没有设置centerName时，从center.name获取
                const name = center.name || '';
                if (name) {
                    createShape('circle', '圆' + name, [name], color, needsFill, {radius: radius});
                }
            }
            console.log('已创建图形 圆' + (centerName || center.name || '') + ' (circle)');
        } else if (center && radius === 0) {
            console.log('请提供半径值或线段');
        } else {
            console.log('请提供圆心点和半径');
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
        
        // 提取点名称
        let allPointNames = [];
        pointArgs.forEach(arg => {
            allPointNames = allPointNames.concat(extractPointNames(arg));
        });
        
        // 检查是否有坐标
        const hasCoordinates = pointArgs.some(p => p.includes('(') && p.includes(')'));
        
        // 如果既没有点名称也没有坐标，提示用户
        if (allPointNames.length === 0 && !hasCoordinates) {
            console.log('请输入3个点的名称，如：三角形abc');
            return;
        }
        
        // 检查所有点是否都已存在
        const allPointsExist = allPointNames.length === 3 && 
                               allPointNames.every(name => points[name]);
        
        if (allPointsExist) {
            // 使用已存在的点绘制三角形
            const triPoints = allPointNames.map(name => points[name]);
            drawTriangle(triPoints, color, needsFill);
            // 创建图形对象
            createShape('triangle', allPointNames.join(''), allPointNames, color, needsFill);
        } else if (hasCoordinates) {
            // 使用坐标绘制三角形
            const triPoints = [];
            const pointNames = [];
            pointArgs.forEach(p => {
                const parsed = parsePoint(p);
                if (parsed) {
                    triPoints.push(parsed);
                    if (parsed.name) pointNames.push(parsed.name);
                }
            });
            if (triPoints.length === 3) {
                drawTriangle(triPoints, color, needsFill);
                // 创建图形对象
                if (pointNames.length === 3) {
                    createShape('triangle', pointNames.join(''), pointNames, color, needsFill);
                }
            } else {
                console.log('请提供3个点的坐标，如：三角形 A(100,200) B(200,200) C(150,300)');
            }
        } else if (allPointNames.length === 3) {
            // 提供了点名称但点不存在，自动生成这些点
            const triPoints = autoTriangle(allPointNames);
            drawTriangle(triPoints, color, needsFill);
            // 创建图形对象
            createShape('triangle', allPointNames.join(''), allPointNames, color, needsFill);
        } else {
            console.log('请输入3个点的名称，如：三角形abc');
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
        let shapeName = parts[1];
        // 去掉类型前缀，只保留点名称部分
        const typePrefixes = ['三角形', '矩形', '长方形'];
        for (const pfx of typePrefixes) {
            if (shapeName.startsWith(pfx)) { shapeName = shapeName.substring(pfx.length); break; }
        }
        let center = null;
        let angle = 0;
        
        for (let i = 2; i < parts.length; i++) {
            if (parts[i] === '绕' && i + 1 < parts.length) {
                center = points[parts[i + 1]];
            } else if (parts[i] === '绕') {
                // 可能圆心是坐标形式
                center = parsePoint(parts[i + 1]);
            } else if (parts[i].startsWith('绕')) {
                // 粘合格式：绕e → 中心点为e
                const centerName = parts[i].substring(1);
                center = points[centerName] || parsePoint(centerName);
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
                    // 记录到shapeList
                    addShapeToList('triangle', newShapeName, newPoints.map(p => p.name), {
                        shape: shape,
                        points: newPoints.map(p => ({name: p.name, x: p.x, y: p.y})),
                        type: 'triangle',
                        color: color,
                        fill: false
                    });
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
                    // 记录到shapeList（addShapeToList内部同步shapes）
                    addShapeToList('rectangle', newShapeName, newPoints.map(p => p.name), {
                        shape: shape,
                        points: newPoints.map(p => ({name: p.name, x: p.x, y: p.y})),
                        type: 'rectangle',
                        color: color,
                        fill: false
                    });
                }
            }
        }
    }
    else if (type === '对称' || type === '对折') {
        // 格式：对称 三角形abc 关于直线l
        let shapeName = parts[1];
        // 去掉类型前缀，只保留点名称部分
        const typePrefixes = ['三角形', '矩形', '长方形'];
        for (const pfx of typePrefixes) {
            if (shapeName.startsWith(pfx)) { shapeName = shapeName.substring(pfx.length); break; }
        }
        let linePoint1 = null;
        let linePoint2 = null;
        
        for (let i = 2; i < parts.length; i++) {
            if (parts[i] === '关于' && i + 1 < parts.length) {
                const lineRef = parts[i + 1];
                // 去掉"直线"前缀
                const ref = lineRef.startsWith('直线') ? lineRef.substring(2) : lineRef;
                if (ref.length === 2) {
                    linePoint1 = points[ref[0]];
                    linePoint2 = points[ref[1]];
                }
            } else if (parts[i].startsWith('关于')) {
                // 粘合格式：关于直线ab 或 关于ab
                const rest = parts[i].substring(2);
                const ref = rest.startsWith('直线') ? rest.substring(2) : rest;
                if (ref.length === 2) {
                    linePoint1 = points[ref[0]];
                    linePoint2 = points[ref[1]];
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
                    // 记录到shapeList
                    addShapeToList('triangle', newShapeName, newPoints.map(p => p.name), {
                        shape: shape,
                        points: newPoints.map(p => ({name: p.name, x: p.x, y: p.y})),
                        type: 'triangle',
                        color: color,
                        fill: false
                    });
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
                    // 记录到shapeList
                    addShapeToList('rectangle', newShapeName, newPoints.map(p => p.name), {
                        shape: shape,
                        points: newPoints.map(p => ({name: p.name, x: p.x, y: p.y})),
                        type: 'rectangle',
                        color: color,
                        fill: false
                    });
                }
            }
        }
    }
    else if (type === '平移') {
        // 格式：平移 三角形abc 使a到m
        let shapeName = parts[1];
        // 去掉类型前缀，只保留点名称部分
        const typePrefixes = ['三角形', '矩形', '长方形'];
        for (const pfx of typePrefixes) {
            if (shapeName.startsWith(pfx)) { shapeName = shapeName.substring(pfx.length); break; }
        }
        let refPoint = null;  // 参考点
        let targetPoint = null;  // 目标点
        
        for (let i = 2; i < parts.length; i++) {
            if (parts[i] === '使' && i + 1 < parts.length) {
                refPoint = points[parts[i + 1]];
            } else if (parts[i].startsWith('使')) {
                // 粘合格式：使a到m → 需要解析"使a"和后续"到m"
                const afterShi = parts[i].substring(1);
                if (afterShi.length >= 1) {
                    // 提取参考点名（第一个字符）
                    const toIdx = afterShi.indexOf('到');
                    if (toIdx > 0) {
                        refPoint = points[afterShi.substring(0, toIdx)];
                        const targetName = afterShi.substring(toIdx + 1);
                        targetPoint = points[targetName] || parsePoint(targetName);
                    } else {
                        refPoint = points[afterShi];
                    }
                }
            } else if (parts[i] === '到' && i + 1 < parts.length) {
                targetPoint = points[parts[i + 1]];
                if (!targetPoint) {
                    targetPoint = parsePoint(parts[i + 1]);
                }
            } else if (parts[i].startsWith('到')) {
                // 粘合格式：到m
                const targetName = parts[i].substring(1);
                targetPoint = points[targetName] || parsePoint(targetName);
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
                        point: newPoints.map(p => p.name),
                        color: color,
                        fill: false
                    };
                    // 记录到shapeList
                    addShapeToList('triangle', newShapeName, newPoints.map(p => p.name), {
                        shape: shape,
                        points: newPoints.map(p => ({name: p.name, x: p.x, y: p.y})),
                        type: 'triangle',
                        color: color,
                        fill: false
                    });
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
                    // 记录到shapeList
                    addShapeToList('rectangle', newShapeName, newPoints.map(p => p.name), {
                        shape: shape,
                        points: newPoints.map(p => ({name: p.name, x: p.x, y: p.y})),
                        type: 'rectangle',
                        color: color,
                        fill: false
                    });
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
        
        // 第一个参数始终是要移动的点
        if (parts[1] && parts[1].length <= 2) {
            pointToMove = parts[1];
        }
        
        for (let i = 1; i < parts.length; i++) {
            let token = parts[i];
            
            // 处理粘合格式：使角abc=90 → 去掉"使"前缀，解析"角abc=90"
            if (token.startsWith('使') || token.startsWith('令')) {
                token = token.substring(1);
            }
            
            if (token.includes('角') && token.length >= 4) {
                // 解析角名称，如"角abc"或"角abc=90"
                const angleStr = token.startsWith('角') ? token : null;
                if (angleStr) {
                    const nameAndValue = angleStr.substring(1); // 去掉"角"
                    const eqIdx = nameAndValue.indexOf('=');
                    if (eqIdx > 0) {
                        // "abc=90" 格式
                        const namePart = nameAndValue.substring(0, eqIdx);
                        if (namePart.length === 3) {
                            anglePoint1 = namePart[0];
                            angleVertex = namePart[1];
                            anglePoint3 = namePart[2];
                        }
                        targetAngle = parseFloat(nameAndValue.substring(eqIdx + 1));
                    } else if (nameAndValue.length === 3) {
                        // "abc" 格式，角度值在下一个token
                        anglePoint1 = nameAndValue[0];
                        angleVertex = nameAndValue[1];
                        anglePoint3 = nameAndValue[2];
                    }
                }
            } else if (token.includes('=')) {
                // 独立的 "=90" 格式
                const angleStr = token.split('=')[1];
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
        let deletedShapeListEntry = null;
        
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
            // shapes数组中的name格式：'点A', '三角形abc', '矩形abcd', '圆O'
            // 输入target格式：'A', '三角形abc', '矩形abcd', '圆O' 或 'abcd', 'O'
            deletedShape = shapes.find(s => {
                // 直接匹配完整名称
                if (s.name === target) return true;
                
                // 如果target包含"矩形"或"长方形"，去掉前缀后匹配
                if ((target.includes('矩形') || target.includes('长方形')) && 
                    s.type === 'rectangle' && 
                    target.substring(2) === s.name) {
                    return true;
                }
                
                // 如果target包含"三角形"，去掉前缀后匹配
                if (target.includes('三角形') && 
                    s.type === 'triangle' && 
                    target.substring(3) === s.name) {
                    return true;
                }
                
                // 如果是圆，输入可能是圆心点名
                if (s.type === 'circle' && target === s.name.substring(1)) return true;
                
                // 如果是点，输入可能是点名
                if (s.type === 'point' && target === s.name) return true;
                
                return false;
            });
            
            console.log(`删除命令: 查找target="${target}", deletedShape=${deletedShape ? deletedShape.name : 'null'}`);
        }
        
        // 根据找到的图形或直接删除
        if (deletedShape) {
            // 同时从shapes和shapeList中删除
            const shapeIndex = shapes.findIndex(s => s === deletedShape);
            if (shapeIndex !== -1) {
                shapes.splice(shapeIndex, 1);
            }
            // 同步从shapeList中删除，并保存被删除的entry用于撤销
            const shapeListIndex = shapeList.findIndex(s => s.data && s.data.shape === deletedShape);
            if (shapeListIndex !== -1) {
                deletedShapeListEntry = shapeList.splice(shapeListIndex, 1)[0];
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
                deletedShape: deletedShape,
                deletedShapeListEntry: deletedShapeListEntry || null
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
        // 只有在非重绘情况下，才将清除状态存储在命令历史中
        if (!skipHistory && commandHistory.length > 0) {
            // 保存清除前的状态用于撤销（包括shapes和shapeList）
            const clearedState = {
                points: JSON.parse(JSON.stringify(points)),
                labeledPoints: Array.from(labeledPoints),
                shapes: JSON.parse(JSON.stringify(shapes)),
                shapeList: JSON.parse(JSON.stringify(shapeList))
            };
            
            // 更新commandHistory中的最后一个命令
            commandHistory[commandHistory.length - 1] = {
                cmd: cmd,
                clearedState: clearedState
            };
        }
        
        // 清空画布
        clearCanvas();
        // 清空shapes数组和shapeList（统一清空）
        shapes.length = 0;
        shapeList.length = 0;
        // 清空redoStack
        redoStack.length = 0;
        console.log('画布已清空');
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
  对称 矩形abcd 关于直线ac  关于直线ac对称，生成A'BC'D'
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

【操作命令】
  撤销/undo          撤销上一个操作
  重做/redo           重做上一次撤销的操作
  删除/remove/del     删除指定图形、点或线段
  清空/清除           清空画布`;

    console.log(helpText);
}

// 将全局变量暴露到window，供其他模块访问
window.commandHistory = commandHistory;
window.redoStack = redoStack;
window.executeCommand = executeCommand;
window.showHelp = showHelp;

/**
 * 显示图形列表
 */
function showShapeList() {
    if (shapeList.length === 0) {
        console.log('当前没有绘制的图形');
        const outputElement = document.getElementById('output');
        if (outputElement) {
            outputElement.innerHTML += '当前没有绘制的图形<br>';
        }
        return;
    }
    
    let output = '图形清单 (共' + shapeList.length + '个)：<br>';
    shapeList.forEach((shape, index) => {
        output += (index + 1) + '. ' + shape.name + ' - 点：' + (shape.points || []).join(',') + '<br>';
    });
    
    console.log(output.replace(/<br>/g, '\n'));
    const outputElement = document.getElementById('output');
    if (outputElement) {
        outputElement.innerHTML += output;
    }
}

/**
 * 处理删除命令
 */
function handleDeleteCommand(cmd, parts) {
    if (parts.length < 2) {
        console.log('请指定删除目标：删除[矩形|线段|圆|...], 或 删除[图形名], 或 删除点[点名], 或 删除最新的');
        return;
    }
    
    const target = parts[1];
    
    // 删除类型
    const shapeTypes = ['矩形', '长方形', '直线', '线段', '角', '圆', '中点', '分点', '三角形', '旋转', '对称', '对折', '平移'];
    if (shapeTypes.includes(target)) {
        // 如果类型后面还有参数，则是按名称删除（如"删除 矩形 abcd"→删除名称为abcd的矩形）
        if (parts.length > 2) {
            const shapeName = target + parts.slice(2).join('');
            deleteShapeByName(shapeName);
        } else {
            deleteShapesByType(target);
        }
        return;
    }
    
    // 删除点名
    if (target === '点' && parts[2]) {
        deleteShapesByPoint(parts[2]);
        return;
    }
    
    // 删除最新
    if (target === '最新' || target === 'latest') {
        deleteLatestShape();
        return;
    }
    
    // 删除图形名（可能是"删除矩形abcd"）
    const shapeName = cmd.substring(2).trim();
    deleteShapeByName(shapeName);
}

/**
 * 按类型删除图形并重绘
 * @param {string} type - 图形类型
 * @param {boolean} skipHistory - 是否跳过历史记录
 */
function deleteShapesByType(type, skipHistory = false) {
    if (!skipHistory) {
        // 保存删除前的状态
        const deletedState = {
            points: JSON.parse(JSON.stringify(points)),
            labeledPoints: Array.from(labeledPoints),
            shapes: JSON.parse(JSON.stringify(shapes)),
            functions: JSON.parse(JSON.stringify(functions)),
            shapeList: JSON.parse(JSON.stringify(shapeList)),
            globalColor: globalColor
        };
        
        // 记录到历史
        commandHistory.push({
            cmd: '删除' + type,
            deletedState: deletedState
        });
    }
    
    const ids = removeShapesByType(type);
    if (ids.length === 0) {
        console.log('没有找到类型为"' + type + '"的图形');
        return;
    }
    
    // 重建画布
    rebuildCanvas();
    console.log('已删除 ' + ids.length + ' 个' + type);
}

/**
 * 按名称删除图形并重绘
 * @param {string} name - 图形名称
 * @param {boolean} skipHistory - 是否跳过历史记录
 */
function deleteShapeByName(name, skipHistory = false) {
    if (!skipHistory) {
        // 保存删除前的状态
        const deletedState = {
            points: JSON.parse(JSON.stringify(points)),
            labeledPoints: Array.from(labeledPoints),
            shapes: JSON.parse(JSON.stringify(shapes)),
            functions: JSON.parse(JSON.stringify(functions)),
            shapeList: JSON.parse(JSON.stringify(shapeList)),
            globalColor: globalColor
        };
        
        // 记录到历史
        commandHistory.push({
            cmd: '删除' + name,
            deletedState: deletedState
        });
    }
    
    const ids = removeShapesByName(name);
    if (ids.length === 0) {
        console.log('没有找到名为"' + name + '"的图形');
        return;
    }
    
    rebuildCanvas();
    console.log('已删除：' + name);
}

/**
 * 按点删除图形并重绘
 * @param {string} pointName - 点名称
 * @param {boolean} skipHistory - 是否跳过历史记录
 */
function deleteShapesByPoint(pointName, skipHistory = false) {
    if (!skipHistory) {
        // 保存删除前的状态
        const deletedState = {
            points: JSON.parse(JSON.stringify(points)),
            labeledPoints: Array.from(labeledPoints),
            shapes: JSON.parse(JSON.stringify(shapes)),
            functions: JSON.parse(JSON.stringify(functions)),
            shapeList: JSON.parse(JSON.stringify(shapeList)),
            globalColor: globalColor
        };
        
        // 记录到历史
        commandHistory.push({
            cmd: '删除点' + pointName,
            deletedState: deletedState
        });
    }
    
    const ids = removeShapesByPoint(pointName);
    if (ids.length === 0) {
        console.log('没有找到包含点"' + pointName + '"的图形');
        return;
    }
    
    rebuildCanvas();
    console.log('已删除 ' + ids.length + ' 个包含点' + pointName + '的图形');
}

/**
 * 删除最新图形
 * @param {boolean} skipHistory - 是否跳过历史记录
 */
function deleteLatestShape(skipHistory = false) {
    if (shapeList.length === 0) {
        console.log('当前没有图形可删除');
        return;
    }
    
    if (!skipHistory) {
        // 保存删除前的
        const deletedState = {
            points: JSON.parse(JSON.stringify(points)),
            labeledPoints: Array.from(labeledPoints),
            shapes: JSON.parse(JSON.stringify(shapes)),
            functions: JSON.parse(JSON.stringify(functions)),
            shapeList: JSON.parse(JSON.stringify(shapeList)),
            globalColor: globalColor
        };
        
        // 记录到历史
        commandHistory.push({
            cmd: '删除最新的',
            deletedState: deletedState
        });
    }
    
    const shape = shapeList.pop();
    rebuildCanvas();
    console.log('已删除最新图形：' + shape.name);
}

/**
 * 重建画布（根据shapeList重新执行绘制）
 */
function rebuildCanvas() {
    clearCanvas(false);
    
    // 清空所有数据
    Object.keys(points).forEach(key => delete points[key]);
    labeledPoints.clear();
    shapes.length = 0;
    Object.keys(functions).forEach(key => delete functions[key]);
    
    // 注意：不清空shapeList，因为rebuildCanvas是基于shapeList重建的
    
    // 按创建时间排序
    const sortedShapes = [...shapeList].sort((a, b) => a.createdAt - b.createdAt);
    
    // 重新绘制所有图形
    sortedShapes.forEach(shape => {
        redrawShape(shape);
    });
}

/**
 * 重绘单个图形
 */
function redrawShape(shape) {
    if (!shape.data || !shape.data.shape) return;
    
    // 恢复点数据
    if (shape.data.points) {
        shape.data.points.forEach(p => {
            points[p.name] = {x: p.x, y: p.y};
            labeledPoints.add(p.name);
        });
    }
    
    // 恢复图形对象
    const shapeData = shape.data.shape;
    shapes.push(shapeData);
    
    // 根据pointNames从points对象中构建坐标数组
    const pn = shapeData.pointNames || [];
    const pts = pn.map(n => points[n]).filter(Boolean);
    
    // 重绘
    if (shapeData.type === 'line' || shapeData.type === 'segment') {
        if (pts.length >= 2) drawLine(pts, shapeData.color);
    } else if (shapeData.type === 'rectangle') {
        if (pts.length >= 4) drawRectangle(pts, shapeData.color, shapeData.fill);
    } else if (shapeData.type === 'circle') {
        if (pts.length >= 1 && shapeData.radius) {
            drawCircle(pts[0], shapeData.radius, shapeData.color, shapeData.fill);
        }
    } else if (shapeData.type === 'triangle') {
        if (pts.length >= 3) drawTriangle(pts, shapeData.color, shapeData.fill);
    } else if (shapeData.type === 'angle') {
        if (pts.length >= 3) drawAngle(pts[0], pts[1], pts[2], shapeData.color);
    }
}