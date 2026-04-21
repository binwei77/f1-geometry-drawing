/**
 * Canvas基础模块
 * 负责网格绘制、坐标系、自动布局等基础功能
 */

let canvas, ctx;
let currentZoom = 1;
const minZoom = 0.5;
const maxZoom = 2;
const zoomStep = 0.25;

// 画布基准尺寸（用于计算默认图形位置和大小）
const baseWidth = 800;
const baseHeight = 600;
const centerX = baseWidth / 2;
const centerY = baseHeight / 2;
// 占画布1/8的尺寸（基于基准尺寸，固定不变）- 初始图形大小减小一半
const autoSize = Math.min(baseWidth, baseHeight) / 8;

// 数学坐标系与Canvas坐标系转换
const mathCenterX = baseWidth / 2;
const mathCenterY = baseHeight / 2;
const mathScale = 40; // 1单位 = 40像素

/**
 * 初始化Canvas
 */
function initCanvas() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
}

/**
 * 数学坐标转Canvas坐标
 * @param {number} x - 数学X坐标
 * @param {number} y - 数学Y坐标
 * @returns {Object} Canvas坐标 {x, y}
 */
function mathToCanvas(x, y) {
    return {
        x: mathCenterX + x * mathScale,
        y: mathCenterY - y * mathScale
    };
}

/**
 * 绘制网格
 */
function drawGrid() {
    const gridSize = 5; // 网格间距5像素
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    
    // 垂直线（+0.5像素偏移避免模糊）
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, canvas.height);
        ctx.stroke();
    }
    
    // 水平线（+0.5像素偏移避免模糊）
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(canvas.width, y + 0.5);
        ctx.stroke();
    }
}

/**
 * 绘制数学坐标系
 * @param {string} color - 坐标系颜色
 */
function drawMathAxis(color) {
    ctx.save();
    ctx.strokeStyle = color || '#666';
    ctx.lineWidth = 1.5;
    
    // X轴
    ctx.beginPath();
    ctx.moveTo(0, mathCenterY);
    ctx.lineTo(canvas.width, mathCenterY);
    ctx.stroke();
    
    // Y轴
    ctx.beginPath();
    ctx.moveTo(mathCenterX, 0);
    ctx.lineTo(mathCenterX, canvas.height);
    ctx.stroke();
    
    // X轴箭头
    ctx.beginPath();
    ctx.moveTo(canvas.width - 10, mathCenterY - 5);
    ctx.lineTo(canvas.width, mathCenterY);
    ctx.lineTo(canvas.width - 10, mathCenterY + 5);
    ctx.stroke();
    
    // Y轴箭头
    ctx.beginPath();
    ctx.moveTo(mathCenterX - 5, 10);
    ctx.lineTo(mathCenterX, 0);
    ctx.lineTo(mathCenterX + 5, 10);
    ctx.stroke();
    
    // 标注
    ctx.fillStyle = color || '#666';
    ctx.font = '12px sans-serif';
    ctx.fillText('X', canvas.width - 20, mathCenterY - 10);
    ctx.fillText('Y', mathCenterX + 10, 20);
    ctx.fillText('O', mathCenterX + 5, mathCenterY + 15);
    
    // 刻度
    ctx.lineWidth = 1;
    for (let i = -10; i <= 10; i++) {
        if (i === 0) continue;
        const pos = mathToCanvas(i, 0);
        
        // X轴刻度
        ctx.beginPath();
        ctx.moveTo(pos.x, mathCenterY - 5);
        ctx.lineTo(pos.x, mathCenterY + 5);
        ctx.stroke();
        ctx.fillText(i.toString(), pos.x - 5, mathCenterY + 20);
        
        // Y轴刻度
        const posY = mathToCanvas(0, i);
        ctx.beginPath();
        ctx.moveTo(mathCenterX - 5, posY.y);
        ctx.lineTo(mathCenterX + 5, posY.y);
        ctx.stroke();
        ctx.fillText(i.toString(), mathCenterX + 10, posY.y + 4);
    }
    
    ctx.restore();
}

/**
 * 自动生成矩形的四个点（居中，占1/4大小）
 * @param {Array} pointNames - 点名称数组
 * @returns {Array} 点对象数组
 */
