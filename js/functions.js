/**
 * 函数绘制模块
 * 负责绘制数学函数：正比例、反比例、二次函数
 */

/**
 * 绘制正比例函数 y = kx
 * @param {number} k - 斜率
 * @param {string} color - 颜色
 */
function drawLinear(k, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    let started = false;
    for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
        const mathX = (canvasX - mathCenterX) / mathScale;
        const mathY = k * mathX;
        const canvasY = mathCenterY - mathY * mathScale;
        
        if (canvasY >= 0 && canvasY <= canvas.height) {
            if (!started) {
                ctx.moveTo(canvasX, canvasY);
                started = true;
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        }
    }
    ctx.stroke();
    ctx.restore();
    
    // 标注函数式
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '14px sans-serif';
    const labelPos = mathToCanvas(5, k * 5 + 1);
    ctx.fillText(`y = ${k}x`, labelPos.x, labelPos.y);
    ctx.restore();
}

/**
 * 绘制反比例函数 y = k/x
 * @param {number} k - 比例系数
 * @param {string} color - 颜色
 */
function drawInverse(k, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    // 右支 (x > 0)
    ctx.beginPath();
    let started = false;
    for (let canvasX = mathCenterX + 5; canvasX <= canvas.width; canvasX += 2) {
        const mathX = (canvasX - mathCenterX) / mathScale;
        if (Math.abs(mathX) < 0.1) continue;
        const mathY = k / mathX;
        const canvasY = mathCenterY - mathY * mathScale;
        
        if (canvasY >= 0 && canvasY <= canvas.height) {
            if (!started) {
                ctx.moveTo(canvasX, canvasY);
                started = true;
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        }
    }
    ctx.stroke();
    
    // 左支 (x < 0)
    ctx.beginPath();
    started = false;
    for (let canvasX = mathCenterX - 5; canvasX >= 0; canvasX -= 2) {
        const mathX = (canvasX - mathCenterX) / mathScale;
        if (Math.abs(mathX) < 0.1) continue;
        const mathY = k / mathX;
        const canvasY = mathCenterY - mathY * mathScale;
        
        if (canvasY >= 0 && canvasY <= canvas.height) {
            if (!started) {
                ctx.moveTo(canvasX, canvasY);
                started = true;
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        }
    }
    ctx.stroke();
    ctx.restore();
    
    // 标注函数式
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '14px sans-serif';
    const labelPos = mathToCanvas(5, k / 5 + 1);
    ctx.fillText(`y = ${k}/x`, labelPos.x, labelPos.y);
    ctx.restore();
}

/**
 * 绘制一元二次函数 y = ax² + bx + c
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
    let started = false;
    for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
        const mathX = (canvasX - mathCenterX) / mathScale;
        const mathY = a * mathX * mathX + b * mathX + c;
        const canvasY = mathCenterY - mathY * mathScale;
        
        if (canvasY >= 0 && canvasY <= canvas.height) {
            if (!started) {
                ctx.moveTo(canvasX, canvasY);
                started = true;
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        }
    }
    ctx.stroke();
    ctx.restore();
    
    // 标注函数式
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '14px sans-serif';
    const vertexX = -b / (2 * a);
    const vertexY = a * vertexX * vertexX + b * vertexX + c;
    const labelPos = mathToCanvas(vertexX + 3, vertexY + 2);
    let formula = 'y = ';
    if (a !== 0) {
        if (a === 1) formula += 'x²';
        else if (a === -1) formula += '-x²';
        else formula += `${a}x²`;
    }
    if (b > 0) formula += ` + ${b}x`;
    else if (b < 0) formula += ` - ${Math.abs(b)}x`;
    if (c > 0) formula += ` + ${c}`;
    else if (c < 0) formula += ` - ${Math.abs(c)}`;
    ctx.fillText(formula, labelPos.x, labelPos.y);
    ctx.restore();
}