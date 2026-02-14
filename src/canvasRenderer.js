export class CanvasRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.trail = [];
    this.maxTrailLength = 200;
    this.canvas.width = 640;
    this.canvas.height = 480;
    this.isAnimating = false;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  addTrailPoint(point) {
    if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
      return;
    }

    const canvasX = (1 - point.x) * this.canvas.width;
    const canvasY = point.y * this.canvas.height;

    this.trail.push({
      x: canvasX,
      y: canvasY,
      timestamp: Date.now()
    });

    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
  }

  clearTrail() {
    this.trail = [];
  }

  drawSmoothTrail(trailData = null) {
    const trail = trailData || this.trail;
    
    if (trail.length < 3) {
      return;
    }

    this.ctx.save();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    for (let i = 2; i < trail.length; i++) {
      const point = trail[i];
      const prevPoint = trail[i - 1];
      const prevPrevPoint = trail[i - 2];
      
      if (!point || !prevPoint || !prevPrevPoint) continue;
      
      const cpX = (prevPrevPoint.x + prevPoint.x) / 2;
      const cpY = (prevPrevPoint.y + prevPoint.y) / 2;

      this.ctx.strokeStyle = `rgba(255, 107, 107, 0.9)`;
      this.ctx.lineWidth = 6;
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = `rgba(255, 107, 107, 0.6)`;

      this.ctx.beginPath();
      this.ctx.moveTo(prevPrevPoint.x, prevPrevPoint.y);
      this.ctx.quadraticCurveTo(cpX, cpY, prevPoint.x, prevPoint.y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawFingerIndicator(point) {
    if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
      return;
    }

    const x = (1 - point.x) * this.canvas.width;
    const y = point.y * this.canvas.height;

    this.ctx.save();
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, 12, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 107, 107, 0.15)';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(x, y, 8, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 107, 107, 0.4)';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(x, y, 5, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 107, 107, 0.9)';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#ff6b6b';
    this.ctx.fill();

    this.ctx.restore();
  }

  // 基于用户轨迹绘制填充的爱心形状 - 优化版本
  drawHeartFromTrail(trailData, fillProgress = 0) {
    if (trailData.length < 10) return;

    this.ctx.save();

    // 计算轨迹的中心点和边界框
    let centerX = 0, centerY = 0;
    trailData.forEach(p => {
      centerX += p.x;
      centerY += p.y;
    });
    centerX /= trailData.length;
    centerY /= trailData.length;

    // 找到最上、最下、最左、最右的点
    let topY = Infinity, bottomY = -Infinity;
    let leftX = Infinity, rightX = -Infinity;
    let topPoint = null, bottomPoint = null;
    let leftPoint = null, rightPoint = null;

    trailData.forEach(p => {
      if (p.y < topY) { topY = p.y; topPoint = p; }
      if (p.y > bottomY) { bottomY = p.y; bottomPoint = p; }
      if (p.x < leftX) { leftX = p.x; leftPoint = p; }
      if (p.x > rightX) { rightX = p.x; rightPoint = p; }
    });

    const width = rightX - leftX;
    const height = bottomY - topY;

    // 创建渐变填充 - 从中心向外
    const gradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, Math.max(width, height) * 0.8
    );
    gradient.addColorStop(0, '#ff9999');
    gradient.addColorStop(0.4, '#ff6b6b');
    gradient.addColorStop(0.8, '#ee5a5a');
    gradient.addColorStop(1, '#d64545');

    // 简化轨迹点
    const simplifiedPoints = this.simplifyAndSmoothTrail(trailData, 30);
    
    if (simplifiedPoints.length > 2) {
      this.ctx.beginPath();
      
      // 使用更平滑的曲线连接
      this.ctx.moveTo(simplifiedPoints[0].x, simplifiedPoints[0].y);
      
      for (let i = 1; i < simplifiedPoints.length - 1; i++) {
        const prev = simplifiedPoints[i - 1];
        const curr = simplifiedPoints[i];
        const next = simplifiedPoints[i + 1];
        
        // 计算控制点 - 使用当前点和前后点的中点
        const cpX = (prev.x + next.x) / 2;
        const cpY = (prev.y + next.y) / 2;
        
        this.ctx.quadraticCurveTo(curr.x, curr.y, (curr.x + next.x) / 2, (curr.y + next.y) / 2);
      }
      
      // 连接最后几个点到起点
      const last = simplifiedPoints[simplifiedPoints.length - 1];
      const first = simplifiedPoints[0];
      const second = simplifiedPoints[1];
      
      this.ctx.quadraticCurveTo(last.x, last.y, (last.x + first.x) / 2, (last.y + first.y) / 2);
      this.ctx.quadraticCurveTo(first.x, first.y, (first.x + second.x) / 2, (first.y + second.y) / 2);
      
      this.ctx.closePath();

      // 填充 - 完全不透明
      this.ctx.fillStyle = gradient;
      this.ctx.globalAlpha = fillProgress;
      this.ctx.fill();

      // 描边
      this.ctx.strokeStyle = '#ff4444';
      this.ctx.lineWidth = 4;
      this.ctx.globalAlpha = 0.9;
      this.ctx.stroke();

      // 添加内发光效果
      if (fillProgress > 0.5) {
        this.ctx.shadowBlur = 30 * fillProgress;
        this.ctx.shadowColor = 'rgba(255, 107, 107, 0.5)';
        this.ctx.stroke();
      }
    }

    this.ctx.restore();
  }

  // 简化和平滑轨迹
  simplifyAndSmoothTrail(trail, targetPoints) {
    if (trail.length <= targetPoints) {
      // 如果点数不够，使用所有点
      return [...trail];
    }
    
    const result = [];
    const step = trail.length / targetPoints;
    
    for (let i = 0; i < targetPoints; i++) {
      const index = Math.floor(i * step);
      // 添加一点随机微调，让形状更自然
      const point = trail[index];
      result.push({
        x: point.x,
        y: point.y
      });
    }
    
    return result;
  }

  // 播放基于轨迹的爱心填充动画
  async playHeartAnimation(trailData) {
    this.isAnimating = true;
    
    return new Promise((resolve) => {
      let progress = 0;
      const duration = 2500; // 稍微延长动画时间
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        progress = Math.min(elapsed / duration, 1);
        
        // 使用更平滑的缓动
        const easeProgress = this.easeOutCubic(progress);
        
        this.clear();
        
        // 绘制定格的轨迹（淡出）
        if (progress < 0.7) {
          this.ctx.save();
          this.ctx.globalAlpha = 1 - (progress / 0.7) * 0.8;
          this.drawSmoothTrail(trailData);
          this.ctx.restore();
        }
        
        // 绘制基于轨迹的填充爱心
        this.drawHeartFromTrail(trailData, easeProgress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // 动画结束后再显示一会儿
          setTimeout(() => {
            this.isAnimating = false;
            resolve();
          }, 500);
        }
      };

      animate();
    });
  }

  // 更平滑的缓动函数
  easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  render(indexFingerTip) {
    if (this.isAnimating) return;
    
    this.clear();

    if (indexFingerTip) {
      this.addTrailPoint(indexFingerTip);
      this.drawFingerIndicator(indexFingerTip);
    }

    this.drawSmoothTrail();

    const now = Date.now();
    this.trail = this.trail.filter(point => {
      const age = (now - point.timestamp) / 1000;
      return age < 2.0;
    });
  }
}
