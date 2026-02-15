# 轨迹消失和爱心识别优化计划

## 问题分析

### 问题1：轨迹画着画着就会消失
**原因分析：**
- 之前添加的"手指静止检测"逻辑过于敏感
- 500毫秒的静止时间阈值太短，正常绘制时也会触发
- 导致用户在画的过程中轨迹被意外清空

**解决方案：**
1. 移除或放宽静止检测逻辑
2. 增加更合理的判断条件（如：必须完全停止移动且持续更长时间）
3. 或者改为手动重置（如：手指移出画面才重置）

### 问题2：爱心无法正常识别
**原因分析：**
- 当前的识别算法可能过于严格或逻辑有误
- 检测条件之间可能存在冲突
- 缺乏对绘制过程的容错处理

**解决方案：**
1. 使用更简单可靠的识别方法
2. 采用模板匹配或形状相似度算法
3. 增加绘制引导和视觉反馈

## 实施步骤

### 步骤1：修复轨迹消失问题

**文件：** `src/main.js`

**修改内容：**
1. 移除或注释掉自动重置逻辑
2. 改为：只有当手指完全离开画面时才重置
3. 或者：增加重置按钮/手势

**代码变更：**
```javascript
// 移除这段自动重置逻辑：
// const timeSinceLastMove = currentTime - this.lastMoveTime;
// if (timeSinceLastMove > 500 && this.trail.length > 5) {
//   this.resetTrail();
//   return;
// }

// 改为只在手指消失时重置：
if (!indexFingerTip) {
  this.resetTrail();
}
```

### 步骤2：重写爱心识别算法

**方案A：使用简单的几何特征匹配**

**文件：** `src/main.js` 的 `detectHeart()` 方法

**核心逻辑：**
1. 检查轨迹点数量（至少20个点）
2. 计算轨迹的包围盒
3. 检查宽高比（爱心通常是竖向的，高/宽在1.0-1.8之间）
4. 检查是否有两个明显的"峰"（上半部分左右各一个高点）
5. 检查底部是否收窄（下半部分比上半部分窄）
6. 检查轨迹是否大致闭合（起点终点距离较近）

**代码实现：**
```javascript
detectHeart() {
  if (this.trail.length < 20 || this.hasDetectedHeart) return false;
  
  const points = this.trail;
  
  // 1. 计算边界框
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  
  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  // 2. 尺寸检查
  if (width < 0.1 || height < 0.15) return false;
  
  // 3. 宽高比检查（爱心通常是竖向的）
  const ratio = height / width;
  if (ratio < 1.0 || ratio > 2.0) return false;
  
  // 4. 检查上半部分是否有两个高点（爱心顶部两个圆弧）
  const upperPoints = points.filter(p => p.y < centerY);
  const leftSide = upperPoints.filter(p => p.x < centerX);
  const rightSide = upperPoints.filter(p => p.x >= centerX);
  
  // 左右两侧都应该有足够多的点
  if (leftSide.length < 5 || rightSide.length < 5) return false;
  
  // 5. 检查下半部分是否收窄
  const lowerPoints = points.filter(p => p.y >= centerY);
  const lowerWidth = Math.max(...lowerPoints.map(p => p.x)) - Math.min(...lowerPoints.map(p => p.x));
  
  if (lowerWidth > width * 0.85) return false;
  
  // 6. 检查轨迹是否大致闭合
  const start = points[0];
  const end = points[points.length - 1];
  const dist = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
  
  if (dist > width * 0.4) return false;
  
  return true;
}
```

### 步骤3：优化检测频率和时机

**文件：** `src/main.js` 的 `startHeartDetection()` 方法

**修改内容：**
- 检测间隔改为100ms（更频繁）
- 在轨迹点达到20个时立即开始检测
- 检测到爱心后立即停止检测（避免重复触发）

**代码变更：**
```javascript
startHeartDetection() {
  this.heartCheckInterval = setInterval(() => {
    if (!this.hasDetectedHeart && this.trail.length >= 20) {
      if (this.detectHeart()) {
        this.onHeartDetected();
        clearInterval(this.heartCheckInterval); // 停止检测
      }
    }
  }, 100);
}
```

### 步骤4：添加调试信息（可选）

为了帮助用户理解识别过程，可以在画布上显示：
- 当前轨迹点数
- 检测状态提示
- 识别失败原因

## 文件变更

| 文件 | 修改内容 |
|------|---------|
| `src/main.js` | 移除自动重置逻辑，重写detectHeart方法，优化检测频率 |

## 预期效果

1. **轨迹稳定**：不会再画着画着就消失
2. **识别率提高**：使用更简单可靠的识别逻辑
3. **响应更快**：检测频率提高，识别更及时
