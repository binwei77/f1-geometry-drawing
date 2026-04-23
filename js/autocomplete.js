/**
 * 命令自动补全模块
 * 提供命令列表、参数提示和自动补全功能
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
            { name: '平移', example: '平移三角形abc 使a到m', hint: '图形名和其他' }
        ]
    },
    {
        category: '函数曲线',
        commands: [
            { name: '坐标系', example: '坐标系', hint: '无参数' },
            { name: '正比例', example: '正比例 1', hint: '系数k（如1表示y=x）' },
            { name: '反比例', example: '反比例 1', hint: '系数k（如1表示y=1/x）' },
            { name: '二次函数', example: '二次函数 1 0 0', hint: '系数a b c（y=ax²+bx+c）' },
            { name: '函数', example: '函数一次 1 0', hint: '类型 系数...' }
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

let autocompletePopup = null;
let inputElement = null;

/**
 * 初始化自动补全功能
 */
function initAutocomplete() {
    inputElement = document.getElementById('commandInput');
    if (!inputElement) return;
    
    // 创建弹窗元素
    createAutocompletePopup();
    
    // 监听输入事件
    inputElement.addEventListener('input', handleInput);
    
    // 监听焦点事件
    inputElement.addEventListener('focus', () => {
        if (inputElement.value === '/') {
            showAutocompletePopup();
        }
    });
    
    // 点击其他地方关闭弹窗
    document.addEventListener('click', (e) => {
        if (autocompletePopup && !autocompletePopup.contains(e.target) && e.target !== inputElement) {
            hideAutocompletePopup();
        }
    });
}

/**
 * 创建自动补全弹窗
 */
function createAutocompletePopup() {
    autocompletePopup = document.createElement('div');
    autocompletePopup.id = 'autocompletePopup';
    autocompletePopup.style.display = 'none';
    autocompletePopup.style.position = 'absolute';
    autocompletePopup.style.backgroundColor = 'white';
    autocompletePopup.style.border = '1px solid #ddd';
    autocompletePopup.style.borderRadius = '4px';
    autocompletePopup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    autocompletePopup.style.maxHeight = '60vh';
    autocompletePopup.style.overflowY = 'auto';
    autocompletePopup.style.zIndex = '1000';
    autocompletePopup.style.width = '100%';
    autocompletePopup.style.maxWidth = '400px';
    
    document.body.appendChild(autocompletePopup);
}

/**
 * 处理输入事件
 */
function handleInput(e) {
    const value = e.target.value.trim();
    
    if (value === '/') {
        showAutocompletePopup();
    } else if (value === '/d' || value === '/D') {
        // 快捷方式：/d 直接显示删除列表
        showDeletePopup();
    } else {
        hideAutocompletePopup();
    }
}

/**
 * 显示自动补全弹窗
内容 */
function showAutocompletePopup() {
    if (!autocompletePopup || !inputElement) return;
    
    // 清空弹窗内容
    autocompletePopup.innerHTML = '';
    
    // 添加标题
    const title = document.createElement('div');
    title.style.padding = '10px';
    title.style.backgroundColor = '#f5f5f5';
    title.style.fontWeight = 'bold';
    title.style.borderBottom = '1px solid #ddd';
    title.textContent = '选择命令';
    autocompletePopup.appendChild(title);
    
    // 按分类添加命令
    commandsList.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.style.margin = '0';
        categoryDiv.style.padding = '0';
        
        // 分类标题
        const categoryTitle = document.createElement('div');
        categoryTitle.style.padding = '8px 10px';
        categoryTitle.style.backgroundColor = '#e9ecef';
        categoryTitle.style.fontWeight = 'bold';
        categoryTitle.style.fontSize = '13px';
        categoryTitle.style.color = '#495057';
        categoryTitle.textContent = category.category;
        categoryDiv.appendChild(categoryTitle);
        
        // 命令列表
        category.commands.forEach(cmd => {
            const cmdItem = document.createElement('div');
            cmdItem.style.padding = '8px 10px';
            cmdItem.style.cursor = 'pointer';
            cmdItem.style.borderBottom = '1px solid #eee';
            
            // 命令名称和示例
            const cmdText = document.createElement('span');
            cmdText.style.fontWeight = 'bold';
            cmdText.style.color = '#333';
            cmdText.textContent = cmd.example;
            cmdItem.appendChild(cmdText);
            
            // 提示信息
            const hintText = document.createElement('span');
            hintText.style.marginLeft = '10px';
            hintText.style.fontSize = '12px';
            hintText.style.color = '#666';
            hintText.textContent = `(${cmd.hint})`;
            cmdItem.appendChild(hintText);
            
            // 悬停效果
            cmdItem.addEventListener('mouseenter', () => {
                cmdItem.style.backgroundColor = '#f8f9fa';
            });
            cmdItem.addEventListener('mouseleave', () => {
                cmdItem.style.backgroundColor = 'white';
            });
            
            // 点击事件
            cmdItem.addEventListener('click', () => {
                selectCommand(cmd);
            });
            
            categoryDiv.appendChild(cmdItem);
        });
        
        autocompletePopup.appendChild(categoryDiv);
    });
    
    // 定位弹窗
    const rect = inputElement.getBoundingClientRect();
    autocompletePopup.style.top = (rect.bottom + window.scrollY) + 'px';
    autocompletePopup.style.left = rect.left + 'px';
    
    // 显示弹窗
    autocompletePopup.style.display = 'block';
}

