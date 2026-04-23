/**
 * 图形绘制模块
 * 负责绘制各种几何图形：矩形、直线、圆、三角形、点
 */

/**
 * 绘制矩形
 * @param {Array} points - 四个点的数组
 * @param {string} color - 颜色
 * @param {boolean} fill - 是否填充
 */
function drawRectangle(rectPoints, color, fill = false) {
    if (rectPoints.length < 4) return;
    
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(rectPoints[0].x, rectPoints[0].y);
    for (let i = 1; i < rectPoints.length; i++) {
        ctx.lineTo(rectPoints[i].x, rectPoints[i].y);
    }
    ctx.closePath();
    
    if (fill) {
        ctx.globalAlpha = defaultAlpha;
        ctx.fillStyle = color;
        ctx.fill();
    }
    ctx.stroke();
    ctx.restore();
    
    // 标注点
    rectPoints.forEach(p => labelPoint(p));
}

/**
 * 绘制直线
 * @param {Array} linePoints - 点数组
 * @param {string} color - 颜色
 */
function drawLine(linePoints, color) {
    if (linePoints.length < 2) return;
    
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(linePoints[0].x, linePoints[0].y);
    for (let i = 1; i < linePoints.length; i++) {
        ctx.lineTo(linePoints[i].x, linePoints[i].y);
    }
    ctx.stroke();
    ctx.restore();
    
    // 标注点
    linePoints.forEach(p => labelPoint(p));
}

/**
 * 绘制圆
 * @param {Object} center - 圆心点
 * @param {number} radius - 半径
 * @param {string} color - 颜色
 * @param {boolean} fill - 是否填充
 */
function drawCircle(center, radius, color, fill = false) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    
    if (fill) {
        ctx.globalAlpha = defaultAlpha;
        ctx.fillStyle = color;
        ctx.fill();
    }
    ctx.stroke();
    ctx.restore();
    
    // 标注圆心
    labelPoint(center);
}

/**
 * 绘制点
 * @param {Object} point - 点对象
 * @param {string} color - 颜色
 */
function drawPoint(point, color) {
    ctx.save();
    ctx.fillStyle = color;
    
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // 标注点
    labelPoint(point);
}

/**
 * 绘制三角形
 * @param {Array} triPoints - 三个点的数组
 * @param {string} color - 颜色
 * @param {boolean} fill - 是否填充
 */
function drawTriangle(triPoints, color, fill = false) {
    if (triPoints.length < 3) return;
    
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(triPoints[0].x, triPoints[0].y);
    for (let i = 1; i < triPoints.length; i++) {
        ctx.lineTo(triPoints[i].x, triPoints[i].y);
    }
    ctx.closePath();
    
    if (fill) {
        ctx.globalAlpha = defaultAlpha;
        ctx.fillStyle = color;
        ctx.fill();
    }
    ctx.stroke();
    ctx.restore();
    
    // 标注点
    triPoints.forEach(p => labelPoint(p));
}

/**
 * 绘制角
 * @param {Object} start - 起点
 * @param {Object} vertex - 顶点
 * @param {Object} end - 终点
 * @param {string} color - 颜色
 */
