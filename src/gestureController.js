/**
 * 手势控制器模块
 * 
 * 功能说明：
 * 处理双指手势识别，实现3D爱心的缩放和旋转控制。
 * 
 * 主要功能：
 * - 双指捏合检测：计算拇指和食指的距离变化，控制爱心缩放
 * - 双指移动检测：计算手指中心点移动，控制爱心旋转
 * - 防抖处理：防止过于频繁的更新，使控制更稳定
 * 
 * 手势映射：
 * - 拇指+食指捏合/张开：缩放爱心
 * - 双指水平移动：Y轴旋转（左右转）
 * - 双指垂直移动：X轴旋转（上下转）
 * 
 * @author 画爱心项目组
 * @version 1.0.0
 */

/**
 * 手势控制器类
 * 
 * 管理双指手势的检测和处理，包括：
 * - 捏合手势（缩放控制）
 * - 移动手势（旋转控制）
 */
export class GestureController {
  /**
   * 构造函数
   * 
   * @param {Function} onScaleChange - 缩放变化回调函数，参数为新的缩放值
   * @param {Function} onRotationChange - 旋转变化回调函数，参数为旋转角度(x, y)
   */
  constructor(onScaleChange, onRotationChange) {
    // 回调函数
    this.onScaleChange = onScaleChange;
    this.onRotationChange = onRotationChange;
    
    // 缩放控制状态
    this.currentScale = 1.0;      // 当前缩放值
    this.targetScale = 1.0;       // 目标缩放值（用于平滑过渡）
    this.baseDistance = null;     // 捏合基准距离（初始双指距离）
    this.isPinching = false;      // 是否正在捏合
    this.lastPinchTime = 0;       // 上次捏合更新时间（防抖用）
    
    // 旋转控制状态
    this.lastFingerCenter = null; // 上次双指中心点位置
    this.currentRotationX = 0;    // 当前X轴旋转角度
    this.currentRotationY = 0;    // 当前Y轴旋转角度
    this.targetRotationX = 0;     // 目标X轴旋转角度
    this.targetRotationY = 0;     // 目标Y轴旋转角度
  }

  /**
   * 处理手势数据入口
   * 
   * 接收MediaPipe检测到的手部关键点，解析双指手势
   * 
   * @param {Array} multiHandLandmarks - 多只手的所有关键点数组
   *        每个手包含21个关键点，索引4是拇指，索引8是食指
   */
  processHands(multiHandLandmarks) {
    // 没有检测到手，重置状态
    if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
      this.resetPinch();
      return;
    }

    // 获取第一只手的关键点（目前只处理单手）
    const landmarks = multiHandLandmarks[0];
    
    // 获取拇指(索引4)和食指(索引8)的位置
    const thumb = landmarks[4];
    const index = landmarks[8];

