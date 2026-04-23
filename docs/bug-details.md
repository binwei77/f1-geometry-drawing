# F1几何图形生成器 - Bug详细记录

最后更新：2026-04-21

---

## Bug #1：删除命令的撤销功能不完整 [高优先级] [已修复]

**文件：** js/commands.js (1432-1436行, 362-391行)

**问题描述：**
删除命令执行时会保存deletedState和deletedShape，但在撤销删除时（362-391行），只恢复了点的状态（points和labeledPoints），没有恢复shapes数组中的图形对象。

**复现步骤：**
1. 绘制一个图形（如矩形abcd）
2. 执行删除命令（删除 矩形abcd）
3. 执行撤销命令
4. 观察删除功能的自动补全列表（输入/d）

**期望行为：**
撤销删除后，图形和点应该完全恢复，包括shapes数组中的图形对象。删除功能的自动补全列表应该显示该图形。

**实际行为：**
点的坐标恢复正确，但shapes数组中没有对应的图形对象，导致删除功能的自动补全列表中不显示该图形。

**根本原因：**
在commands.js的1432-1436行，deletedShape的查找逻辑使用了错误的字符串匹配方式，导致无法正确找到shapes数组中的图形对象。shapes数组中的图形对象name格式为：'点A', '三角形abc', '矩形abcd', '圆O'，但原来的代码只检查部分匹配，没有正确处理。

**修复方案：**
1. 修改deletedShape的查找逻辑，正确匹配shapes数组中的图形对象
2. 完善撤销删除时的shapes数组恢复逻辑
3. 确保删除和撤销操作中shapes数组的状态保持一致

**修复记录：**
- 状态：已修复
- 修复日期：2026-04-21
- 修复人：bw77
- 修改内容：
  - 修改了commands.js中1432-1436行的deletedShape查找逻辑，使用正确的匹配规则
  - 直接匹配完整名称（s.name === target）
  - 对于圆，支持输入圆心点名（target === s.name.substring(1)）
  - 对于点，支持输入点名（target === s.name）
- 验证结果：待验证

---

## Bug #2：清除命令没有清空shapes数组 [高优先级] [已修复]

**文件：** js/commands.js (1564-1569行)

**问题描述：**
清除/清空命令只调用了clearCanvas()，但没有清空shapes数组。

**复现步骤：**
1. 绘制多个图形（如矩形abcd、三角形abc、圆O）
2. 执行清空命令
3. 输入/d查看可删除对象列表

**期望行为：**
清空后，所有数据被清除，删除列表应该为空，画布上不应显示任何图形。

**实际行为：**
画布被清空，点的数据也被清除，但shapes数组中的数据仍然存在，导致删除功能的自动补全列表仍显示已清空的图形。

**根本原因：**
在commands.js的1564-1569行，清除命令的实现只是调用了clearCanvas()，而clearCanvas()函数（canvas.js 299-306行）在clearPointsFlag为true时会调用clearPoints()清空shapes数组，但在清除命令的执行上下文中，没有明确调用shapes.length = 0来清空shapes数组。

**修复方案：**
在清除命令执行时，明确调用shapes.length = 0清空shapes数组，确保所有图形对象都被清除。

**修复记录：**
- 状态：已修复
- 修复日期：2026-04-21
- 修复人：bw77
- 修改内容：
  - 在commands.js的清除命令中添加shapes.length = 0来清空shapes数组
  - 同时添加Object.keys(points).forEach(key => delete points[key])清空points对象
  - 添加labeledPoints.clear()清空labeledPoints集合
  - 添加撤销逻辑支持：保存清除前的状态到undoStack，包括points、labeledPoints和shapes的深拷贝
- 验证结果：待验证

---

## Bug #3：清除命令后的shapes恢复逻辑不一致 [中优先级] [已修复]

**文件：** js/commands.js (392-425行, 1564-1589行)

**问题描述：**
虽然撤销清除命令时恢复了shapes数组（393-422行），但在清除命令执行时（1555-1557行）没有清空shapes数组，导致恢复逻辑与实际状态不一致。

**复现步骤：**
1. 绘制图形（如矩形abcd）
2. 执行清空命令
3. 绘制新图形（如三角形efg）
4. 执行撤销命令

**期望行为：**
撤销后应该恢复清空前的状态（矩形abcd），画布上显示矩形abcd。

**实际行为：**
由于清除时未清空shapes数组，撤销恢复时状态混乱，可能同时显示矩形abcd和三角形efg，或者显示错误。