/**
 * 隐藏自动补全弹窗
 */
function hideAutocompletePopup() {
    if (autocompletePopup) {
        autocompletePopup.style.display = 'none';
    }
}

/**
 * 获取当前可删除的图形列表
 */
function getDeletableObjects() {
    const objects = [];
    
    const pts = window.points || {};
    const sList = window.shapeList || [];
    
    // 跟踪哪些点已被图形使用
    const usedPoints = new Set();
    
    // 从 shapeList（单一数据源）读取所有图形
    const typeMap = {
        'rectangle': '矩形',
        'triangle': '三角形',
        'segment': '线段',
        'circle': '圆',
        'angle': '角',
        'line': '直线',
        'point': '点',
        'function': '函数'
    };
    
    sList.forEach(entry => {
        const shape = entry.data && entry.data.shape;
        if (!shape) return;
        const displayType = typeMap[shape.type] || shape.type;
        objects.push({
            type: displayType,
            name: shape.name,
            displayName: shape.name
        });
        // 标记该图形使用的点
        if (shape.pointNames) {
            shape.pointNames.forEach(p => usedPoints.add(p));
        }
    });
    
    // 只显示不属于任何图形的孤立点
    const pointNames = Object.keys(pts).filter(name => !name.includes("'")).sort();
    pointNames.forEach(pointName => {
        if (!usedPoints.has(pointName)) {
            objects.push({
                type: '点',
                name: pointName,
                displayName: pointName
            });
        }
    });
    
    return objects;
}

/**
 * 显示可删除对象列表弹窗
 */
function showDeletePopup() {
    if (!autocompletePopup || !inputElement) return;
    
    // 清空弹窗内容
    autocompletePopup.innerHTML = '';
    
    // 添加标题
    const title = document.createElement('div');
    title.style.padding = '10px';
    title.style.backgroundColor = '#f5f5f5';
    title.style.fontWeight = 'bold';
    title.style.borderBottom = '1px solid #ddd';
    title.textContent = '选择要删除的对象';
    autocompletePopup.appendChild(title);
    
    // 获取可删除对象
    const objects = getDeletableObjects();
    
    if (objects.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.padding = '20px';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = '#999';
        emptyMsg.textContent = '没有可删除的对象';
        autocompletePopup.appendChild(emptyMsg);
    } else {
        objects.forEach(obj => {
            const item = document.createElement('div');
            item.style.padding = '12px 10px';
            item.style.cursor = 'pointer';
            item.style.borderBottom = '1px solid #eee';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            
            // 类型标签
            const typeTag = document.createElement('span');
            typeTag.style.backgroundColor = '#e9ecef';
            typeTag.style.padding = '3px 8px';
            typeTag.style.borderRadius = '3px';
            typeTag.style.fontSize = '12px';
            typeTag.style.marginRight = '10px';
            typeTag.textContent = obj.type;
            item.appendChild(typeTag);
            
            // 对象名称
            const nameSpan = document.createElement('span');
            nameSpan.style.fontWeight = 'bold';
            nameSpan.textContent = obj.displayName;
            item.appendChild(nameSpan);
            
            // 悬停效果
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f8f9fa';
            });
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'white';
            });
            
            // 点击事件
            item.addEventListener('click', () => {
                inputElement.value = '删除 ' + obj.name;
                // 不要立即重置，让用户可以查看并执行命令
                hideAutocompletePopup();
                inputElement.focus();
                console.log(`准备删除: ${obj.name}`);
            });
            
            autocompletePopup.appendChild(item);
        });
    }
    
    // 定位弹窗
    const rect = inputElement.getBoundingClientRect();
    autocompletePopup.style.top = (rect.bottom + window.scrollY) + 'px';
    autocompletePopup.style.left = rect.left + 'px';
    
    // 显示弹窗
    autocompletePopup.style.display = 'block';
}

/**
 * 选中命令
 */
function selectCommand(cmd) {
    if (!inputElement) return;
    
    // 特殊处理"删除"命令
    if (cmd.name === '删除') {
        // 显示可删除对象列表
        showDeletePopup();
        return;
    }
    
    // 将命令名称+空格放到输入框中
    inputElement.value = cmd.name + ' ';
    
    // 更新placeholder为参数提示
    inputElement.placeholder = cmd.hint;
    
    // 存储当前命令信息
    inputElement.dataset.selectedCommand = cmd.name;
    inputElement.dataset.commandHint = cmd.hint;
    
    // 关闭弹窗
    hideAutocompletePopup();
    
    // 聚焦输入框
    inputElement.focus();
    
    console.log(`已选择命令: ${cmd.name}`);
    console.log(`示例: ${cmd.example}`);
    console.log(`参数提示: ${cmd.hint}`);
}

/**
 * 获取当前选中的命令信息
 */
function getSelectedCommand() {
    if (!inputElement) return null;
    
    return {
        name: inputElement.dataset.selectedCommand,
        hint: inputElement.dataset.commandHint
    };
}

/**
 * 重置输入框
 */
function resetInput() {
    if (!inputElement) return;
    
    inputElement.value = '';
    inputElement.placeholder = '输入命令，例如：矩形abcd 或 圆O';
    delete inputElement.dataset.selectedCommand;
    delete inputElement.dataset.commandHint;
}
