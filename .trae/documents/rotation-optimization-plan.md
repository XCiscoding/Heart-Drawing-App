# 旋转控制优化计划

## 目标
1. 旋转方向镜像翻转（手指移动方向与旋转方向相反）
2. 增大旋转角度（提高旋转灵敏度）

## 分析

### 当前实现
- 文件：`src/gestureController.js`
- 水平移动控制 Y 轴旋转：`targetRotationY += deltaX * 3`
- 垂直移动控制 X 轴旋转：`targetRotationX -= deltaY * 3`

### 需要修改的地方

#### 1. 旋转方向镜像翻转
**位置：** `src/gestureController.js` 第 101-102 行

**当前代码：**
```javascript
this.targetRotationY += deltaX * 3; // 水平移动 -> Y轴旋转
this.targetRotationX -= deltaY * 3; // 垂直移动 -> X轴旋转
```

**修改方案：**
- 将 `+=` 改为 `-=`（水平方向翻转）
- 将 `-=` 改为 `+=`（垂直方向翻转）

**修改后：**
```javascript
this.targetRotationY -= deltaX * 3; // 水平移动 -> Y轴旋转（翻转）
this.targetRotationX += deltaY * 3; // 垂直移动 -> X轴旋转（翻转）
```

#### 2. 增大旋转角度
**位置：** `src/gestureController.js` 第 101-102 行

**当前乘数：** 3

**建议新乘数：** 5 或 6（增加约 60-100% 的灵敏度）

**修改后：**
```javascript
this.targetRotationY -= deltaX * 5; // 增大旋转角度
this.targetRotationX += deltaY * 5; // 增大旋转角度
```

## 实施步骤

1. **修改 gestureController.js**
   - 翻转旋转方向
   - 增大旋转乘数（3 → 5）

2. **测试验证**
   - 运行 `npm run dev`
   - 测试手指移动方向是否与旋转方向相反
   - 测试旋转角度是否更大

## 预期效果

- 手指向右移动 → 爱心向左旋转（镜像翻转）
- 手指向上移动 → 爱心向下旋转（镜像翻转）
- 旋转灵敏度提高约 60%

## 文件变更

| 文件 | 修改内容 |
|------|---------|
| `src/gestureController.js` | 翻转旋转方向，增大旋转乘数 |