**根本原因：**
1. 在清除命令执行时（1564-1569行）没有清空shapes数组
2. 撤销逻辑中（392-425行）使用了全局变量clearedState而不是从lastCmd中获取
3. 撤销时没有正确跳过清除命令的重新执行，导致状态混乱

**修复方案：**
1. 在清除命令执行时清空shapes数组
2. 在撤销逻辑中使用lastCmd.clearedState而不是全局变量clearedState
3. 在撤销恢复时跳过清除和删除命令的重新执行
4. 统一清除和恢复的shapes数组管理逻辑

**修复记录：**
- 状态：已修复
- 修复日期：2026-04-21
- 修复人：bw77
- 修改内容：
  - 清除命令：保存清除前的状态（points、labeledPoints、shapes）到undoStack
  - 清除命令：清空shapes、points和labeledPoints
  - 撤销逻辑：使用lastCmd.clearedState替代全局变量clearedState
  - 撤销逻辑：跳过清空和删除命令的重新执行，避免状态混乱
- 验证结果：待验证

---

## Bug #4：shapes数组数据管理不一致 [中优先级] [已修复]

**文件：** js/points.js, js/commands.js, js/shapes.js, js/autocomplete.js

**问题描述：**
shapes数组（points.js）和shapeList数组（commands.js）两套并行数据结构不同步，删除、清空、撤销等操作只修改其中一个，导致状态不一致。

**复现步骤：**
1. 绘制图形（如矩形abcd）
2. 执行删除命令
3. 执行撤销命令
4. 检查shapes数组vs shapeList数组

**期望行为：**
shapes和shapeList始终保持同步，删除、清空、撤销操作后两者一致。

**实际行为：**
- 删除操作只从shapes中删除，shapeList未同步
- 清空操作只清空shapes，shapeList未清空
- 撤销删除/清空只恢复shapes，shapeList未恢复
- 变换命令（旋转/对称/平移）中shapes.push重复执行

**根本原因：**
shapes数组（存储{type,name,pointNames,color,fill}）和shapeList数组（存储{id,type,name,points,data,createdAt}）是两套独立数据结构，没有同步机制。

**修复方案：**
统一为shapeList单一数据源，shapes作为自动同步的派生视图：
1. addShapeToList同时push到shapes
2. removeShapeFromList/ByType/ByName/ByPoint同时从shapes中splice
3. clear命令同时清空shapes和shapeList
4. undo delete/clear同时恢复shapes和shapeList
5. clearPoints同时清空shapeList
6. rebuildCanvas从shapeList重建shapes
7. 移除变换命令中6处重复的shapes.push

**修复记录：**
- 状态：已修复
- 修复日期：2026-04-22
- 修复人：bw77
- 修改内容：
  - points.js: clearPoints同步清空shapeList，shapes getter/setter保留
  - commands.js: addShapeToList/removeShapeFromList/ByType/ByName/ByPoint增加shapes同步
  - commands.js: delete/clear/undo逻辑增加shapeList同步
  - commands.js: 暴露window.shapeList，移除6处重复push
  - autocomplete.js: getDeletableObjects重写为直接读取shapeList
  - shapes.js: 交点创建同步到shapeList
- 验证结果：待验证

---

## Bug #5：clearCanvas函数中shapes数组清空逻辑不完善 [低优先级] [已修复]

**文件：** js/canvas.js (299-306行), js/points.js

**问题描述：**
clearCanvas(false)不清空shapes和shapeList，但实际上clearCanvas(false)是设计用于重绘场景（清像素不清数据），不应清空数据。真正的问题是shapes/shapeList不同步，已通过Bug #4的统一同步机制解决。

**复现步骤：**
1. 绘制图形（如矩形abcd）
2. 调用clearCanvas(false)
3. 输入/d查看删除列表

**期望行为：**
clearCanvas(false)只清画布像素，数据保留。shapes和shapeList同步一致。

**实际行为：**
之前shapes和shapeList可能不一致，现已通过统一同步机制修复。

**根本原因：**
Bug #4的子问题——双数据结构不同步。clearCanvas(false)本身设计正确（不清数据），问题在于其他操作（删除/清空/撤销）未同步两个数组。

**修复方案：**
通过Bug #4的统一同步机制一并解决。

**修复记录：**
- 状态：已修复
- 修复日期：2026-04-22
- 修复人：bw77
- 修改内容：clearPoints同步清空shapeList，全局shapes/shapeList同步
- 验证结果：待验证

---

## Bug #6：删除命令名称匹配不全 [中优先级] [未修复]

