/**
 * 点管理模块
 * 负责点的存储、解析和相对位置计算
 */

// 保存所有已定义的点
const points = {};

// 记录已标注的点，避免重复
const labeledPoints = new Set();

// shapes 数组已废弃，改用 shapeList (commands.js) 作为唯一数据源
// 保留此变量仅为向后兼容，实际数据从 shapeList 派生
const shapes = [];

// 颜色映射
const colorMap = {
    '红': '#ff4444',
    '蓝': '#4444ff',
    '绿': '#44aa44',
    '黄': '#ffaa00',
    '紫': '#aa44aa',
    '橙': '#ff8800',
    '黑': '#333333'
};

// 默认透明度
const defaultAlpha = 0.5;

/**
 * 解析坐标点
 * @param {string} str - 点描述，如 "A(100,200)" 或 "A"
 * @returns {Object|null} 点对象 {name, x, y}
 */
function parsePoint(str) {
    // 先检查是否是已保存的点名称
    if (points[str]) {
        return points[str];
    }
    const match = str.match(/^([A-Za-z]+)?\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)$/);
    if (match) {
        const point = {
            name: match[1] || '',
            x: parseInt(match[2]),
            y: parseInt(match[3])
        };
        // 如果有名称，保存这个点
        if (point.name) {
            points[point.name] = point;
        }
        return point;
    }
    return null;
}

/**
 * 计算两点之间的距离
 * @param {string} segmentName - 线段名称，如"CD"
 * @returns {number} 距离，如果线段不存在返回0
 */
function calculateSegmentLength(segmentName) {
    if (segmentName.length !== 2) return 0;
    
    const p1Name = segmentName[0];
    const p2Name = segmentName[1];
    
    const p1 = points[p1Name];
    const p2 = points[p2Name];
    
    if (!p1 || !p2) return 0;
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 解析颜色
 * @param {Array} parts - 命令部分数组
 * @returns {Object} {color, index}
 */
function parseColor(parts) {
    for (let i = parts.length - 1; i >= 0; i--) {
        if (colorMap[parts[i]]) {
            return {
                color: colorMap[parts[i]],
                index: i
            };
        }
    }
    return { color: colorMap['黑'], index: -1 };
}

/**
 * 检查是否是纯点名称（不含坐标）
 * @param {string} str - 待检查的字符串
 * @returns {boolean}
 */
function isPurePointName(str) {
    return /^[A-Za-z]+$/.test(str) && !str.includes('(') && !str.includes(')');
}

/**
 * 检查是否是线段名称（两个连续字母）
 * @param {string} str - 待检查的字符串
 * @returns {boolean}
 */
function isSegmentName(str) {
    return /^[A-Za-z]{2}$/.test(str);
}

/**
 * 提取点名称列表（支持abcd这种连续写法）
 * @param {string} str - 点名称字符串
 * @returns {Array} 点名称数组
 */
function extractPointNames(str) {
    // 如果是单个字母序列，如abcd，拆分成单个字母
    if (/^[A-Za-z]+$/.test(str) && str.length > 1) {
        return str.split('');
    }
    return [str];
}

/**
 * 获取下一个可用的字母标签
 * @param {number} startIndex - 起始索引
 * @returns {string} 可用的字母
 */
function getNextAvailableLetter(startIndex = 0) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = startIndex; i < alphabet.length; i++) {
        const letter = alphabet[i];
        if (!points[letter]) {
            return letter;
        }
    }
    // 如果小写字母用完了，用大写
    for (let i = 0; i < alphabet.length; i++) {
        const letter = alphabet[i].toUpperCase();
        if (!points[letter]) {
            return letter;
        }
    }
    return 'a' + startIndex; // 备用方案
}

/**
 * 获取多个连续的可用字母
 * @param {number} count - 需要的字母数量
 * @returns {Array} 字母数组
 */
function getNextAvailableLetters(count) {
    const result = [];
    let index = 0;
    while (result.length < count) {
        const letter = getNextAvailableLetter(index);
        result.push(letter);
        // 找到这个字母在字母表中的位置，从下一个继续
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        const pos = alphabet.indexOf(letter.toLowerCase());
        index = pos >= 0 ? pos + 1 : index + 1;
    }
    return result;
}

/**
 * 计算并保存相对位置点
 * @param {string} type - 类型：'中点' 或 '分点'
 * @param {Object} p1 - 第一个点
 * @param {Object} p2 - 第二个点
 * @param {string} newName - 新点名称
 * @param {number} ratio - 分点比例（仅分点时使用）
 * @returns {Object|null} 新点对象
 */
function createRelativePoint(type, p1, p2, newName, ratio = 0.5) {
    if (!p1 || !p2 || !newName) return null;
    
    let x, y;
    if (type === '中点' || type === 'middle') {
        x = (p1.x + p2.x) / 2;
        y = (p1.y + p2.y) / 2;
    } else if (type === '分点' || type === 'ratio') {
        x = p1.x + (p2.x - p1.x) * ratio;
        y = p1.y + (p2.y - p1.y) * ratio;
    }
    
    const newPoint = { name: newName, x: x, y: y };
    points[newName] = newPoint;
    return newPoint;
}

/**
 * 清空所有点和标注记录
 */
function clearPoints() {
    for (let key in points) {
        delete points[key];
    }
    labeledPoints.clear();
    // 同步清空 shapes 和 shapeList
    shapes.length = 0;
    if (window.shapeList) {
        window.shapeList.length = 0;
    }
}

// 将全局变量暴露到window，供其他模块访问
window.points = points;
window.labeledPoints = labeledPoints;
// shapes需要作为getter，确保始终引用最新的数组
Object.defineProperty(window, 'shapes', {
    get: function() { return shapes; },
    set: function(val) { 
        // 清空shapes并添加新元素
        shapes.length = 0;
        val.forEach(item => shapes.push(item));
    },
    configurable: false
});
