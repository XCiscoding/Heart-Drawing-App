export class GestureController {
  constructor(onScaleChange) {
    this.onScaleChange = onScaleChange;
    this.currentScale = 1.0;
    this.baseDistance = null;
    this.isPinching = false;
    this.lastPinchTime = 0;
  }

  // 处理手势数据
  processHands(multiHandLandmarks) {
    if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
      this.resetPinch();
      return;
    }

    // 检测双指手势（需要至少一只手）
    const landmarks = multiHandLandmarks[0];
    
    // 检测拇指(4)和食指(8)的位置
    const thumb = landmarks[4];
    const index = landmarks[8];

    if (thumb && index) {
      this.detectPinchGesture(thumb, index);
    }
  }

  detectPinchGesture(thumb, index) {
    // 计算两指尖的距离
    const distance = Math.sqrt(
      Math.pow(thumb.x - index.x, 2) +
      Math.pow(thumb.y - index.y, 2)
    );

    const now = Date.now();

    // 如果刚开始捏合，记录基准距离
    if (!this.isPinching) {
      this.baseDistance = distance;
      this.isPinching = true;
      this.lastPinchTime = now;
      return;
    }

    // 防止过于频繁的更新（至少间隔50ms）
    if (now - this.lastPinchTime < 50) {
      return;
    }
    this.lastPinchTime = now;

    // 计算缩放比例
    if (this.baseDistance && this.baseDistance > 0) {
      const scaleRatio = distance / this.baseDistance;
      
      // 应用缩放（基于当前缩放比例进行调整）
      const newScale = this.currentScale * scaleRatio;
      
      // 限制缩放范围 0.5 - 3.0
      const clampedScale = Math.max(0.5, Math.min(3.0, newScale));
      
      // 如果缩放变化足够大，才更新
      if (Math.abs(clampedScale - this.currentScale) > 0.05) {
        this.currentScale = clampedScale;
        
        // 回调通知缩放变化
        if (this.onScaleChange) {
          this.onScaleChange(this.currentScale);
        }
        
        // 更新基准距离，使缩放更灵敏
        this.baseDistance = distance;
      }
    }
  }

  resetPinch() {
    this.isPinching = false;
    this.baseDistance = null;
  }

  setCurrentScale(scale) {
    this.currentScale = Math.max(0.5, Math.min(3.0, scale));
  }

  getCurrentScale() {
    return this.currentScale;
  }
}
