export class TechEffects {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    
    // 扫描线位置
    this.scanLineY = 0;
  }

  // 绘制简约边框
  drawSimpleBorder() {
    const ctx = this.ctx;
    const padding = 10;
    
    ctx.strokeStyle = 'rgba(255, 120, 120, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, this.width - padding * 2, this.height - padding * 2);
  }

  // 绘制状态信息
  drawStatusInfo(scale = 1.0) {
    const ctx = this.ctx;
    
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(255, 120, 120, 0.6)';
    
    // 缩放比例
    ctx.fillText(`SCALE: ${scale.toFixed(2)}x`, 20, 35);
  }

  // 渲染所有效果
  render(scale = 1.0) {
    // 绘制简约边框
    this.drawSimpleBorder();
    
    // 绘制状态信息
    this.drawStatusInfo(scale);
  }
}
