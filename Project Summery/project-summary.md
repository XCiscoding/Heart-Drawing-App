# 情人节手势画爱心 Web 项目

## 项目概述

一个基于摄像头手势识别的交互式 Web 应用，用户可以用食指在空中画出爱心形状，系统会实时显示轨迹并在识别成功后自动生成3D全息投影爱心，支持双指手势缩放。

## 功能模块

### 1. 摄像头访问模块
- **功能**: 获取用户摄像头权限，处理视频流
- **实现**: 使用 `navigator.mediaDevices.getUserMedia()` API
- **特点**: 支持 60fps 高帧率，流畅的视频预览

### 2. 手势识别模块
- **功能**: 实时检测手部位置，提取食指指尖坐标
- **技术**: Google MediaPipe Hands 库（本地模型加载）
- **优化**: 
  - 置信度阈值降至 0.3，提高识别灵敏度
  - 60fps 帧率处理，实时响应
  - 本地模型文件加载，避免 CDN 依赖
- **输出**: 21个手部关键点坐标，重点关注食指指尖 (landmark 8)

### 3. 轨迹绘制模块
- **功能**: 实时显示食指移动轨迹
- **实现**: HTML5 Canvas 绘制平滑曲线
- **优化**: 
  - 修复镜像问题：坐标 x 轴翻转 `(1 - point.x)`
  - 轨迹点降噪、平滑处理
  - 渐隐效果，1.5秒保留时间
  - 多层光晕指示器（外圈+中圈+内圈）

### 4. 爱心识别模块
- **功能**: 检测用户是否画出爱心形状
- **算法**: 基于形状匹配和特征点检测
- **触发条件**: 轨迹形成闭合曲线且符合爱心几何特征

### 5. 3D全息爱心模块
- **功能**: 生成3D全息投影爱心
- **技术**: Three.js 3D渲染
- **特性**:
  - 线框结构 + 半透明填充
  - 青色发光材质
  - 点阵效果
  - 持续旋转动画
  - 周围粒子系统
  - 双指手势缩放
  - **高缩放级别粒子过渡效果**（Task 4）:
    - 缩放超过3.0x时，线框和填充逐渐淡出
    - 粒子亮度和大小时增强
    - 显示爱心轮廓粒子系统形成清晰形状
    - 平滑的lerp过渡动画

### 6. 手势控制模块
- **功能**: 双指捏合缩放3D爱心
- **实现**: 检测拇指(4)和食指(8)的距离
- **特性**:
  - 实时计算两指距离
  - 映射到缩放比例
  - 平滑过渡动画
  - 缩放范围 0.5x - 3.0x

### 7. 科技视觉效果模块
- **功能**: 钢铁侠风格的科技视觉
- **效果**:
  - 透视网格背景
  - 水平扫描线动画
  - 数据流（二进制+日文假名）
  - 发光边框和角落装饰
  - 全息投影圆环
  - 状态信息显示

### 8. UI界面模块
- **功能**: 科技感视觉设计、操作指引
- **风格**: 深蓝背景、青色发光元素、全息投影风格
- **元素**: 加载动画、状态提示、实时反馈

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| HTML5 | - | 页面结构 |
| CSS3 | - | 样式和动画 |
| JavaScript | ES6+ | 核心逻辑 |
| Vite | ^5.0 | 构建工具 |
| MediaPipe Hands | ^0.4 | 手势识别 |
| Three.js | ^0.160 | 3D渲染 |

## 实现逻辑流程

```
┌─────────────────────────────────────────────────────────────┐
│                        初始化阶段                            │
│  动态加载 hands.js → 初始化 MediaPipe → 启动摄像头          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       绘制模式                               │
│  视频帧 → 手部检测 → 提取食指坐标 → 坐标翻转 → 绘制轨迹      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       爱心识别                               │
│  轨迹点分析 → 爱心形状匹配 → 触发3D模式                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       3D全息模式                             │
│  生成3D爱心 → 旋转动画 → 粒子效果 → 双指缩放                │
└─────────────────────────────────────────────────────────────┘
```

## 核心算法说明

### 坐标映射算法
```javascript
// 修复镜像问题：将 x 坐标翻转
const canvasX = (1 - point.x) * canvas.width;
const canvasY = point.y * canvas.height;
```

### 爱心形状识别算法
1. **轨迹预处理**: 对采集的轨迹点进行降噪和平滑
2. **特征提取**: 计算轨迹的曲率、方向变化、闭合度
3. **形状匹配**: 与标准爱心形状进行相似度计算
4. **阈值判断**: 相似度超过阈值则判定为成功

