# 轨迹消失速度和旋转灵敏度调整计划

## 目标
1. 调整轨迹消失速度：静止时消失更快，动起来时消失更慢
2. 降低旋转灵敏度：旋转乘数从 5 减小为 4

## 分析

### 问题 1：轨迹消失速度不合理

**当前实现：**
- 文件：`src/main.js`
- 最大轨迹长度固定为 100
- 新点添加时，超出长度就从头部移除

**问题：**
- 静止时：手指不动，但轨迹还在，消失太慢
- 动起来时：轨迹快速被新点替换，消失太快

**解决方案：**
引入动态轨迹长度机制：
- 根据手指移动速度调整轨迹保留时间
- 移动速度快时：保留更多点（消失慢）
- 移动速度慢/静止时：保留更少点（消失快）

**具体实现：**
```javascript
// 根据移动速度动态调整轨迹长度
const speed = 计算手指移动速度;
const dynamicMaxLength = speed > 阈值 ? 150 : 50; // 快时150，慢时50
```

### 问题 2：旋转灵敏度过高

**当前实现：**
- 文件：`src/gestureController.js` 第 101-102 行
- 旋转乘数：5

**修改方案：**
将乘数从 5 减小为 4

**修改后：**
```javascript
this.targetRotationY -= deltaX * 4; // 从5改为4
this.targetRotationX += deltaY * 4; // 从5改为4
```

## 实施步骤

### 步骤 1：修改轨迹消失逻辑

**文件：** `src/main.js`

**修改内容：**
1. 添加速度计算逻辑
2. 根据速度动态调整 `maxTrailLength`
3. 修改点添加时的长度检查逻辑

**代码变更：**
```javascript
// 在 onHandResults 方法中
if (distance > minDistance) {
  // 计算移动速度
  const speed = distance / timeDelta;
  
  // 根据速度动态调整轨迹最大长度
  // 速度快(>0.1): 150点，速度慢: 50点
  const dynamicMaxLength = speed > 0.1 ? 150 : 50;
  
  this.trail.push({ ...smoothedPoint });
  
  // 动态移除旧点
  while (this.trail.length > dynamicMaxLength) {
    this.trail.shift();
  }
}
```

### 步骤 2：降低旋转灵敏度

**文件：** `src/gestureController.js`

**修改内容：**
将旋转乘数从 5 改为 4

**代码变更：**
```javascript
// 第101-102行
this.targetRotationY -= deltaX * 4; // 从5改为4
this.targetRotationX += deltaY * 4; // 从5改为4
```

## 预期效果

### 轨迹消失速度
- **静止时**：轨迹长度限制为 50 点，消失更快
- **快速移动时**：轨迹长度限制为 150 点，保留更久

### 旋转灵敏度
- 旋转速度降低约 20%
- 更容易精确控制旋转角度

## 文件变更

| 文件 | 修改内容 |
|------|---------|
| `src/main.js` | 添加动态轨迹长度逻辑 |
| `src/gestureController.js` | 旋转乘数 5 → 4 |

## 测试验证

1. **轨迹测试**
   - 静止不动，观察轨迹是否快速消失
   - 快速画线，观察轨迹是否保留更久

2. **旋转测试**
   - 双指移动，观察旋转是否更平滑
   - 检查旋转角度是否更容易控制
