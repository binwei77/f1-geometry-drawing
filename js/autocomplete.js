/**
 * 命令自动补全模块 - 代码编辑器风格
 * 输入命令时自动弹出上下文相关的补全建议，点击后追加到输入框
 */

// 命令列表数据
const commandsList = [
    {
        category: '基础图形',
        commands: [
            { name: '矩形', example: '矩形abcd', hint: '点名称（如abcd）' },
            { name: '长方形', example: '长方形abcd', hint: '点名称（如abcd）' },
            { name: '直线', example: '直线ab', hint: '起点和终点名称（如ab）' },
            { name: '线段', example: '线段ab', hint: '起点和终点名称（如ab）' },
            { name: '角', example: '角abc', hint: '三个点名称（如abc）' },
            { name: '圆', example: '圆O 100', hint: '圆心名称 半径（需空格）' },
            { name: '点', example: '点 A', hint: '点名称' },
            { name: '三角形', example: '三角形abc', hint: '三个点名称（如abc）' }
        ]
    },
    {
        category: '相对位置',
        commands: [
            { name: '中点', example: '中点ab c', hint: '起点终点 新点名称（c前需空格）' },
            { name: '分点', example: '分点ab f 1/3', hint: '起点终点 新点名称 分数' }
        ]
    },
    {
        category: '变换功能',
        commands: [
            { name: '旋转', example: '旋转矩形abcd 绕a 90', hint: '图形名 绕点 角度' },
            { name: '对称', example: '对称矩形abcd 关于直线ac', hint: '图形名 关于线段' },
            { name: '对折', example: '对折三角形abc 关于直线ab', hint: '图形名 关于线段' },
            { name: '平移', example: '平移三角形abc 使a到m', hint: '图形名 使起点到终点' }
        ]
    },
    {
        category: '标注功能',
        commands: [
            { name: '标注', example: '标注 等长 ab cd', hint: '类型 参数...' }
        ]
    },
    {
        category: '函数曲线',
        commands: [
            { name: '坐标系', example: '坐标系', hint: '无参数' },
            { name: '一次函数', example: '一次函数', hint: '斜率k 截距b（y=kx+b）' },
            { name: '反比例', example: '反比例', hint: '系数k 常数b（y=k/x+b）' },
            { name: '二次函数', example: '二次函数', hint: '系数a b c（y=ax²+bx+c）' }
        ]
    },
    {
        category: '样式控制',
        commands: [
            { name: '颜色', example: '颜色为红', hint: '为 颜色名（红/蓝/绿/黄/黑/白等）' }
        ]
    },
    {
        category: '操作管理',
        commands: [
            { name: '撤销', example: '撤销', hint: '无参数' },
            { name: '重做', example: '重做', hint: '无参数' },
            { name: '清空', example: '清空', hint: '无参数' },
            { name: '清除', example: '清除', hint: '无参数' },
            { name: '删除', example: '删除 ab', hint: '点/线段/图形名称' }
        ]
    }
];

// 所有命令名（用于匹配）
const allCommandNames = [];
commandsList.forEach(cat => cat.commands.forEach(cmd => {
    allCommandNames.push(cmd.name);
}));