### 3D爱心生成算法
```javascript
// 参数方程生成爱心
x = 16 * sin(t)^3
y = 13 * cos(t) - 5 * cos(2t) - 2 * cos(3t) - cos(4t)

// 创建TubeGeometry管状几何体
const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.5, 8, true);

// 线框材质
const wireframeMaterial = new THREE.LineBasicMaterial({
  color: 0x00ffff,
  transparent: true,
  opacity: 0.8
});
```

### 双指缩放算法（含非线性加速）
```javascript
// 计算拇指和食指距离
const distance = Math.sqrt(
  Math.pow(thumb.x - index.x, 2) +
  Math.pow(thumb.y - index.y, 2)
);

// 计算捏合持续时间
const pinchDuration = now - this.pinchStartTime;

// 使用ease-out加速曲线计算当前缩放速度
// speed = baseSpeed + (maxSpeed - baseSpeed) * (1 - e^(-time/constant))
const timeFactor = pinchDuration / ZOOM_ACCEL_CONSTANT;
const easeOutFactor = 1 - Math.exp(-timeFactor);
const currentZoomSpeed = ZOOM_BASE_SPEED + 
  (ZOOM_MAX_SPEED - ZOOM_BASE_SPEED) * easeOutFactor;

// 应用速度因子到缩放比例
const speedMultiplier = 1 + (currentZoomSpeed - ZOOM_BASE_SPEED) * 0.3;
const adjustedScaleRatio = 1 + (scaleRatio - 1) * speedMultiplier;

// 映射到缩放比例并限制范围
const newTargetScale = currentScale * adjustedScaleRatio;
const clampedScale = Math.max(0.25, Math.min(4.0, newTargetScale));
```

## 项目结构

```
画爱心/
├── Project Summery/
│   ├── project-summary.md          # 项目文档
│   └── holographic-heart-plan.md   # 全息爱心方案
├── Prompt/
│   ├── spec.md                     # 规格说明
│   ├── tasks.md                    # 任务列表
│   └── checklist.md                # 验证清单
├── public/
│   └── mediapipe/hands/            # MediaPipe 本地模型文件
│       ├── hands.js
│       ├── hand_landmark_full.tflite
│       └── ...
├── src/
│   ├── main.js                     # 入口文件
│   ├── handTracker.js              # 手势追踪模块
│   ├── gestureController.js        # 手势控制模块（缩放）
│   ├── holographicHeart3D.js       # 3D爱心渲染模块
│   ├── techEffects.js              # 科技视觉效果模块
│   ├── canvasRenderer.js           # 画布渲染模块（备用）
│   ├── heartDetector.js            # 爱心识别模块（备用）
│   ├── animation.js                # 动画效果模块（备用）
│   └── style.css                   # 样式文件
├── index.html                      # 主页面
├── package.json                    # 依赖配置
└── vite.config.js                  # Vite配置
```

## 核心代码说明

### HandTracker (handTracker.js)
- 动态加载 MediaPipe Hands 脚本
- 本地模型文件加载，避免 CDN 依赖
- 实时检测手部21个关键点
- 提取食指指尖坐标 (landmark 8)
- 置信度阈值 0.3，提高识别灵敏度
- 60fps 视频帧处理

### HolographicHeart3D (holographicHeart3D.js)
- Three.js 3D场景初始化
- 参数方程生成爱心几何体
- TubeGeometry + WireframeGeometry 线框效果
- PointsMaterial 点阵效果
- 粒子系统（300个漂浮粒子）
- 持续旋转动画
- 平滑缩放过渡
- **高缩放级别粒子过渡效果**（Task 4）:
  - `ZOOM_THRESHOLD = 3.0` 缩放阈值检测
  - `heartMeshes` 数组存储线框/填充/点阵引用
  - `heartOutlineParticles` 爱心轮廓粒子系统（500粒子）
  - `updateZoomTransition()` 平滑过渡更新
  - 线框透明度：1.0 → 0.0（3.0x-4.0x）
  - 粒子强度：1.0 → 2.0（3.0x-4.0x）
  - lerp插值系数0.05确保平滑过渡

### GestureController (gestureController.js)
- 检测拇指(4)和食指(8)位置
- 计算两指尖欧几里得距离
- 距离映射到缩放比例
- 平滑过渡算法
- 缩放范围限制 0.25x - 4.0x
- **非线性缩放速度算法**：
  - 速度累积机制
  - Ease-out加速曲线：`speed = baseSpeed + (maxSpeed - baseSpeed) * (1 - e^(-time/constant))`
  - 手势持续时间跟踪
  - 从慢到快的自然加速效果

### TechEffects (techEffects.js)
- 透视网格绘制（消失点效果）
- 扫描线动画（水平移动）
- 数据流效果（二进制+日文）
- 发光边框和角落装饰
- 全息投影圆环（旋转刻度）
- 状态信息显示（SCALE/FPS等）

