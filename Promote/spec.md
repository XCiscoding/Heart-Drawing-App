# 优化轨迹圆滑度和爱心识别自动保存 Spec

## Why
当前轨迹绘制存在标记点，线条不够圆滑。用户画出爱心后需要自动保存图片并填充爱心。

## What Changes
- 优化 Canvas 轨迹绘制，使用贝塞尔曲线实现圆滑线条
- 移除轨迹点标记，只显示连续曲线
- 实现爱心形状识别算法
- 识别成功后自动保存画布图片
- 播放爱心填充动画

## Impact
- Affected code: src/canvasRenderer.js, src/main.js, src/heartDetector.js
- Affected functionality: 轨迹绘制、爱心识别、图片保存

## ADDED Requirements

### Requirement: 圆滑轨迹绘制
The system SHALL draw smooth curves without visible trail points.

#### Scenario: 绘制轨迹
- **WHEN** 用户移动手指
- **THEN** 画布上应显示圆滑的贝塞尔曲线
- **AND** 不应显示任何标记点或节点

### Requirement: 爱心识别自动保存
The system SHALL automatically save the image when a heart shape is detected.

#### Scenario: 识别成功
- **WHEN** 用户画出爱心形状
- **THEN** 系统自动识别爱心
- **AND** 保存当前画布为图片
- **AND** 播放爱心填充动画

## MODIFIED Requirements

### Requirement: 轨迹绘制算法
The system SHALL use Bezier curves for smooth trail rendering.

**Changes**:
- 使用 quadraticCurveTo 绘制圆滑曲线
- 计算控制点实现平滑过渡
- 移除点标记绘制

### Requirement: 爱心识别
The system SHALL detect heart shape from user drawing trajectory.

**Changes**:
- 分析轨迹点的几何特征
- 检测爱心形状的关键特征点
- 计算与标准爱心的匹配度

## REMOVED Requirements
- 无