// 标注类型的子步骤定义（动态，根据选择的类型决定后续步骤）
const annotationSubSteps = {
    '等长': [
        { key: 'seg1', label: '第1条线段', getSuggestions: () => getAvailableSegments(), suffix: ' ' },
        { key: 'seg2', label: '第2条线段', getSuggestions: () => getAvailableSegments() }
    ],
    '角度': [
        { key: 'vertex', label: '角顶点', getSuggestions: () => getAvailablePoints(false), suffix: ' ' },
        { key: 'arm1', label: '第一条边上的点', getSuggestions: () => getAvailablePoints(false), suffix: ' ' },
        { key: 'arm2', label: '第二条边上的点', getSuggestions: () => getAvailablePoints(false) }
    ],
    '垂直': [
        { key: 'seg1', label: '第1条线段', getSuggestions: () => getAvailableSegments(), suffix: ' ' },
        { key: 'seg2', label: '第2条线段', getSuggestions: () => getAvailableSegments() }
    ],
    '平行': [
        { key: 'seg1', label: '第1条线段', getSuggestions: () => getAvailableSegments(), suffix: ' ' },
        { key: 'seg2', label: '第2条线段', getSuggestions: () => getAvailableSegments() }
    ],
    '长度': [
        { key: 'seg1', label: '线段', getSuggestions: () => getAvailableSegments() }
    ],
    '全等': [
        { key: 'shapeType', label: '图形类型', getSuggestions: () => [
            { name: '三角形', displayName: '三角形 △', insertText: '三角形' },
            { name: '矩形', displayName: '矩形 □', insertText: '矩形' }
        ], suffix: ' ' },
        { key: 'group1', label: '图形1-点名称', type: 'input', suffix: ' ' },
        { key: 'group2', label: '图形2-点名称', type: 'input' }
    ]
};

// 需要引导补全的命令定义
const guidedCommands = {
    '平移': [
        { key: 'shape', label: '图形', getSuggestions: () => getAvailableShapes(), suffix: ' 使' },
        { key: 'fromPoint', label: '起点', getSuggestions: (ctx) => getShapePointsList(ctx.shape), prefix: '', suffix: '到' },
        { key: 'toPoint', label: '终点', getSuggestions: () => getAvailablePoints(false), prefix: '' }
    ],
    '旋转': [
        { key: 'shape', label: '图形', getSuggestions: () => getAvailableShapes(), suffix: ' 绕' },
        { key: 'center', label: '旋转中心', getSuggestions: () => getAvailablePoints(false), prefix: '', suffix: ' ' },
        { key: 'angle', label: '角度', type: 'input', prefix: '', suffix: '', placeholder: '如90或-45' }
    ],
    '对称': [
        { key: 'shape', label: '图形', getSuggestions: () => getAvailableShapes(), suffix: ' 关于直线' },
        { key: 'axis', label: '对称轴', getSuggestions: () => getAvailableSegments(), prefix: '' }
    ],
    '对折': [
        { key: 'shape', label: '图形', getSuggestions: () => getAvailableShapes(), suffix: ' 关于直线' },
        { key: 'axis', label: '对折线', getSuggestions: () => getAvailableSegments(), prefix: '' }
    ],
    '标注': [
        { key: 'type', label: '标注类型', getSuggestions: () => [
            { name: '等长', displayName: '等长 ═', insertText: '等长' },
            { name: '角度', displayName: '角度 ∠', insertText: '角度' },
            { name: '垂直', displayName: '垂直 ⊥', insertText: '垂直' },
            { name: '平行', displayName: '平行 ∥', insertText: '平行' },
            { name: '长度', displayName: '长度', insertText: '长度' },
            { name: '全等', displayName: '全等 ≅', insertText: '全等' }
        ], suffix: ' ' }
    ],
    '一次函数': [
        { key: 'k', label: '斜率k', type: 'input', prefix: '', suffix: ' ', placeholder: '如1或-2' },
        { key: 'b', label: '截距b', type: 'input', prefix: '', suffix: '', placeholder: '如0或3' }
    ],
    '反比例': [
        { key: 'k', label: '系数k', type: 'input', prefix: '', suffix: ' ', placeholder: '如1或-2' },
        { key: 'b', label: '常数b', type: 'input', prefix: '', suffix: '', placeholder: '如0或3' }
    ],
    '二次函数': [
        { key: 'a', label: '二次项系数a', type: 'input', prefix: '', suffix: ' ', placeholder: '如1或-1' },
        { key: 'b', label: '一次项系数b', type: 'input', prefix: '', suffix: ' ', placeholder: '如0或2' },
        { key: 'c', label: '常数项c', type: 'input', prefix: '', suffix: '', placeholder: '如0或3' }
    ]
};

