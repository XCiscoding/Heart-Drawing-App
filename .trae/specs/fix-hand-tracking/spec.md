## 项目概述

创建一个情人节主题的Web应用，通过摄像头捕捉用户手势，用食指在空中画爱心并实时显示轨迹，画好后自动填充红色。

## 功能模块

1. **摄像头访问模块** - 获取摄像头权限，实时视频流处理
2. **手势识别模块** - 使用 MediaPipe Hands 检测手部，提取食指指尖坐标
3. **轨迹绘制模块** - 实时显示食指移动轨迹，轨迹平滑处理
4. **爱心识别模块** - 检测爱心形状，使用形状匹配算法
5. **动画渲染模块** - 爱心自动填充红色，添加粒子光效动画
6. **UI界面模块** - 科技感视觉设计，简洁优雅界面

## 技术栈

* HTML5 Canvas - 绘制轨迹和爱心

* MediaPipe Hands - 手势识别

* JavaScript (ES6+) - 核心逻辑

* CSS3 - 样式和动画

* Vite - 构建工具

## 实现逻辑

1. 初始化 → 请求摄像头权限 → 加载MediaPipe模型
2. 视频帧处理 → 检测手部 → 获取食指指尖坐标
3. 记录轨迹点 → 实时绘制轨迹线
4. 形状识别 → 判断是否画出爱心 → 触发填充动画
5. 爱心填充 → 播放动画效果 → 等待重新开始

## 项目结构

```
画爱心/
├── Project Summery/
│   └── project-summary.md
├── src/
│   ├── main.js
│   ├── handTracker.js
│   ├── canvasRenderer.js
│   ├── heartDetector.js
│   ├── animation.js
│   └── style.css
├── index.html
├── package.json
└── vite.config.js
```

## 执行步骤

1. 创建 Project Summery 文件夹和项目总结文档
2. 初始化 Vite 项目
3. 安装依赖 (MediaPipe Hands)
4. 创建核心模块文件
5. 实现手势追踪和绘制功能
6. 实现爱心识别算法
7. 添加动画效果
8. 优化UI设计