function drawAngle(start, vertex, end, color) {
    // 画两条边
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(vertex.x, vertex.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.restore();
    
    // 绘制角标记（圆弧）
    const radius = 30;
    const startAngle = Math.atan2(start.y - vertex.y, start.x - vertex.x);
    const endAngle = Math.atan2(end.y - vertex.y, end.x - vertex.x);
    
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(vertex.x, vertex.y, radius, startAngle, endAngle, 
            (endAngle - startAngle) > Math.PI);
    ctx.stroke();
    ctx.restore();
    
    // 标注点
    labelPoint(start);
    labelPoint(vertex);
    labelPoint(end);
}

/**
 * 旋转点
 * @param {Object} point - 原始点
 * @param {Object} center - 旋转中心
 * @param {number} angle - 旋转角度（度）
 * @returns {Object} 旋转后的点
 */
function rotatePoint(point, center, angle) {
    const radians = angle * Math.PI / 180;
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    
    return {
        x: center.x + dx * Math.cos(radians) - dy * Math.sin(radians),
        y: center.y + dx * Math.sin(radians) + dy * Math.cos(radians)
    };
}

/**
 * 点关于直线对称
 * @param {Object} point - 原始点
 * @param {Object} linePoint1 - 直线上的一点
 * @param {Object} linePoint2 - 直线上的另一点
 * @returns {Object} 对称点
 */
function reflectPoint(point, linePoint1, linePoint2) {
    // 直线的一般式：ax + by + c = 0
    const a = linePoint2.y - linePoint1.y;
    const b = linePoint1.x - linePoint2.x;
    const c = linePoint2.x * linePoint1.y - linePoint1.x * linePoint2.y;
    
    const d = a * a + b * b;
    
    return {
        x: (b * b * point.x - a * a * point.x - 2 * a * b * point.y - 2 * a * c) / d,
        y: (a * a * point.y - b * b * point.y - 2 * a * b * point.x - 2 * b * c) / d
    };
}

/**
 * 平移点
 * @param {Object} point - 原始点
 * @param {number} dx - X方向位移
 * @param {number} dy - Y方向位移
 * @returns {Object} 平移后的点
 */
function translatePoint(point, dx, dy) {
    return {
        x: point.x + dx,
        y: point.y + dy
    };
}

/**
 * 绘制一次函数 y = ax + b
 * @param {number} a - 斜率
 * @param {number} b - 截距
 * @param {string} color - 颜色
 */
function drawLinear(a, b, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // 计算画布边界
    const x1 = 0;
    const x2 = canvas.width;
    
    // y = ax + b，注意y轴方向（画布y轴向下，数学y轴向上）
    // 需要转换坐标系：mathY = canvasHeight/2 - (canvasY - canvasHeight/2)
    const centerY = canvas.height / 2;
    
    // 画布坐标转换为数学坐标
    const toMathY = (canvasY) => centerY - (canvasY - centerY);
    
    // 数学坐标转换为画布坐标
    const toCanvasY = (mathY) => centerY + (centerY - mathY);
    
    // 计算起点和终点
    const y1_math = a * x1 + b;
    const y2_math = a * x2 + b;
    
    const y1_canvas = toCanvasY(y1_math);
    const y2_canvas = toCanvasY(y2_math);
    
    ctx.moveTo(x1, y1_canvas);
    ctx.lineTo(x2, y2_canvas);
    ctx.stroke();
    ctx.restore();
    
    // 标注函数
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '14px Arial';
    const label = `y=${a}x${b >= 0 ? '+' + b : b}`;
    ctx.fillText(label, 10, 20);
    ctx.restore();
}

/**
 * 绘制二次函数 y = ax² + bx + c
 * @param {number} a - 二次项系数
 * @param {number} b - 一次项系数
 * @param {number} c - 常数项
 * @param {string} color - 颜色
 */
function drawQuadratic(a, b, c, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const centerY = canvas.height / 2;
    const toCanvasY = (mathY) => centerY + (centerY - mathY);
    
    const step = 1;  // 步长
    let first = true;
    
    for (let x = 0; x <= canvas.width; x += step) {
        const mathY = a * x * x + b * x + c;
        const canvasY = toCanvasY(mathY);
        
        if (first) {
            ctx.moveTo(x, canvasY);
            first = false;
        } else {
            ctx.lineTo(x, canvasY);
        }
    }
    
    ctx.stroke();
    ctx.restore();
    
    // 标注函数
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '14px Arial';
    const label = `y=${a}x²${b >= 0 ? '+' + b : b}x${c >= 0 ? '+' + c : c}`;
    ctx.fillText(label, 10, 40);
    ctx.restore();
}

/**
 * 计算角度（返回度数）
 * @param {Object} start - 起点
 * @param {Object} vertex - 顶点
 * @param {Object} end - 终点
 * @returns {number} 角度值（度）
 */
function calculateAngle(start, vertex, end) {
    const v1 = {
        x: start.x - vertex.x,
        y: start.y - vertex.y
    };
    const v2 = {
        x: end.x - vertex.x,
        y: end.y - vertex.y
    };
    
    // 计算点积和向量长度
    const dot = v1.x * v2.x + v1.y * v2.y;
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    // 计算余弦值
    const cosAngle = dot / (len1 * len2);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    
    return angleRad * 180 / Math.PI;
}

/**
 * 计算向量的单位向量
 * @param {Object} point1 - 起点
 * @param {Object} point2 - 终点
 * @returns {Object} 单位向量
 */
function getUnitVector(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    return {
        x: dx / length,
        y: dy / length
    };
}

/**
 * 根据角度计算新的点位置（旋转某个点使角达到指定值）
 * @param {Object} start - 角的起点
 * @param {Object} vertex - 角的顶点
 * @param {Object} end - 角的终点（需要移动的点）
 * @param {number} targetAngle - 目标角度（度）
 * @param {boolean} rotateStart - 是否旋转起点（false则旋转终点）
 * @returns {Object} 新的点的位置
 */
function calculatePointForAngle(start, vertex, end, targetAngle, rotateStart = false) {
    // 确定哪个点需要移动
    const fixPoint = rotateStart ? end : start;  // 固定点
    const movePoint = rotateStart ? start : end;  // 移动点
    
    // 获取固定点到顶点的向量（保持不变）
    const fixVector = getUnitVector(vertex, fixPoint);
    
    // 目标角度转换为弧度
    const targetRad = targetAngle * Math.PI / 180;
    
    // 计算移动点的新方向向量（绕顶点旋转）
    const dx = movePoint.x - vertex.x;
    const dy = movePoint.y - vertex.y;
    const currentRad = Math.atan2(dy, dx);
    
    // 计算固定点的角度
    const fixRad = Math.atan2(fixVector.y, fixVector.x);
    
    // 计算新的角度
    let newRad;
    if (rotateStart) {
        // 旋转起点，使向量间的角度为目标角度
        newRad = fixRad - targetRad;
    } else {
        // 旋转终点，使向量间的角度为目标角度
        newRad = fixRad + targetRad;
    }
    
    // 保持原有点到顶点的距离
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return {
        x: vertex.x + distance * Math.cos(newRad),
        y: vertex.y + distance * Math.sin(newRad)
    };
}

// 交点计数器，用于自动命名交点
let intersectionCounter = 0;

/**
 * 获取下一个交点名称
 * @returns {string} 交点名称（P1, P2, P3...）
 */
function getNextIntersectionName() {
    intersectionCounter++;
    return 'P' + intersectionCounter;
}

/**
 * 计算两条线段的交点
 * @param {Object} p1 - 线段1起点
 * @param {Object} p2 - 线段1终点
 * @param {Object} p3 - 线段2起点
 * @param {Object} p4 - 线段2终点
 * @returns {Object|null} 交点坐标（如果存在）
 */
function getLineIntersection(p1, p2, p3, p4) {
    // 直线1的方程：y = k1*x + b1
    const k1 = (p2.y - p1.y) / (p2.x - p1.x);
    const b1 = p1.y - k1 * p1.x;
    
    // 直线2的方程：y = k2*x + b2
    const k2 = (p4.y - p3.y) / (p4.x - p3.x);
    const b2 = p3.y - k2 * p3.x;
    
    // 判断是否平行
    if (Math.abs(k1 - k2) < 0.0001) {
        return null;  // 平行，无交点
    }
    
    // 计算交点
    const x = (b2 - b1) / (k1 - k2);
    const y = k1 * x + b1;
    
    // 检查交点是否在线段范围内
    const inSegment1 = (x >= Math.min(p1.x, p2.x) && x <= Math.max(p1.x, p2.x) &&
                       y >= Math.min(p1.y, p2.y) && y <= Math.max(p1.y, p2.y));
    const inSegment2 = (x >= Math.min(p3.x, p4.x) && x <= Math.max(p3.x, p4.x) &&
                       y >= Math.min(p3.y, p4.y) && y <= Math.max(p3.y, p4.y));
    
    if (inSegment1 && inSegment2) {
        return { x, y };
    }
    
    return null;
}

/**
 * 计算线段与圆的交点
 * @param {Object} p1 - 线段起点
 * @param {Object} p2 - 线段终点
 * @param {Object} center - 圆心
 * @param {number} radius - 半径
 * @returns {Array} 交点数组
 */
function getLineCircleIntersection(p1, p2, center, radius) {
    // 直线方程：Ax + By + C = 0
    const A = p2.y - p1.y;
    const B = p1.x - p2.x;
    const C = p2.x * p1.y - p1.x * p2.y;
    
    // 代入圆的方程：(x - cx)² + (y - cy)² = r²
    const a = A * A + B * B;
    const b = 2 * (A * C + B * B * center.y - B * A * center.x - B * C);
    const c = C * C + B * B * (center.x * center.x + center.y * center.y - radius * radius) - 2 * B * C * center.y;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
        return [];  // 无交点
    }
    
    const intersections = [];
    
    if (discriminant === 0) {
        // 一个交点
        const y = (-b) / (2 * a);
        const x = -(B * y + C) / A;
        
        // 检查是否在线段范围内
        if (x >= Math.min(p1.x, p2.x) && x <= Math.max(p1.x, p2.x) &&
            y >= Math.min(p1.y, p2.y) && y <= Math.max(p1.y, p2.y)) {
            intersections.push({ x, y });
        }
    } else {
        // 两个交点
        const sqrtD = Math.sqrt(discriminant);
        const y1 = (-b + sqrtD) / (2 * a);
        const y2 = (-b - sqrtD) / (2 * a);
        
        const x1 = -(B * y1 + C) / A;
        const x2 = -(B * y2 + C) / A;
        
        // 检查并添加交点
        if (x1 >= Math.min(p1.x, p2.x) && x1 <= Math.max(p1.x, p2.x) &&
            y1 >= Math.min(p1.y, p2.y) && y1 <= Math.max(p1.y, p2.y)) {
            intersections.push({ x: x1, y: y1 });
        }
        
        if (x2 >= Math.min(p1.x, p2.x) && x2 <= Math.max(p1.x, p2.x) &&
            y2 >= Math.min(p1.y, p2.y) && y2 <= Math.max(p1.y, p2.y)) {
            intersections.push({ x: x2, y: y2 });
        }
    }
    
    return intersections;
}