// 状态
let autocompletePopup = null;
let inputElement = null;
let popupClickActive = false; // 防止弹窗内部点击后冒泡导致误关闭
let isComposing = false; // IME输入法组合状态（中文输入法等）

// ====== 数据获取 ======

function getAvailableShapes() {
    const sList = window.shapeList || [];
    const typeMap = { 'rectangle': '矩形', 'triangle': '三角形' };
    
    return sList.filter(entry => {
        const shape = entry.data && entry.data.shape;
        if (!shape) return false;
        return shape.type === 'triangle' || shape.type === 'rectangle';
    }).map(entry => {
        const shape = entry.data.shape;
        const displayType = typeMap[shape.type] || shape.type;
        return {
            name: shape.name,
            displayName: displayType + ' ' + shape.name,
            insertText: displayType + shape.name,
            pointNames: shape.pointNames || []
        };
    });
}

function getAvailablePoints(excludePrimed) {
    const pts = window.points || {};
    return Object.keys(pts)
        .filter(name => excludePrimed ? !name.includes("'") : true)
        .sort()
        .map(name => ({
            name: name,
            displayName: '点 ' + name.toUpperCase(),
            insertText: name
        }));
}

function getShapePointsList(shapeName) {
    const pts = window.points || {};
    const result = [];
    for (let i = 0; i < shapeName.length; i++) {
        const pName = shapeName[i];
        if (pts[pName]) {
            result.push({
                name: pName,
                displayName: '点 ' + pName.toUpperCase(),
                insertText: pName
            });
        }
    }
    return result;
}

function getAvailableSegments() {
    const sList = window.shapeList || [];
    const segments = new Set();
    
    sList.forEach(entry => {
        const shape = entry.data && entry.data.shape;
        if (!shape || !shape.pointNames) return;
        const pns = shape.pointNames;
        
        if (shape.type === 'triangle') {
            segments.add(pns[0] + pns[1]);
            segments.add(pns[1] + pns[2]);
            segments.add(pns[2] + pns[0]);
        } else if (shape.type === 'rectangle') {
            segments.add(pns[0] + pns[1]);
            segments.add(pns[1] + pns[2]);
            segments.add(pns[2] + pns[3]);
            segments.add(pns[3] + pns[0]);
        } else if (shape.type === 'segment' || shape.type === 'line') {
            segments.add(shape.name);
        }
    });
    
    return Array.from(segments).sort().map(seg => ({
        name: seg,
        displayName: '线段 ' + seg.toUpperCase(),
        insertText: seg
    }));
}

function getDeletableObjects() {
    const objects = [];
    const pts = window.points || {};
    const sList = window.shapeList || [];
    const usedPoints = new Set();
    
    const typeMap = {
        'rectangle': '矩形', 'triangle': '三角形', 'segment': '线段',
        'circle': '圆', 'angle': '角', 'line': '直线', 'point': '点', 'function': '函数'
    };
    
    sList.forEach(entry => {
        const shape = entry.data && entry.data.shape;
        if (!shape) return;
        const displayType = typeMap[shape.type] || shape.type;
        objects.push({ type: displayType, name: shape.name, displayName: shape.name, insertText: shape.name });
        if (shape.pointNames) shape.pointNames.forEach(p => usedPoints.add(p));
    });
    
    Object.keys(pts).filter(name => !name.includes("'")).sort().forEach(pointName => {
        if (!usedPoints.has(pointName)) {
            objects.push({ type: '点', name: pointName, displayName: pointName, insertText: pointName });
        }
    });
    
    return objects;
}

// ====== 命令解析 - 判断当前输入处于引导补全的哪个阶段 ======

/**
 * 解析输入框内容，返回当前补全上下文
 * 返回: { command, stepIndex, context, suffix, partialInput }
 *   command: 当前命令名 (如 '平移')
 *   stepIndex: 当前步骤索引 (0-based)
 *   context: 已收集的参数 { shape: '...', fromPoint: '...' }
 *   suffix: 当前步骤前缀之后的固定后缀 (如 '使', '绕', '到')
 *   partialInput: 用户当前正在输入的部分文字 (用于过滤)
 */