    // 两个手指都存在时，处理手势
    if (thumb && index) {
      this.detectPinchGesture(thumb, index);    // 检测捏合（缩放）
      this.detectRotationGesture(thumb, index); // 检测移动（旋转）
    }
  }

  /**
   * 检测捏合手势（缩放控制）
   * 
   * 原理：
   * 1. 记录初始双指距离作为基准
   * 2. 实时计算当前双指距离
   * 3. 当前距离 / 基准距离 = 缩放比例
   * 4. 应用防抖，避免过于频繁的更新
   * 
   * @param {Object} thumb - 拇指关键点 {x, y}
   * @param {Object} index - 食指关键点 {x, y}
   */
  detectPinchGesture(thumb, index) {
    // 计算两指尖的欧几里得距离
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

    // 防抖处理：防止过于频繁的更新（至少间隔100ms）
    if (now - this.lastPinchTime < 100) {
      return;
    }
    this.lastPinchTime = now;

    // 计算缩放比例
    if (this.baseDistance && this.baseDistance > 0) {
      // 缩放比例 = 当前距离 / 基准距离
      const scaleRatio = distance / this.baseDistance;
      
      // 计算新的目标缩放值
      const newTargetScale = this.currentScale * scaleRatio;
      
      // 限制缩放范围 0.5x - 3.0x
      this.targetScale = Math.max(0.3, Math.min(6.0, newTargetScale));
      
      // 回调通知缩放变化，更新3D爱心大小
      if (this.onScaleChange) {
        this.onScaleChange(this.targetScale);
      }
      
      // 更新基准距离（使用加权平均，使缩放更稳定）
      // 70%当前距离 + 30%原基准距离
      this.baseDistance = distance * 0.8 + this.baseDistance * 0.2;
    }
  }

  /**
   * 检测旋转手势（旋转控制）
   * 
   * 原理：
   * 1. 计算双指中心点
   * 2. 比较当前中心点与上次中心点的差值
   * 3. 水平差值控制Y轴旋转，垂直差值控制X轴旋转
   * 4. 添加阈值防止微小抖动
   * 
   * 映射关系（已镜像翻转）：
   * - 手指向右移动 → 爱心向左旋转（Y轴负方向）
   * - 手指向上移动 → 爱心向下旋转（X轴正方向）
   * 
   * @param {Object} thumb - 拇指关键点 {x, y}
   * @param {Object} index - 食指关键点 {x, y}
   */
  detectRotationGesture(thumb, index) {
    // 计算两指中心点（双指的中间位置）
    const centerX = (thumb.x + index.x) / 2;
    const centerY = (thumb.y + index.y) / 2;
    
    // 如果是第一次检测，记录初始位置
    if (!this.lastFingerCenter) {
      this.lastFingerCenter = { x: centerX, y: centerY };
      return;
    }
    
    // 计算手指移动差值（当前位置 - 上次位置）
    const deltaX = centerX - this.lastFingerCenter.x;
    const deltaY = centerY - this.lastFingerCenter.y;
    
    // 只有当移动足够大时才更新旋转
    // 阈值0.005，平衡灵敏度和稳定性
    if (Math.abs(deltaX) > 0.005 || Math.abs(deltaY) > 0.005) {
      // 手指水平移动控制Y轴旋转，垂直移动控制X轴旋转
      // 乘以系数5控制旋转灵敏度（提高灵敏度）
      // 注意：-= 和 += 实现了镜像翻转效果
      this.targetRotationY -= deltaX * 5; // 水平移动 -> Y轴旋转（镜像翻转，灵敏度5）
      this.targetRotationX += deltaY * 5; // 垂直移动 -> X轴旋转（镜像翻转，灵敏度5）
      
      // 限制X轴旋转范围在 -90° 到 90° 之间（防止翻转过度）
      this.targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotationX));
      
      // 回调通知旋转变化，更新3D爱心旋转角度
      if (this.onRotationChange) {
        this.onRotationChange(this.targetRotationX, this.targetRotationY);
      }
      
      // 更新上一次的位置，用于下次计算差值
      this.lastFingerCenter = { x: centerX, y: centerY };
    }
  }

  /**
   * 重置捏合状态
   * 
   * 当手消失或需要重新开始检测时调用
   */
  resetPinch() {
    this.isPinching = false;
    this.baseDistance = null;
    this.lastFingerCenter = null;
  }

  /**
   * 设置当前缩放值
   * 
   * @param {number} scale - 缩放值（范围0.5-3.0）
   */
  setCurrentScale(scale) {
    this.currentScale = Math.max(0.3, Math.min(3.3, scale));
    this.targetScale = this.currentScale;
  }

  /**
   * 获取当前缩放值
   * 
   * @returns {number} 当前缩放值
   */
  getCurrentScale() {
    return this.targetScale;
  }
  
  /**
   * 获取当前旋转角度
   * 
   * @returns {Object} 旋转角度 {x, y}
   */
  getCurrentRotation() {
    return { x: this.targetRotationX, y: this.targetRotationY };
  }
}
