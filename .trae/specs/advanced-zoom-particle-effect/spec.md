# 高级缩放与粒子特效规格

## Why
当前3D爱心的缩放功能较为简单，用户希望获得更自然、更有科技感的交互体验。通过非线性缩放速度、扩展缩放范围，以及在超放大时显示粒子组成效果，可以显著提升视觉冲击力。

## What Changes
- **非线性缩放速度**：缩放速度随时间递增，先慢后快
- **扩展缩放范围**：0.25x - 4.0x（原0.5x - 3.0x）
- **粒子化特效**：当缩放超过3.0x时，爱心渐变为纯粒子效果
- **持续手势响应**：手指张开/闭合持续触发缩放，而非单次触发

## Impact
- Affected specs: 手势控制、3D渲染、粒子系统
- Affected code: gestureController.js, holographicHeart3D.js

## ADDED Requirements

### Requirement: 非线性缩放速度
The system SHALL implement non-linear zoom speed that accelerates over time.

#### Scenario: 持续张开手指
- **GIVEN** 用户双指张开超过阈值
- **WHEN** 保持张开状态
- **THEN** 缩放速度从慢到快递增
- **AND** 使用 ease-out 曲线实现自然加速

### Requirement: 扩展缩放范围
The system SHALL support zoom range from 0.25x to 4.0x.

#### Scenario: 最小缩放
- **WHEN** 双指捏合到最小
- **THEN** 爱心缩小至0.25倍

#### Scenario: 最大缩放
- **WHEN** 双指张开到最大
- **THEN** 爱心放大至4.0倍

### Requirement: 粒子化过渡特效
The system SHALL transition heart to pure particle composition when zoom exceeds 3.0x.

#### Scenario: 超放大过渡
- **GIVEN** 当前缩放为3.0x
- **WHEN** 继续放大至3.0x-4.0x区间
- **THEN** 爱心线框和填充渐隐
- **AND** 粒子密度和亮度增加
- **AND** 粒子形成爱心轮廓

#### Scenario: 缩小恢复
- **GIVEN** 当前为粒子化状态
- **WHEN** 缩放回3.0x以下
- **THEN** 爱心线框和填充渐显
- **AND** 粒子恢复正常状态

### Requirement: 持续手势缩放
The system SHALL support continuous zoom while gesture is maintained.

#### Scenario: 持续张开
- **GIVEN** 用户保持双指张开
- **WHEN** 不移动手指
- **THEN** 爱心持续放大直到达到上限

#### Scenario: 持续闭合
- **GIVEN** 用户保持双指捏合
- **WHEN** 不移动手指
- **THEN** 爱心持续缩小直到达到下限

## MODIFIED Requirements

### Requirement: 缩放速度算法
**原要求**: 线性缩放，固定比例
**修改为**: 非线性加速，使用 ease-out 曲线
**公式**: `speed = baseSpeed + (maxSpeed - baseSpeed) * (1 - e^(-time/constant))`

### Requirement: 缩放范围限制
**原要求**: 0.5x - 3.0x
**修改为**: 0.25x - 4.0x
**理由**: 提供更广阔的观察视角和细节展示