/**
 * 计算两个圆的交点
 * @param {Object} center1 - 圆1圆心
 * @param {number} radius1 - 圆1半径
 * @param {Object} center2 - 圆2圆心
 * @param {number} radius2 - 圆2半径
 * @returns {Array} 交点数组
 */
function getCircleCircleIntersection(center1, radius1, center2, radius2) {
    const dx = center2.x - center1.x;
    const dy = center2.y - center1.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    
    // 检查是否重合
    if (d === 0 && radius1 === radius2) {
        return [];  // 无限多交点
    }
    
    // 检查是否相离或包含
    if (d > radius1 + radius2 || d < Math.abs(radius1 - radius2)) {
        return [];  // 无交点
    }
    
    const a = (radius1 * radius1 - radius2 * radius2 + d * d) / (2 * d);
    const h = Math.sqrt(radius1 * radius1 - a * a);
    
    const x2 = center1.x + a * dx / d;
    const y2 = center1.y + a * dy / d;
    
    const intersections = [];
    
    if (h === 0) {
        // 一个交点（相切）
        intersections.push({ x: x2, y: y2 });
    } else {
        // 两个交点
        const x3_1 = x2 + h * dy / d;
        const y3_1 = y2 - h * dx / d;
        const x3_2 = x2 - h * dy / d;
        const y3_2 = y2 + h * dx / d;
        
        intersections.push({ x: x3_1, y: y3_1 });
        intersections.push({ x: x3_2, y: y3_2 });
    }
    
    return intersections;
}

