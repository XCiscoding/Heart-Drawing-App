export class GestureController {
  constructor(onScaleChange, onRotationChange) {
    this.onScaleChange = onScaleChange;
    this.onRotationChange = onRotationChange;
    this.currentScale = 1.0;
    this.targetScale = 1.0;
    this.baseDistance = null;
    this.isPinching = false;
    this.lastPinchTime = 0;
    
    // 旋转控制
    this.lastFingerCenter = null;
    this.currentRotationX = 0;
    this.currentRotationY = 0;
    this.targetRotationX = 0;
    this.targetRotationY = 0;
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
      this.detectRotationGesture(thumb, index);
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

    // 防止过于频繁的更新（至少间隔100ms，让缩放更稳定）
    if (now - this.lastPinchTime < 100) {
      return;
    }
    this.lastPinchTime = now;

    // 计算缩放比例
    if (this.baseDistance && this.baseDistance > 0) {
      const scaleRatio = distance / this.baseDistance;
      
      // 计算新的目标缩放值（使用更平滑的过渡）
      const newTargetScale = this.currentScale * scaleRatio;
      
      // 限制缩放范围 0.5 - 3.0
      this.targetScale = Math.max(0.5, Math.min(3.0, newTargetScale));
      
      // 回调通知缩放变化
      if (this.onScaleChange) {
        this.onScaleChange(this.targetScale);
      }
      
      // 更新基准距离，使缩放更灵敏但稳定
      this.baseDistance = distance * 0.7 + this.baseDistance * 0.3;
    }
  }

  detectRotationGesture(thumb, index) {
    // 计算两指中心点
    const centerX = (thumb.x + index.x) / 2;
    const centerY = (thumb.y + index.y) / 2;
    
    // 如果是第一次检测，记录初始位置
    if (!this.lastFingerCenter) {
      this.lastFingerCenter = { x: centerX, y: centerY };
      return;
    }
    
    // 计算手指移动差值
    const deltaX = centerX - this.lastFingerCenter.x;
    const deltaY = centerY - this.lastFingerCenter.y;
    
    // 只有当移动足够大时才更新旋转（防止抖动）
    if (Math.abs(deltaX) > 0.005 || Math.abs(deltaY) > 0.005) {
      // 手指水平移动控制Y轴旋转，垂直移动控制X轴旋转
      // 乘以系数控制旋转灵敏度
      this.targetRotationY += deltaX * 3; // 水平移动 -> Y轴旋转
      this.targetRotationX -= deltaY * 3; // 垂直移动 -> X轴旋转（反向更自然）
      
      // 限制X轴旋转范围（防止翻转）
      this.targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotationX));
      
      // 回调通知旋转变化
      if (this.onRotationChange) {
        this.onRotationChange(this.targetRotationX, this.targetRotationY);
      }
      
      // 更新上一次的位置
      this.lastFingerCenter = { x: centerX, y: centerY };
    }
  }

  resetPinch() {
    this.isPinching = false;
    this.baseDistance = null;
    this.lastFingerCenter = null;
  }

  setCurrentScale(scale) {
    this.currentScale = Math.max(0.5, Math.min(3.0, scale));
    this.targetScale = this.currentScale;
  }

  getCurrentScale() {
    return this.targetScale;
  }
  
  getCurrentRotation() {
    return { x: this.targetRotationX, y: this.targetRotationY };
  }
}
