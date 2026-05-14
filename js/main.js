/**
 * 主入口模块
 * 负责初始化和事件绑定
 */

let commandInput;

/**
 * 初始化应用
 */
function init() {
    // 初始化Canvas
    initCanvas();
    
    // 获取DOM元素
    commandInput = document.getElementById('commandInput');
    
    // 初始化自动补全功能
    initAutocomplete();
    
    // 监听回车键
    commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            let cmdText = commandInput.value.trim();
            
            if (cmdText) {
                executeCommand(cmdText);
            }
            
            commandInput.value = '';
            commandInput.placeholder = '输入命令，如：矩形abcd';
            hideAutocompletePopup();
        }
    });
    
    // 缩放按钮事件
    document.getElementById('zoomIn').addEventListener('click', () => {
        currentZoom = Math.min(currentZoom + zoomStep, maxZoom);
        applyZoom();
    });
    
    document.getElementById('zoomOut').addEventListener('click', () => {
        currentZoom = Math.max(currentZoom - zoomStep, minZoom);
        applyZoom();
    });
    
    document.getElementById('zoomReset').addEventListener('click', () => {
        currentZoom = 1;
        applyZoom();
    });
    
    // 撤销和重做按钮事件
    document.getElementById('undoBtn').addEventListener('click', () => {
        executeCommand('撤销');
    });
    
    document.getElementById('redoBtn').addEventListener('click', () => {
        executeCommand('重做');
    });
    
    // 帮助命令点击/触摸事件 - 事件委托方式，解决手机端details内部点击不生效
    let helpFillLock = false;
    const helpFill = (e) => {
        if (helpFillLock) return;
        const li = e.target.closest('#help li');
        if (!li) return;
        const span = li.querySelector('.cmd[data-example]');
        if (!span) return;
        e.preventDefault();
        e.stopPropagation();
        helpFillLock = true;
        setTimeout(() => { helpFillLock = false; }, 300);
        commandInput.value = span.getAttribute('data-example');
        commandInput.focus();
    };
    document.addEventListener('touchend', helpFill, { passive: false });
    document.addEventListener('click', helpFill);
    // 标记可点击的li
    document.querySelectorAll('#help li').forEach(li => {
        if (li.querySelector('.cmd[data-example]')) li.style.cursor = 'pointer';
    });
    
    // 初始画网格
    drawGrid();
    // 初始应用缩放
    applyZoom();
}

// 等待DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}