### HolographicHeartApp (main.js)
- 应用主控制器
- 三层 Canvas 架构（3D/2D/轨迹）
- 模式切换（绘制模式 ↔ 3D模式）
- 协调各模块工作
- 状态管理和UI更新

## 开发进度

- [x] 项目规划与文档编写
- [x] 初始化项目结构
- [x] 实现摄像头访问
- [x] 集成 MediaPipe Hands（本地模型）
- [x] 实现轨迹绘制
- [x] 修复镜像问题
- [x] 提高识别灵敏度
- [x] 实现爱心识别
- [x] 集成 Three.js
- [x] 实现3D全息爱心
- [x] 实现粒子系统
- [x] 实现双指手势缩放
- [x] 实现科技视觉效果
- [x] 整合所有模块
- [x] UI优化与测试
- [x] Task 4: 高缩放级别粒子过渡效果
  - [x] 3.0x阈值检测
  - [x] 线框/填充淡入淡出
  - [x] 粒子密度和亮度动态调整
  - [x] 爱心轮廓粒子系统
  - [x] 平滑lerp过渡
- [x] Task 5: 集成测试和优化
  - [x] 完整用户流程测试
  - [x] 缩放范围一致性修复
  - [x] 构建验证

## 运行方式

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 使用说明

1. 打开网页后允许摄像头访问权限
2. 等待模型加载完成（约几秒钟）
3. 举起食指，系统会显示手指位置（红色光点）
4. 在空中画出爱心形状
5. 识别成功后生成3D全息爱心
6. 伸出拇指和食指，捏合手势缩放爱心
7. 点击画面可以重新画爱心

## 优化记录

### 2026-02-14 优化内容

1. **修复镜像问题**
   - 坐标映射：`canvasX = (1 - point.x) * width`
   - 手指在画面左侧，红点也在左侧

2. **提高识别灵敏度**
   - 置信度阈值：0.5 → 0.3
   - 移动阈值：0.005 → 0.002
   - 摄像头帧率：30fps → 60fps

3. **本地模型加载**
   - 避免 CDN 依赖
   - 解决网络超时问题
   - 动态加载 hands.js

4. **优化视觉效果**
   - 多层光晕指示器
   - 轨迹渐隐效果
   - 更流畅的动画

### 2026-02-14 新增3D全息功能

1. **集成 Three.js**
   - 安装 three 依赖
   - 创建3D场景
   - WebGL渲染器

2. **3D爱心渲染**
   - 参数方程生成爱心
   - TubeGeometry 管状几何体
   - WireframeGeometry 线框效果
   - 半透明填充
   - 青色发光材质

3. **粒子系统**
   - 300个漂浮粒子
   - AdditiveBlending 混合模式
   - 随机运动轨迹
   - 边界循环

4. **双指手势缩放**
   - 检测拇指和食指
   - 计算指尖距离
   - 映射到缩放比例
   - 平滑过渡动画

5. **科技视觉效果**
   - 透视网格背景
   - 水平扫描线
   - 数据流（二进制+日文）
   - 发光边框
   - 全息投影圆环
   - 状态信息显示

6. **双层Canvas架构**
   - 3D Canvas（上层）
   - 2D特效 Canvas（中层）
   - 轨迹 Canvas（底层）

## 注意事项

1. **隐私保护**: 摄像头数据仅在本地处理，不上传服务器
2. **性能优化**: 使用 requestAnimationFrame 确保流畅动画
3. **兼容性**: 需要现代浏览器支持 WebRTC 和 WebGL
4. **用户体验**: 提供清晰的操作指引和视觉反馈
5. **光线要求**: 建议在光线充足的环境下使用
6. **3D性能**: Three.js 需要较好的显卡性能
7. **手势识别**: 双指缩放需要清晰的手部图像

## 更新记录

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2026-02-14 | v1.0 | 项目初始化，完成基础规划 |
| 2026-02-14 | v1.1 | 完成所有功能模块开发和UI优化 |
| 2026-02-14 | v1.2 | 修复镜像问题，提高识别灵敏度，本地模型加载 |
| 2026-02-14 | v2.0 | 新增3D全息爱心、双指缩放、科技视觉效果 |
| 2026-02-16 | v2.1 | 实现非线性缩放速度算法，添加ease-out加速曲线 |
| 2026-02-16 | v2.2 | Task 4: 实现高缩放级别粒子过渡效果（3.0x-4.0x） |
| 2026-02-16 | v2.3 | Task 5: 集成测试和优化，修复缩放范围一致性 |

---

**项目状态**: 已完成