/**
 * 绘制并标注交点
 * @param {Array} intersections - 交点数组
 * @param {string} desc - 交点描述
 */
function drawIntersections(intersections, desc) {
    intersections.forEach((p, i) => {
        const name = getNextIntersectionName();
        const point = { name, x: p.x, y: p.y };
        
        // 保存到点集合
        points[name] = point;
        
        // 创建交点的shape对象
        const shape = {
            type: 'point',
            name: name,
            pointNames: [name],
            color: 'red',
            fill: false
        };
        shapes.push(shape);
        // 同步到shapeList
        if (window.shapeList) {
            window.shapeList.push({
                id: Date.now() + '_pt_' + name,
                type: 'point',
                name: name,
                points: [name],
                data: { shape: shape, points: [name], type: 'point', color: 'red', fill: false },
                createdAt: Date.now()
            });
        }
        
        // 绘制点
        drawPoint(point, 'red');
        
        // 标注
        ctx.save();
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(name, p.x + 10, p.y - 10);
        ctx.restore();
        
        console.log(`交点 ${name}: (${p.x.toFixed(2)}, ${p.y.toFixed(2)}) - ${desc}`);
    });
}

/**
 * 计算一次函数与线段的交点
 * @param {number} a - 函数斜率
 * @param {number} b - 函数截距
 * @param {Object} p1 - 线段起点
 * @param {Object} p2 - 线段终点
 * @returns {Array} 交点数组
 */