function parseInputContext(value) {
    if (!value) return null;
    
    // 尝试匹配每个引导命令
    for (const [cmdName, steps] of Object.entries(guidedCommands)) {
        // 检查输入是否以该命令名开头
        if (!value.startsWith(cmdName)) continue;
        
        const afterCmd = value.substring(cmdName.length);
        let remaining = afterCmd;
        const context = {};
        
        // 对于标注命令，需要动态拼接子步骤
        let effectiveSteps = steps;
        let isAnnotation = (cmdName === '标注');
        let annoType = null;
        
        for (let i = 0; i < effectiveSteps.length; i++) {
            const step = effectiveSteps[i];
            
            // 去掉前缀
            if (step.prefix && remaining.startsWith(step.prefix)) {
                remaining = remaining.substring(step.prefix.length);
            }
            
            // 去掉前导空白（对于input步骤特别重要，因为值之间用空格分隔）
            remaining = remaining.replace(/^\s+/, '');
            
            // 检查是否有后缀（说明这个步骤已完成）
            if (step.suffix && remaining.includes(step.suffix)) {
                const idx = remaining.indexOf(step.suffix);
                const paramValue = remaining.substring(0, idx).trim();
                context[step.key] = paramValue;
                remaining = remaining.substring(idx + step.suffix.length);
                
                // 标注命令：type步骤完成后，展开子步骤
                if (isAnnotation && step.key === 'type' && annotationSubSteps[paramValue]) {
                    annoType = paramValue;
                    effectiveSteps = [...steps, ...annotationSubSteps[paramValue]];
                }
                continue;
            }
            
            // 没有找到后缀，说明当前就在这个步骤
            // 如果是最后一个步骤（无后缀），且remaining不为空
            if (i === effectiveSteps.length - 1 && !step.suffix) {
                return {
                    command: cmdName,
                    stepIndex: i,
                    context: context,
                    partialInput: remaining.trim(),
                    stepDef: step,
                    annoType: annoType
                };
            }
            
            // 检查当前remaining是否可能是步骤值的一部分
            // 如果remaining有内容但没找到后缀，说明正在输入
            const trimmedRemaining = remaining.trim();
            if (trimmedRemaining === '' || !step.suffix) {
                // 刚到这一步，或者没有后缀的最后一步
                return {
                    command: cmdName,
                    stepIndex: i,
                    context: context,
                    partialInput: trimmedRemaining,
                    stepDef: step,
                    annoType: annoType
                };
            }
            
            // remaining有内容但没有找到后缀 - 正在输入这一步
            return {
                command: cmdName,
                stepIndex: i,
                context: context,
                partialInput: trimmedRemaining,
                stepDef: step,
                annoType: annoType
            };
        }
        
        // 所有步骤都完成了
        return { command: cmdName, stepIndex: effectiveSteps.length, context: context, partialInput: '', annoType: annoType };
    }
    
    return null;
}

// ====== 初始化 ======

function initAutocomplete() {
    inputElement = document.getElementById('commandInput');
    if (!inputElement) return;
    
    createAutocompletePopup();
    
    inputElement.addEventListener('input', handleInput);
    
    // IME输入法组合事件处理（中文输入法在手机上必须）
    inputElement.addEventListener('compositionstart', () => {
        isComposing = true;
    });
    inputElement.addEventListener('compositionend', (e) => {
        isComposing = false;
        // 输入法组合结束后，用最终值重新触发补全
        updateAutocomplete(e.target.value);
    });
    
    inputElement.addEventListener('focus', () => {
        // 输入框有内容时重新触发补全
        if (inputElement.value.trim().length > 0) {
            updateAutocomplete(inputElement.value);
        }
    });
    
    // 点击弹窗外部时关闭弹窗
    document.addEventListener('click', (e) => {
        if (popupClickActive) {
            popupClickActive = false;
            return;
        }
        if (autocompletePopup && autocompletePopup.style.display !== 'none') {
            if (!autocompletePopup.contains(e.target) && e.target !== inputElement) {
                hideAutocompletePopup();
            }
        }
    });
    

}

