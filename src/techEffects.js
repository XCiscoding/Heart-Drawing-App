/**
 * 科技风格UI特效模块
 *
 * 功能说明：
 * 用于在2D画布上绘制科技风格的UI效果。
 *
 * 主要功能：
 * - 绘制简约边框
 * - 显示状态信息（如缩放比例）
 *
 * @author 画爱心项目组
 * @version 1.0.0
 */

/**
 * 科技特效渲染器类
 *
 * 提供科技风格的2D UI效果渲染：
 * - 简约边框
 * - 状态信息显示
 */
export class TechEffects {
  /**
   * 构造函数
   *
   * @param {HTMLCanvasElement} canvas - 2D渲染画布
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // 扫描线位置（当前未使用，预留）
    this.scanLineY = 0;
  }

  /**
   * 绘制简约边框
   *
   * 在画布边缘绘制一个浅红色的半透明矩形边框
   */
  drawSimpleBorder() {
    const ctx = this.ctx;
    const padding = 10; // 内边距

    // 设置边框样式
    ctx.strokeStyle = 'rgba(255, 120, 120, 0.3)'; // 浅红色，30%透明度
    ctx.lineWidth = 1;

    // 绘制矩形边框
    ctx.strokeRect(padding, padding, this.width - padding * 2, this.height - padding * 2);
  }

  /**
   * 绘制状态信息
   *
   * 在画布左上角显示当前缩放比例
   *
   * @param {number} scale - 当前缩放值（默认1.0）
   */
  drawStatusInfo(scale = 1.0) {
    const ctx = this.ctx;

    // 设置文字样式
    ctx.font = '12px monospace'; // 等宽字体
    ctx.fillStyle = 'rgba(255, 120, 120, 0.6)'; // 浅红色，60%透明度

    // 绘制缩放比例文字
    ctx.fillText(`SCALE: ${scale.toFixed(2)}x`, 20, 35);
  }

  /**
   * 渲染所有效果
   *
   * 主渲染入口，调用所有绘制方法
   *
   * @param {number} scale - 当前缩放值，传递给状态信息显示
   */
  render(scale = 1.0) {
    // 绘制简约边框
    this.drawSimpleBorder();

    // 绘制状态信息
    this.drawStatusInfo(scale);
  }
}