**文件：** js/commands.js (removeShapesByName函数, line 102-121)

**问题描述：**
`removeShapesByName()` 只做精确匹配（`s.name === name`），不支持前缀匹配。当用户输入"删除 矩形abcd"时，传入name="矩形abcd"，但shapeList中的name是"abcd"（无前缀），导致匹配失败。

旧的删除逻辑（line 1572-1597的shapes.find()）有前缀匹配：
- "矩形abcd" → target.substring(2)="abcd" 匹配 s.type==='rectangle'
- "三角形abc" → target.substring(3)="abc" 匹配 s.type==='triangle'
- "圆O" → 匹配 s.type==='circle'

但 `removeShapesByName`（被 `deleteShapeByName` 调用）只有 `s.name === name` 精确匹配。

**复现步骤：**
1. 输入"矩形abcd"创建矩形
2. 输入"删除 矩形abcd"
3. 观察控制台输出"没有找到名为\"矩形abcd\"的图形"

**期望行为：**
"删除 矩形abcd"应匹配到name="abcd"的矩形并删除。

**实际行为：**
匹配失败，提示"没有找到名为\"矩形abcd\"的图形"。

**根本原因：**
`removeShapesByName` 的匹配逻辑（line 103, 108）只有 `s.name === name` 精确匹配，缺少前缀匹配逻辑。

**修复方案：**
在 `removeShapesByName` 中增加前缀匹配：
1. 精确匹配：`s.name === name`
2. 矩形前缀：name包含"矩形"/"长方形"，且s.type==='rectangle'，name去掉前缀后===s.name
3. 三角形前缀：name包含"三角形"，且s.type==='triangle'，name去掉前缀后===s.name
4. 圆前缀：name包含"圆"，且s.type==='circle'
5. 或者抽取为独立的 `matchShapeName(name, shapeName, shapeType)` 函数，在多处复用

**修复记录：**
- 状态：未修复
- 修复日期：-
- 修复人：-
- 验证结果：-

---

## 修复优先级总结

**高优先级（需立即修复）：**
1. Bug #1：删除命令的撤销功能不完整 [已修复]
2. Bug #2：清除命令没有清空shapes数组 [已修复]

**中优先级（建议尽快修复）：**
3. Bug #3：清除命令后的shapes恢复逻辑不一致 [已修复]
4. Bug #4：shapes数组数据管理不一致 [已修复]
6. Bug #6：删除命令名称匹配不全 [未修复]

**低优先级（可选修复）：**
5. Bug #5：clearCanvas函数中shapes数组清空逻辑不完善 [已修复]

---

## 相关代码位置

**主要涉及的文件和函数：**
- js/commands.js: executeCommand, 撤销/重做逻辑, 删除命令, 清除命令
- js/shapes.js: drawRectangle, drawCircle, drawTriangle
- js/canvas.js: clearCanvas
- js/points.js: clearPoints
- js/autocomplete.js: getDeletableObjects

**关键数据结构：**
- shapes数组：存储所有图形对象
- points对象：存储所有点的坐标
- labeledPoints集合：记录已标注的点
- commandHistory数组：存储命令历史
- redoStack数组：存储重做栈
- clearedState对象：存储清空前的状态

---

## 测试建议

为了验证这些bug的修复效果，建议添加以下测试用例：

1. **测试删除撤销后删除列表的显示**
   - 绘制图形 → 删除图形 → 撤销 → 检查删除列表

2. **测试清除后删除列表列表的显示**
   - 绘制多个图形 → 清除 → 检查删除列表

3. **测试清除撤销恢复**
   - 绘制图形A → 清除 → 绘制图形B → 撤销 → 检查是否恢复图形A

4. **测试撤销重做后shapes数组状态**
   - 多次操作 → 撤销 → 重做 → 检查shapes数组状态

5. **测试clearCanvas参数影响**
   - 绘制图形 → clearCanvas(false) → 检查shapes数组状态

---

## 修复验证模板

当修复bug后，请填写以下信息：

**Bug #X 修复验证**
- 修复日期：YYYY-MM-DD
- 修复人：XXX
- 修改文件：文件名
- 修改内容：简要描述
- 验证步骤：
  1. ...
  2. ...
- 验证结果：✅ 通过 / ❌ 失败
- 备注：其他说明

---

**最后更新：** 2026-04-22
**文档版本：** 1.2
**修复摘要：** 已修复Bug #1-#5（高优先级2个，中优先级2个，低优先级1个），待修复Bug #6（删除名称匹配不全），待验证
