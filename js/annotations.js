/**
 * 标注模块
 * 负责几何标注的存储、绘制和管理
 * 标注类型：等长、角度、垂直、平行、长度、全等
 * 
 * 标注数据格式（由commands.js写入）：
 *   等长: { type: '等长', segments: [{p1, p2, name}], tickCount }
 *   角度: { type: '角度', vertex: {name,x,y}, arm1: {name,x,y}, arm2: {name,x,y} }
 *   垂直: { type: '垂直', seg1: {p1:{x,y}, p2:{x,y}, name}, seg2: {p1:{x,y}, p2:{x,y}, name} }
 *   平行: { type: '平行', seg1: ..., seg2: ... }
 *   长度: { type: '长度', seg: {p1:{x,y}, p2:{x,y}, name} }
 *   全等: { type: '全等', shapeType, group1: [{name,x,y}], group2: [{name,x,y}], color }
 */

// 所有标注数据
const annotations = [];
window.annotations = annotations;

// 全等标注的颜色循环
const congruentColors = ['#ff4444', '#4444ff', '#44aa44', '#ffaa00', '#aa44aa', '#ff8800'];
window.congruentColors = congruentColors;

// ====== 标注绘制函数 ======

/**
 * 绘制所有标注（供redraw时调用）
 */
function drawAnnotations() {
    const canvasCtx = window.ctx;
    if (!canvasCtx) return;
    
    // 先绘制全等填充（最底层），再绘制其他标注
    annotations.forEach(ann => {
        if (ann.type === '全等') drawCongruentMark(canvasCtx, ann);
    });
    annotations.forEach(ann => {
        switch (ann.type) {
            case '等长': drawEqualMark(canvasCtx, ann); break;
            case '角度': drawAngleMark(canvasCtx, ann); break;
            case '垂直': drawPerpendicularMark(canvasCtx, ann); break;
            case '平行': drawParallelMark(canvasCtx, ann); break;
            case '长度': drawLengthMark(canvasCtx, ann); break;
        }
    });
}
window.drawAnnotations = drawAnnotations;

// ====== 等长标记 ======

function drawEqualMark(canvasCtx, ann) {
    const tickCount = ann.tickCount || 1;
    
    canvasCtx.save();
    canvasCtx.strokeStyle = '#333';
    canvasCtx.lineWidth = 1.5;

    ann.segments.forEach(seg => {
        const p1 = seg.p1;
        const p2 = seg.p2;
        if (!p1 || !p2) return;

        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1) return;

        // 垂直方向单位向量
        const nx = -dy / len;
        const ny = dx / len;

        const tickLen = 6;
        const tickGap = 4;

        for (let t = 0; t < tickCount; t++) {
            // 从中心向两侧排列
            const offset = (t - (tickCount - 1) / 2) * tickGap;
            const cx = mx + dx / len * offset;
            const cy = my + dy / len * offset;

            canvasCtx.beginPath();
            canvasCtx.moveTo(cx + nx * tickLen, cy + ny * tickLen);
            canvasCtx.lineTo(cx - nx * tickLen, cy - ny * tickLen);
            canvasCtx.stroke();
        }
    });

    canvasCtx.restore();
}

// ====== 角度标注 ======

function drawAngleMark(canvasCtx, ann) {
    const vertex = ann.vertex;
    const arm1 = ann.arm1;
    const arm2 = ann.arm2;
    if (!vertex || !arm1 || !arm2) return;

    const angle1 = Math.atan2(arm1.y - vertex.y, arm1.x - vertex.x);
    const angle2 = Math.atan2(arm2.y - vertex.y, arm2.x - vertex.x);

    // 计算角度值
    let angleDiff = angle2 - angle1;
    while (angleDiff < 0) angleDiff += 2 * Math.PI;
    while (angleDiff >= 2 * Math.PI) angleDiff -= 2 * Math.PI;

    const angleDeg = Math.round(angleDiff * 180 / Math.PI);
    const displayDeg = angleDeg > 180 ? 360 - angleDeg : angleDeg;

    canvasCtx.save();
    canvasCtx.strokeStyle = '#333';
    canvasCtx.lineWidth = 1;

    const radius = 20;

    if (displayDeg === 90) {
        // 直角符号
        const size = 10;
        const dx1 = Math.cos(angle1), dy1 = Math.sin(angle1);
        const dx2 = Math.cos(angle2), dy2 = Math.sin(angle2);

        canvasCtx.beginPath();
        canvasCtx.moveTo(vertex.x + dx1 * size, vertex.y + dy1 * size);
        canvasCtx.lineTo(vertex.x + dx1 * size + dx2 * size, vertex.y + dy1 * size + dy2 * size);
        canvasCtx.lineTo(vertex.x + dx2 * size, vertex.y + dy2 * size);
        canvasCtx.stroke();
    } else {
        // 弧线
        let startAngle = angle1;
        let endAngle = angle2;
        if (angleDiff > Math.PI) {
            startAngle = angle2;
            endAngle = angle1 + 2 * Math.PI;
        }

        canvasCtx.beginPath();
        canvasCtx.arc(vertex.x, vertex.y, radius, startAngle, endAngle);
        canvasCtx.stroke();

        // 角度数字
        const midAngle = (startAngle + endAngle) / 2;
        const textR = radius + 14;
        const tx = vertex.x + Math.cos(midAngle) * textR;
        const ty = vertex.y + Math.sin(midAngle) * textR;

        canvasCtx.fillStyle = '#333';
        canvasCtx.font = '12px sans-serif';
        canvasCtx.textAlign = 'center';
        canvasCtx.textBaseline = 'middle';
        canvasCtx.fillText(displayDeg + '°', tx, ty);
    }

    canvasCtx.restore();
}