function createAutocompletePopup() {
    autocompletePopup = document.createElement('div');
    autocompletePopup.id = 'autocompletePopup';
    autocompletePopup.style.display = 'none';
    autocompletePopup.style.position = 'absolute';
    autocompletePopup.style.zIndex = '1000';
    autocompletePopup.style.backgroundColor = 'white';
    autocompletePopup.style.border = '1px solid #ddd';
    autocompletePopup.style.borderRadius = '8px';
    autocompletePopup.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    autocompletePopup.style.maxHeight = '300px';
    autocompletePopup.style.overflowY = 'auto';
    autocompletePopup.style.fontSize = '14px';
    autocompletePopup.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    
    document.body.appendChild(autocompletePopup);
}

// ====== 输入处理 ======

function handleInput(e) {
    // IME输入法组合期间不处理，避免中间状态导致弹窗错误关闭
    if (isComposing) return;
    const value = e.target.value;
    updateAutocomplete(value);
}

function updateAutocomplete(value) {
    if (!value || !value.trim()) {
        hideAutocompletePopup();
        if (inputElement) inputElement.placeholder = '输入命令，如：矩形abcd';
        return;
    }
    
    const trimmedValue = value.trim();
    
    // 检查是否是 / 触发命令列表
    if (trimmedValue === '/') {
        showCommandList();
        return;
    }
    
    if (trimmedValue === '/d' || trimmedValue === '/D') {
        showDeleteList();
        return;
    }
    
    // 检查是否匹配引导命令（保留末尾空格用于步骤判断）
    const ctx = parseInputContext(value);
    if (ctx) {
        // 计算有效步骤数（标注命令可能动态展开）
        let stepsArray = guidedCommands[ctx.command];
        if (ctx.command === '标注' && ctx.annoType && annotationSubSteps[ctx.annoType]) {
            stepsArray = [...stepsArray, ...annotationSubSteps[ctx.annoType]];
        }
        if (ctx.stepIndex < stepsArray.length) {
            showGuidedSuggestions(ctx);
            return;
        }
    }
    
    // 检查是否刚输入了命令名（还没空格或正在输入命令名）
    const matchingCmds = allCommandNames.filter(name => 
        name === trimmedValue || (trimmedValue.startsWith(name) && trimmedValue.length === name.length)
    );
    if (matchingCmds.length > 0) {
        // 命令名刚输完，准备输入参数
        const cmd = matchingCmds[0];
        if (guidedCommands[cmd]) {
            // 显示第一步的补全
            const steps = guidedCommands[cmd];
            if (steps[0].type !== 'input') {
                const items = steps[0].getSuggestions({});
                const filtered = items.filter(item => 
                    !ctx || ctx.partialInput === '' || 
                    item.insertText.startsWith(ctx.partialInput || '') ||
                    item.displayName.includes(ctx.partialInput || '')
                );
                showSuggestions(filtered, steps[0].label, (item) => {
                    insertSuggestion(cmd + ' ', item, steps[0].suffix || '');
                });
            } else {
                // 第一步是input类型，显示输入提示弹窗
                showInputHint(steps[0].label, steps[0].placeholder, {
                    command: cmd,
                    stepIndex: 0,
                    context: {},
                    partialInput: '',
                    stepDef: steps[0],
                    annoType: null
                });
            }
            return;
        }
    }
    
    // 普通命令 - 不显示补全
    hideAutocompletePopup();
}

// ====== 命令列表 ======