function getLinearLineIntersection(a_func, b_func, p1, p2) {
    // 线段的斜率和截距
    const k_line = (p2.y - p1.y) / (p2.x - p1.x);
    const b_line = p1.y - k_line * p1.x;
    
    // 判断是否平行
    if (Math.abs(a_func - k_line) < 0.0001) {
        return [];  // 平行，无交点
    }
    
    // 计算交点的x坐标
    const x = (b_line - b_func) / (a_func - k_line);
    const y = a_func * x + b_func;
    
    // 检查交点是否在线段范围内
    if (x >= Math.min(p1.x, p2.x) && x <= Math.max(p1.x, p2.x) &&
        y >= Math.min(p1.y, p2.y) && y <= Math.max(p1.y, p2.y)) {
        return [{ x, y }];
    }
    
    return [];
}

/**
 * 计算二次函数与线段的交点
 * @param {number} a - 二次项系数
 * @param {number} b - 一次项系数
 * @param {number} c - 常数项
 * @param {Object} p1 - 线段起点
 * @param {Object} p2 - 线段终点
 * @returns {Array} 交点数组
 */
function getQuadraticLineIntersection(a_quad, b_quad, c_quad, p1, p2) {
    // 线段的斜率和截距
    const k_line = (p2.y - p1.y) / (p2.x - p1.x);
    const b_line = p1.y - k_line * p1.x;
    
    // 解方程：ax² + bx + c = kx + b_line
    // ax² + (b - k)x + (c - b_line) = 0
    const A = a_quad;
    const B = b_quad - k_line;
    const C = c_quad - b_line;
    
    const discriminant = B * B - 4 * A * C;
    
    if (discriminant < 0) {
        return [];  // 无实数解
    }
    
    const intersections = [];
    
    if (Math.abs(A) < 0.0001) {
        // 退化为一次方程
        if (Math.abs(B) > 0.0001) {
            const x = -C / B;
            const y = k_line * x + b_line;
            
            // 检查交点是否在线段范围内
            if (x >= Math.min(p1.x, p2.x) && x <= Math.max(p1.x, p2.x) &&
                y >= Math.min(p1.y, p2.y) && y <= Math.max(p1.y, p2.y)) {
                intersections.push({ x, y });
            }
        }
    } else if (discriminant === 0) {
        // 一个交点
        const x = -B / (2 * A);
        const y = a_quad * x * x + b_quad * x + c_quad;
        
        // 检查交点是否在线段范围内
        if (x >= Math.min(p1.x, p2.x) && x <= Math.max(p1.x, p2.x) &&
            y >= Math.min(p1.y, p2.y) && y <= Math.max(p1.y, p2.y)) {
            intersections.push({ x, y });
        }
    } else {
        // 两个交点
        const sqrtD = Math.sqrt(discriminant);
        const x1 = (-B + sqrtD) / (2 * A);
        const x2 = (-B - sqrtD) / (2 * A);
        
        const y1 = a_quad * x1 * x1 + b_quad * x1 + c_quad;
        const y2 = a_quad * x2 * x2 + b_quad * x2 + c_quad;
        
        // 检查并添加交点
        if (x1 >= Math.min(p1.x, p2.x) && x1 <= Math.max(p1.x, p2.x) &&
            y1 >= Math.min(p1.y, p2.y) && y1 <= Math.max(p1.y, p2.y)) {
            intersections.push({ x: x1, y: y1 });
        }
        
        if (x2 >= Math.min(p1.x, p2.x) && x2 <= Math.max(p1.x, p2.x) &&
            y2 >= Math.min(p1.y, p2.y) && y2 <= Math.max(p1.y, p2.y)) {
            intersections.push({ x: x2, y: y2 });
        }
    }
    
    return intersections;
}

