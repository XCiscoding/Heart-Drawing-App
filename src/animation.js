export class Animation {
  constructor(canvasRenderer) {
    this.renderer = canvasRenderer;
    this.isAnimating = false;
    this.animationId = null;
    this.particles = [];
  }

  async playHeartAnimation(centerX, centerY) {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    const duration = 2000;
    const startTime = Date.now();

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeProgress = this.easeOutElastic(progress);
        
        this.renderer.clear();
        this.renderer.drawHeartAnimation(centerX, centerY, easeProgress);
        this.renderParticles();

        if (progress < 1) {
          this.animationId = requestAnimationFrame(animate);
        } else {
          this.isAnimating = false;
          resolve();
        }
      };

      this.createParticles(centerX, centerY);
      animate();
    });
  }

  createParticles(centerX, centerY) {
    this.particles = [];
    const colors = ['#ff6b6b', '#ff8e8e', '#ffb4b4', '#ffd93d', '#ffffff'];
    
    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 / 50) * i + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.01 + Math.random() * 0.02,
        size: 2 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  renderParticles() {
    const ctx = this.renderer.ctx;
    
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      p.vx *= 0.98;
      p.vy *= 0.98;

      if (p.life > 0) {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return true;
      }
      return false;
    });
  }

  easeOutElastic(x) {
    const c4 = (2 * Math.PI) / 3;
    
    if (x === 0) return 0;
    if (x === 1) return 1;
    
    return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  }

  easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isAnimating = false;
    this.particles = [];
  }
}