function showCommandList() {
    if (!autocompletePopup) return;
    autocompletePopup.innerHTML = '';
    
    commandsList.forEach(category => {
        // 分类标题
        const categoryTitle = document.createElement('div');
        categoryTitle.style.cssText = 'padding:8px 16px; background:#e9ecef; font-weight:bold; font-size:13px; color:#495057; position:sticky; top:0; z-index:1;';
        categoryTitle.textContent = category.category;
        autocompletePopup.appendChild(categoryTitle);
        
        category.commands.forEach(cmd => {
            const item = document.createElement('div');
            item.style.cssText = 'padding:10px 16px; cursor:pointer; border-bottom:1px solid #f0f0f0; display:flex; justify-content:space-between; align-items:center;';
            
            const leftDiv = document.createElement('div');
            leftDiv.style.cssText = 'display:flex; align-items:center; gap:8px;';
            
            const cmdText = document.createElement('span');
            cmdText.style.cssText = 'font-weight:bold; color:#333; font-size:14px;';
            cmdText.textContent = cmd.example;
            leftDiv.appendChild(cmdText);
            
            const hintText = document.createElement('span');
            hintText.style.cssText = 'font-size:11px; color:#999;';
            hintText.textContent = cmd.hint;
            leftDiv.appendChild(hintText);
            
            item.appendChild(leftDiv);
            
            // 引导命令标记
            if (guidedCommands[cmd.name]) {
                const badge = document.createElement('span');
                badge.style.cssText = 'background:#4CAF50; color:white; font-size:10px; padding:2px 8px; border-radius:10px; white-space:nowrap;';
                badge.textContent = '补全';
                item.appendChild(badge);
            }
            
            item.addEventListener('mouseenter', () => { item.style.backgroundColor = '#e8f5e9'; });
            item.addEventListener('mouseleave', () => { item.style.backgroundColor = 'white'; });
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                popupClickActive = true;
                // 将命令名放入输入框
                inputElement.value = cmd.name + ' ';
                inputElement.focus();
                // 触发补全
                updateAutocomplete(inputElement.value);
            });
            
            autocompletePopup.appendChild(item);
        });
    });
    
    positionPopup();
    autocompletePopup.style.display = 'block';
}

// ====== 删除列表 ======

function showDeleteList() {
    if (!autocompletePopup || !inputElement) return;
    autocompletePopup.innerHTML = '';
    
    const title = document.createElement('div');
    title.style.cssText = 'padding:12px 16px; background:#f44336; color:white; font-weight:bold; border-radius:8px 8px 0 0; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:1;';
    title.innerHTML = '<span>选择要删除的对象</span>';
    autocompletePopup.appendChild(title);
    
    const objects = getDeletableObjects();
    if (objects.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = 'padding:20px; text-align:center; color:#999;';
        emptyMsg.textContent = '没有可删除的对象';
        autocompletePopup.appendChild(emptyMsg);
    } else {
        objects.forEach(obj => {
            const item = document.createElement('div');
            item.style.cssText = 'padding:12px 16px; cursor:pointer; border-bottom:1px solid #f0f0f0; display:flex; align-items:center; gap:10px; font-size:14px;';
            
            const typeTag = document.createElement('span');
            typeTag.style.cssText = 'background:#e9ecef; padding:3px 8px; border-radius:3px; font-size:12px;';
            typeTag.textContent = obj.type;
            item.appendChild(typeTag);
            
            const nameSpan = document.createElement('span');
            nameSpan.style.fontWeight = 'bold';
            nameSpan.textContent = obj.displayName;
            item.appendChild(nameSpan);
            
            item.addEventListener('mouseenter', () => { item.style.backgroundColor = '#fff0f0'; });
            item.addEventListener('mouseleave', () => { item.style.backgroundColor = 'white'; });
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                popupClickActive = true;
                inputElement.value = '删除 ' + obj.insertText;
                hideAutocompletePopup();
                inputElement.focus();
            });
            
            autocompletePopup.appendChild(item);
        });
    }
    
    positionPopup();
    autocompletePopup.style.display = 'block';
}

// ====== 引导补全 ======