/**
 * 计算一次函数与圆的交点
 * @param {number} a - 函数斜率
 * @param {number} b - 函数截距
 * @param {Object} center - 圆心
 * @param {number} radius - 半径
 * @returns {Array} 交点数组
 */
function getLinearCircleIntersection(a_func, b_func, center, radius) {
    // 将 y = ax + b 代入圆的方程
    // (x - cx)² + (ax + b - cy)² = r²
    // 展开：x² - 2cx x + cx² + a²x² + 2a(b - cy)x + (b - cy)² = r²
    // 合并：(1 + a²)x² + (-2c + 2a(b - cy))x + (c² + (b - cy)² - r²) = 0
    
    const A = 1 + a_func * a_func;
    const B = -2 * center.x + 2 * a_func * (b_func - center.y);
    const C = center.x * center.x + (b_func - center.y) * (b_func - center.y) - radius * radius;
    
    const discriminant = B * B - 4 * A * C;
    
    if (discriminant < 0) {
        return [];  // 无实数解
    }
    
    const intersections = [];
    
    if (discriminant === 0) {
        // 一个交点
        const x = -B / (2 * A);
        const y = a_func * x + b_func;
        intersections.push({ x, y });
    } else {
        // 两个交点
        const sqrtD = Math.sqrt(discriminant);
        const x1 = (-B + sqrtD) / (2 * A);
        const x2 = (-B - sqrtD) / (2 * A);
        
        const y1 = a_func * x1 + b_func;
        const y2 = a_func * x2 + b_func;
        
        intersections.push({ x: x1, y: y1 });
        intersections.push({ x: x2, y: y2 });
    }
    
    return intersections;
}

/**
 * 计算二次函数与圆的交点
 * @param {number} a - 二次项系数
 * @param {number} b - 一次项系数
 * @param {number} c - 常数项
 * @param {Object} center - 圆心
 * @param {number} radius - 半径
 * @returns {Array} 交点数组
 */
function getQuadraticCircleIntersection(a_quad, b_quad, c_quad, center, radius) {
    // 将 y = ax² + bx + c 代入圆的方程
    // (x - cx)² + (ax² + bx + c - cy)² = r²
    // 这是一个四次方程，数值求解比较复杂
    // 这里使用数值方法近似求解
    
    const intersections = [];
    
    // 在画布范围内采样
    const step = 1;
    for (let x = 0; x <= canvas.width; x += step) {
        const y = a_quad * x * x + b_quad * x + c_quad;
        
        // 计算该点到圆心的距离
        const dx = x - center.x;
        const dy = y - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果距离接近半径，认为是交点
        if (Math.abs(distance - radius) < 0.5) {
            // 检查是否已经存在相似的交点
            let isDuplicate = false;
            for (const p of intersections) {
                if (Math.abs(p.x - x) < 2 && Math.abs(p.y - y) < 2) {
                    isDuplicate = true;
                    break;
                }
            }
            
            if (!isDuplicate) {
                intersections.push({ x, y });
            }
        }
    }
    
    return intersections;
}