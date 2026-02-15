/**
 * 爱心形状检测器模块
 *
 * 功能说明：
 * 用于检测用户绘制的轨迹是否符合爱心形状。
 * 使用宽松的几何特征匹配算法，允许各种变形的爱心。
 *
 * @author 画爱心项目组
 * @version 1.0.0
 */

/**
 * 爱心检测器类
 *
 * 提供宽松的爱心形状检测，允许：
 * - 不太完美的闭合
 * - 稍微不对称的形状
 * - 各种大小的爱心
 */
export class HeartDetector {
  /**
   * 构造函数 - 初始化检测参数
   */
  constructor() {
    this.minPoints = 12;              // 最小轨迹点数（降低）
    this.maxPoints = 400;             // 最大轨迹点数（增加）
    this.cooldown = false;            // 冷却状态标志
    this.cooldownDuration = 1500;     // 冷却时间（毫秒）
  }

  /**
   * 检测轨迹是否为爱心形状（宽松版）
   *
   * 核心思路：
   * 1. 轨迹必须是竖向的（高>宽）
   * 2. 上半部分有两个高点（左右各一）
   * 3. 下半部分收窄（底部尖）
   * 4. 起点和终点比较接近（大致闭合）
   *
   * @param {Array} trail - 用户绘制的轨迹点数组，每个点为{x, y}
   * @returns {boolean} 是否为爱心形状
   */
  detectHeart(trail) {
    // 如果处于冷却状态，直接返回false
    if (this.cooldown) return false;

    // 检查轨迹点数
    if (trail.length < this.minPoints || trail.length > this.maxPoints) {
      return false;
    }

    const points = trail;

    // 1. 计算边界框
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // 2. 尺寸检查（更宽松）
    if (width < 0.06 || height < 0.08) return false;
    if (width > 0.9 || height > 0.95) return false;

    // 3. 宽高比检查（爱心通常是竖向的）
    const aspectRatio = height / width;
    if (aspectRatio < 0.8 || aspectRatio > 3.0) return false;

    // 4. 检查上半部分是否有两个高点（爱心顶部两个圆弧）
    // 找到最上面的点
    let topY = minY;
    
    // 检查上半部分左右分布
    let leftTopCount = 0;
    let rightTopCount = 0;
    
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      // 上半部分（y在顶部40%区域）
      if (p.y < centerY - height * 0.1) {
        if (p.x < centerX) leftTopCount++;
        else rightTopCount++;
      }
    }

    // 左右两侧都应该有一些点（不要求对称）
    if (leftTopCount < 3 || rightTopCount < 3) return false;

    // 5. 检查下半部分是否收窄（爱心底部）
    let bottomMinX = 1, bottomMaxX = 0;
    let bottomPointCount = 0;
    
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      // 下半部分（y在底部40%区域）
      if (p.y > centerY + height * 0.1) {
        bottomPointCount++;
        if (p.x < bottomMinX) bottomMinX = p.x;
        if (p.x > bottomMaxX) bottomMaxX = p.x;
      }
    }

    if (bottomPointCount < 3) return false;

    const bottomWidth = bottomMaxX - bottomMinX;
    // 底部宽度应该比整体宽度窄（放宽到90%）
    if (bottomWidth > width * 0.9) return false;

    // 6. 检查轨迹是否大致闭合（起点和终点接近）
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const closureDistance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
      Math.pow(endPoint.y - startPoint.y, 2)
    );

    // 闭合距离应该小于轨迹宽度的50%（更宽松）
    if (closureDistance > width * 0.5) return false;

    // 所有检查通过，认为是爱心
    this.startCooldown();
    return true;
  }

  /**
   * 启动冷却
   *
   * 防止爱心检测在短时间内重复触发
   */
  startCooldown() {
    this.cooldown = true;
    setTimeout(() => {
      this.cooldown = false;
    }, this.cooldownDuration);
  }

  /**
   * 重置检测器
   *
   * 清除冷却状态，可以立即进行下一次检测
   */
  reset() {
    this.cooldown = false;
  }
}