function showGuidedSuggestions(ctx) {
    let steps = guidedCommands[ctx.command];
    // 标注命令：动态展开子步骤
    if (ctx.command === '标注' && ctx.annoType && annotationSubSteps[ctx.annoType]) {
        steps = [...steps, ...annotationSubSteps[ctx.annoType]];
    }
    const step = steps[ctx.stepIndex];
    
    if (!step) {
        hideAutocompletePopup();
        return;
    }
    
    // 更新placeholder显示当前步骤提示
    const stepLabel = step.label || '';
    if (step.type === 'input' && step.placeholder) {
        inputElement.placeholder = ctx.command + ' ▸ ' + stepLabel + '（' + step.placeholder + '）';
    } else {
        inputElement.placeholder = ctx.command + ' ▸ ' + stepLabel;
    }
    
    // input步骤：显示输入提示弹窗（因为placeholder在输入框有值时不可见）
    if (step.type === 'input') {
        showInputHint(stepLabel, step.placeholder, ctx);
        return;
    }
    
    // 获取当前步骤的建议列表
    let items = step.getSuggestions(ctx.context);
    
    // 过滤
    if (ctx.partialInput) {
        items = items.filter(item => 
            item.insertText.toLowerCase().startsWith(ctx.partialInput.toLowerCase()) ||
            item.displayName.toLowerCase().includes(ctx.partialInput.toLowerCase())
        );
    }
    
    showSuggestions(items, step.label, (item) => {
        // 计算要替换的文本
        // 当前输入框内容 = "平移 三角形efg 使a" 
        // 需要替换最后的partialInput为item.insertText + suffix
        const currentValue = inputElement.value;
        const partial = ctx.partialInput;
        let baseValue;
        if (partial && currentValue.endsWith(partial)) {
            baseValue = currentValue.substring(0, currentValue.length - partial.length);
        } else {
            baseValue = currentValue;
        }
        
        const newText = baseValue + item.insertText + (step.suffix || '');
        inputElement.value = newText;
        inputElement.focus();
        
        // 判断是否所有步骤已完成：当前是最后一步且无suffix
        const isLastStep = ctx.stepIndex === steps.length - 1;
        if (isLastStep && !step.suffix) {
            hideAutocompletePopup();
            return;
        }
        
        // 触发下一轮补全（保留末尾空格）
        popupClickActive = true;
        updateAutocomplete(newText);
    });
}

// ====== 输入提示弹窗（用于type:'input'步骤） ======

function showInputHint(stepLabel, placeholder, ctx) {
    if (!autocompletePopup) return;
    autocompletePopup.innerHTML = '';
    
    // 进度指示：显示当前步骤和已完成的步骤
    let stepsArray = guidedCommands[ctx.command];
    if (ctx.command === '标注' && ctx.annoType && annotationSubSteps[ctx.annoType]) {
        stepsArray = [...stepsArray, ...annotationSubSteps[ctx.annoType]];
    }
    
    // 进度条
    const progressDiv = document.createElement('div');
    progressDiv.style.cssText = 'padding:6px 16px; background:#e3f2fd; font-size:11px; color:#1565c0; border-bottom:1px solid #bbdefb; display:flex; gap:4px; align-items:center; flex-wrap:wrap;';
    
    const cmdSpan = document.createElement('span');
    cmdSpan.style.cssText = 'font-weight:bold;';
    cmdSpan.textContent = ctx.command;
    progressDiv.appendChild(cmdSpan);
    
    for (let i = 0; i < stepsArray.length; i++) {
        const sep = document.createElement('span');
        sep.textContent = '›';
        sep.style.cssText = 'color:#90caf9;';
        progressDiv.appendChild(sep);
        
        const stepSpan = document.createElement('span');
        if (i < ctx.stepIndex) {
            // 已完成的步骤
            stepSpan.style.cssText = 'color:#4caf50; text-decoration:line-through;';
            const val = ctx.context[stepsArray[i].key];
            stepSpan.textContent = val || stepsArray[i].label;
        } else if (i === ctx.stepIndex) {
            // 当前步骤
            stepSpan.style.cssText = 'font-weight:bold; color:#1565c0; background:#bbdefb; padding:1px 6px; border-radius:3px;';
            stepSpan.textContent = stepsArray[i].label;
        } else {
            // 未来的步骤
            stepSpan.style.cssText = 'color:#999;';
            stepSpan.textContent = stepsArray[i].label;
        }
        progressDiv.appendChild(stepSpan);
    }
    autocompletePopup.appendChild(progressDiv);
    
    // 提示内容
    const hintDiv = document.createElement('div');
    hintDiv.style.cssText = 'padding:14px 16px; display:flex; align-items:center; gap:10px;';
    
    const iconSpan = document.createElement('span');
    iconSpan.style.cssText = 'font-size:20px;';
    iconSpan.textContent = '✏️';
    hintDiv.appendChild(iconSpan);
    
    const textDiv = document.createElement('div');
    const labelSpan = document.createElement('div');
    labelSpan.style.cssText = 'font-weight:bold; font-size:14px; color:#333; margin-bottom:2px;';
    labelSpan.textContent = stepLabel;
    textDiv.appendChild(labelSpan);
    
    if (placeholder) {
        const phSpan = document.createElement('div');
        phSpan.style.cssText = 'font-size:12px; color:#888;';
        phSpan.textContent = placeholder;
        textDiv.appendChild(phSpan);
    }
    hintDiv.appendChild(textDiv);
    autocompletePopup.appendChild(hintDiv);
    
    positionPopup();
    autocompletePopup.style.display = 'block';
}