// ====== 垂直标记 ======

function drawPerpendicularMark(canvasCtx, ann) {
    const a1 = ann.seg1.p1, a2 = ann.seg1.p2;
    const b1 = ann.seg2.p1, b2 = ann.seg2.p2;
    if (!a1 || !a2 || !b1 || !b2) return;

    // 计算交点
    const intersection = lineIntersection(a1, a2, b1, b2);
    if (!intersection) return;

    // 两条线段在交点处的方向
    const dir1 = normalizeVec(a2.x - a1.x, a2.y - a1.y);
    const dir2 = normalizeVec(b2.x - b1.x, b2.y - b1.y);

    canvasCtx.save();
    canvasCtx.strokeStyle = '#333';
    canvasCtx.lineWidth = 1;

    const size = 10;
    canvasCtx.beginPath();
    canvasCtx.moveTo(intersection.x + dir1.x * size, intersection.y + dir1.y * size);
    canvasCtx.lineTo(intersection.x + dir1.x * size + dir2.x * size, intersection.y + dir1.y * size + dir2.y * size);
    canvasCtx.lineTo(intersection.x + dir2.x * size, intersection.y + dir2.y * size);
    canvasCtx.stroke();

    canvasCtx.restore();
}

// ====== 平行标记 ======

function drawParallelMark(canvasCtx, ann) {
    drawArrowOnSeg(canvasCtx, ann.seg1.p1, ann.seg1.p2);
    drawArrowOnSeg(canvasCtx, ann.seg2.p1, ann.seg2.p2);
}

function drawArrowOnSeg(canvasCtx, p1, p2) {
    if (!p1 || !p2) return;
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const ux = dx / len;
    const uy = dy / len;
    const arrowSize = 6;

    canvasCtx.save();
    canvasCtx.strokeStyle = '#333';
    canvasCtx.lineWidth = 1.5;

    // 画两个 > 形箭头
    for (let side = -1; side <= 1; side += 2) {
        const ox = mx + ux * side * 3;
        const oy = my + uy * side * 3;

        canvasCtx.beginPath();
        canvasCtx.moveTo(ox - ux * arrowSize - uy * arrowSize * 0.5, oy - uy * arrowSize + ux * arrowSize * 0.5);
        canvasCtx.lineTo(ox, oy);
        canvasCtx.lineTo(ox - ux * arrowSize + uy * arrowSize * 0.5, oy - uy * arrowSize - ux * arrowSize * 0.5);
        canvasCtx.stroke();
    }

    canvasCtx.restore();
}

// ====== 长度标注 ======

function drawLengthMark(canvasCtx, ann) {
    const p1 = ann.seg.p1;
    const p2 = ann.seg.p2;
    if (!p1 || !p2) return;

    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const nx = -dy / len;
    const ny = dx / len;

    canvasCtx.save();
    canvasCtx.fillStyle = '#666';
    canvasCtx.font = '12px sans-serif';
    canvasCtx.textAlign = 'center';
    canvasCtx.textBaseline = 'middle';
    canvasCtx.fillText(len.toFixed(1), mx + nx * 14, my + ny * 14);
    canvasCtx.restore();
}

// ====== 全等标注（透明填充） ======

function drawCongruentMark(canvasCtx, ann) {
    const color = ann.color || congruentColors[0];

    canvasCtx.save();
    canvasCtx.globalAlpha = 0.2;
    canvasCtx.fillStyle = color;

    [ann.group1, ann.group2].forEach(group => {
        if (!group || group.length < 3) return;

        canvasCtx.beginPath();
        canvasCtx.moveTo(group[0].x, group[0].y);
        for (let i = 1; i < group.length; i++) {
            canvasCtx.lineTo(group[i].x, group[i].y);
        }
        canvasCtx.closePath();
        canvasCtx.fill();
    });

    canvasCtx.restore();
}

// ====== 工具函数 ======

function normalizeVec(x, y) {
    const len = Math.sqrt(x * x + y * y);
    if (len < 0.001) return { x: 0, y: 0 };
    return { x: x / len, y: y / len };
}

function lineIntersection(a1, a2, b1, b2) {
    const d1x = a2.x - a1.x, d1y = a2.y - a1.y;
    const d2x = b2.x - b1.x, d2y = b2.y - b1.y;
    const cross = d1x * d2y - d1y * d2x;
    if (Math.abs(cross) < 0.001) return null;
    const t = ((b1.x - a1.x) * d2y - (b1.y - a1.y) * d2x) / cross;
    return { x: a1.x + t * d1x, y: a1.y + t * d1y };
}