function autoRectangle(pointNames) {
    const halfWidth = autoSize;
    const halfHeight = autoSize * 0.75;
    const positions = [
        { x: centerX - halfWidth, y: centerY - halfHeight },
        { x: centerX + halfWidth, y: centerY - halfHeight },
        { x: centerX + halfWidth, y: centerY + halfHeight },
        { x: centerX - halfWidth, y: centerY + halfHeight }
    ];
    const result = [];
    pointNames.forEach((name, i) => {
        const pos = positions[i % positions.length];
        const point = { name: name, x: pos.x, y: pos.y };
        points[name] = point;
        result.push(point);
    });
    return result;
}

/**
 * 自动生成直线的两个点（居中，占1/4大小）
 * @param {Array} pointNames - 点名称数组
 * @returns {Array} 点对象数组
 */
function autoLine(pointNames) {
    if (pointNames.length >= 2) {
        const p1 = { name: pointNames[0], x: centerX - autoSize, y: centerY };
        const p2 = { name: pointNames[1], x: centerX + autoSize, y: centerY };
        points[pointNames[0]] = p1;
        points[pointNames[1]] = p2;
        const result = [p1, p2];
        for (let i = 2; i < pointNames.length; i++) {
            const angle = (i - 1) * Math.PI / 4;
            const p = { 
                name: pointNames[i], 
                x: centerX + Math.cos(angle) * autoSize, 
                y: centerY + Math.sin(angle) * autoSize 
            };
            points[pointNames[i]] = p;
            result.push(p);
        }
        return result;
    }
    return [];
}

/**
 * 自动生成圆（居中，占1/4大小）
 * @param {string} centerName - 圆心名称
 * @returns {Object} {center, radius}
 */
function autoCircle(centerName) {
    const center = { name: centerName || 'O', x: centerX, y: centerY };
    points[center.name] = center;
    return { center: center, radius: autoSize };
}

/**
 * 自动生成单个点（居中或环绕排列）
 * @param {string} pointName - 点名称
 * @param {number} index - 点索引
 * @returns {Object} 点对象
 */
function autoPoint(pointName, index = 0) {
    if (index === 0) {
        const point = { name: pointName, x: centerX, y: centerY };
        points[pointName] = point;
        return point;
    } else {
        const angle = (index - 1) * Math.PI / 4;
        const point = { 
            name: pointName, 
            x: centerX + Math.cos(angle) * autoSize, 
            y: centerY + Math.sin(angle) * autoSize 
        };
        points[pointName] = point;
        return point;
    }
}

/**
 * 自动生成三角形的三个点
 * @param {Array} pointNames - 点名称数组
 * @returns {Array} 点对象数组
 */
function autoTriangle(pointNames) {
    const size = autoSize;
    const positions = [
        { x: centerX, y: centerY - size },
        { x: centerX - size, y: centerY + size * 0.7 },
        { x: centerX + size, y: centerY + size * 0.7 }
    ];
    const result = [];
    pointNames.forEach((name, i) => {
        const pos = positions[i % positions.length];
        const point = { name: name, x: pos.x, y: pos.y };
        points[name] = point;
        result.push(point);
    });
    return result;
}

/**
 * 自动生成角的三个点
 * @param {Array} pointNames - 点名称数组
 * @returns {Array} 点对象数组
 */
function autoAngle(pointNames) {
    const size = autoSize;
    const positions = [
        { x: centerX - size, y: centerY },
        { x: centerX, y: centerY - size * 0.5 },
        { x: centerX + size, y: centerY }
    ];
    const result = [];
    pointNames.forEach((name, i) => {
        const pos = positions[i % positions.length];
        const point = { name: name, x: pos.x, y: pos.y };
        points[name] = point;
        result.push(point);
    });
    return result;
}

/**
 * 标注单个点（只标注一次）
 * @param {Object} point - 点对象
 */
function labelPoint(point) {
    if (!point || !point.name || labeledPoints.has(point.name)) return;
    
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#333';
    ctx.font = '14px sans-serif';
    ctx.fillText(point.name, point.x + 5, point.y - 5);
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    labeledPoints.add(point.name);
}

/**
 * 应用缩放（使用CSS transform，图形不会丢失）
 */
function applyZoom() {
    canvas.style.transform = `scale(${currentZoom})`;
    document.getElementById('zoomLevel').textContent = Math.round(currentZoom * 100) + '%';
}

/**
 * 清空画布
 * @param {boolean} clearPointsFlag - 是否清空点（默认为true）
 */
function clearCanvas(clearPointsFlag = true) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (clearPointsFlag) {
        clearPoints();
    }
    // 重新画网格
    drawGrid();
}