// ====== 通用建议列表渲染 ======

function showSuggestions(items, label, onSelect) {
    if (!autocompletePopup) return;
    autocompletePopup.innerHTML = '';
    
    if (items.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = 'padding:16px; text-align:center; color:#999; font-size:13px;';
        emptyMsg.textContent = '没有可选项';
        autocompletePopup.appendChild(emptyMsg);
        positionPopup();
        autocompletePopup.style.display = 'block';
        return;
    }
    
    // 小标签
    if (label) {
        const labelDiv = document.createElement('div');
        labelDiv.style.cssText = 'padding:6px 16px; background:#e8f5e9; font-size:12px; color:#2e7d32; font-weight:bold; position:sticky; top:0; z-index:1;';
        labelDiv.textContent = label;
        autocompletePopup.appendChild(labelDiv);
    }
    
    items.forEach(item => {
        const el = document.createElement('div');
        el.style.cssText = 'padding:10px 16px; cursor:pointer; border-bottom:1px solid #f0f0f0; font-size:14px; color:#333;';
        el.textContent = item.displayName;
        
        el.addEventListener('mouseenter', () => { el.style.backgroundColor = '#e8f5e9'; });
        el.addEventListener('mouseleave', () => { el.style.backgroundColor = 'white'; });
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            popupClickActive = true;
            onSelect(item);
        });
        
        autocompletePopup.appendChild(el);
    });
    
    positionPopup();
    autocompletePopup.style.display = 'block';
}

// ====== 工具函数 ======

function insertSuggestion(prefix, item, suffix) {
    inputElement.value = prefix + item.insertText + suffix;
    inputElement.focus();
    popupClickActive = true;
    updateAutocomplete(inputElement.value);
}

function positionPopup() {
    if (!autocompletePopup || !inputElement) return;
    const rect = inputElement.getBoundingClientRect();
    const popupWidth = Math.min(400, window.innerWidth - 20);
    const left = Math.max(10, rect.left + (rect.width - popupWidth) / 2);
    autocompletePopup.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    autocompletePopup.style.left = left + 'px';
    autocompletePopup.style.width = popupWidth + 'px';
}

function hideAutocompletePopup() {
    if (autocompletePopup) {
        autocompletePopup.style.display = 'none';
    }
}

function resetInput() {
    if (!inputElement) return;
    inputElement.value = '';
    inputElement.placeholder = '输入命令，例如：矩形abcd 或 圆O';
    inputElement.readOnly = false;
}
