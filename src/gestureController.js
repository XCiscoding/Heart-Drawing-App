/**
 * 手势控制器模块
 * 
 * 功能说明：
 * 处理双指手势识别，实现3D爱心的缩放和旋转控制。
 * 
 * @author 画爱心项目组
 * @version 1.0.0
 */

export class GestureController {
  constructor(onScaleChange, onRotationChange) {
    this.onScaleChange = onScaleChange;
    this.onRotationChange = onRotationChange;
    
    // 缩放状态
    this.currentScale = 1.0;
    this.targetScale = 1.0;
    this.scaleSmoothFactor = 0.15;
    
    // 旋转状态
    this.targetRotationX = 0;
    this.targetRotationY = 0;
    
    // 手势状态
    this.lastDistance = null;
    this.lastCenter = null;
    this.isActive = false;
    
    // 防抖
    this.lastUpdateTime = 0;
    this.updateInterval = 16; // ~60fps
  }

  processHands(multiHandLandmarks) {
    if (!multiHandLandmarks?.length) {
      this.reset();
      return;
    }

    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) return;
    this.lastUpdateTime = now;

    const hand = multiHandLandmarks[0];
    const thumb = hand[4];
    const index = hand[8];

    if (!thumb || !index) {
      this.reset();
      return;
    }

    // 计算距离和中心点
    const distance = Math.hypot(thumb.x - index.x, thumb.y - index.y);
    const center = {
      x: (thumb.x + index.x) / 2,
      y: (thumb.y + index.y) / 2
    };

    if (!this.isActive) {
      // 初始化
      this.lastDistance = distance;
      this.lastCenter = center;
      this.isActive = true;
      return;
    }

    // 计算变化量
    const distanceDelta = distance - this.lastDistance;
    const centerDelta = {
      x: center.x - this.lastCenter.x,
      y: center.y - this.lastCenter.y
    };

    // 判断主要手势类型
    const distanceChange = Math.abs(distanceDelta);
    const centerChange = Math.hypot(centerDelta.x, centerDelta.y);

    // 缩放检测：距离变化明显
    if (distanceChange > 0.01) {
      const scaleRatio = distance / this.lastDistance;
      const newScale = this.currentScale * scaleRatio;
      this.targetScale = Math.max(0.25, Math.min(4.0, newScale));
      
      if (this.onScaleChange) {
        this.onScaleChange(this.targetScale);
      }
      
      this.currentScale = this.targetScale;
      this.lastDistance = distance;
    }

    // 旋转检测：位置变化明显且距离变化小
    if (centerChange > 0.005 && distanceChange < 0.01) {
      this.targetRotationY -= centerDelta.x * 3;
      this.targetRotationX += centerDelta.y * 3;
      
      if (this.onRotationChange) {
        this.onRotationChange(this.targetRotationX, this.targetRotationY);
      }
      
      this.lastCenter = center;
    }
  }

  reset() {
    this.isActive = false;
    this.lastDistance = null;
    this.lastCenter = null;
  }

  setCurrentScale(scale) {
    this.currentScale = Math.max(0.25, Math.min(4.0, scale));
    this.targetScale = this.currentScale;
  }

  getCurrentScale() {
    return this.targetScale;
  }

  getCurrentRotation() {
    return { x: this.targetRotationX, y: this.targetRotationY };
  }
}
