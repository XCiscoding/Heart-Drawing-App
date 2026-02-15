import './style.css';
import { HandTracker } from './handTracker.js';
import { HolographicHeart3D } from './holographicHeart3D.js';
import { GestureController } from './gestureController.js';
import { TechEffects } from './techEffects.js';

class HolographicHeartApp {
  constructor() {
    this.videoElement = document.getElementById('video');
    this.canvasElement = document.getElementById('canvas');
    this.loadingElement = document.getElementById('loading');
    this.loadingText = document.getElementById('loading-text');
    this.statusText = document.getElementById('status-text');

    // 创建两个canvas层
    this.setupCanvases();

    // 初始化各个模块
    this.heart3D = null;
    this.gestureController = null;
    this.techEffects = null;
    this.handTracker = null;

    // 状态
    this.isDrawing = true;
    this.trail = [];
    this.lastPoint = null;
    this.hasDetectedHeart = false;

    this.init();
  }

  setupCanvases() {
    // 创建3D渲染canvas（上层）
    this.canvas3D = document.createElement('canvas');
    this.canvas3D.id = 'canvas-3d';
    this.canvas3D.width = 640;
    this.canvas3D.height = 480;
    this.canvas3D.style.position = 'absolute';
    this.canvas3D.style.top = '0';
    this.canvas3D.style.left = '0';
    this.canvas3D.style.zIndex = '3';
    this.canvas3D.style.display = 'none';

    // 创建2D特效canvas（中层）
    this.canvas2D = document.createElement('canvas');
    this.canvas2D.id = 'canvas-2d';
    this.canvas2D.width = 640;
    this.canvas2D.height = 480;
    this.canvas2D.style.position = 'absolute';
    this.canvas2D.style.top = '0';
    this.canvas2D.style.left = '0';
    this.canvas2D.style.zIndex = '2';

    // 添加到容器
    const container = document.querySelector('.canvas-container');
    container.appendChild(this.canvas3D);
    container.appendChild(this.canvas2D);

    // 原canvas用于绘制轨迹（最底层）
    this.canvasElement.style.zIndex = '1';
  }

  async init() {
    try {
      this.updateLoadingText('正在加载模型...');

      // 初始化手势控制器
      this.gestureController = new GestureController(
        (scale) => {
          if (this.heart3D) {
            this.heart3D.setScale(scale);
          }
        },
        (rotX, rotY) => {
          if (this.heart3D) {
            this.heart3D.setRotation(rotX, rotY);
          }
        }
      );

      // 初始化科技特效
      this.techEffects = new TechEffects(this.canvas2D);

      // 初始化手势追踪
      this.handTracker = new HandTracker(this.videoElement, (results) => {
        this.onHandResults(results);
      });

      const initialized = await this.handTracker.initialize();

      if (initialized) {
        this.updateLoadingText('正在启动摄像头...');
        await this.handTracker.start();
        this.loadingElement.classList.add('hidden');
        this.updateStatus('请举起食指画出爱心');

        // 开始渲染循环
        this.startRenderLoop();

        // 开始爱心检测
        this.startHeartDetection();
      } else {
        this.updateLoadingText('启动失败');
        this.updateStatus('启动失败');
      }
    } catch (error) {
      console.error('错误:', error);
      this.updateLoadingText('无法访问摄像头');
      this.updateStatus('无法访问摄像头');
    }
  }

  onHandResults(results) {
    const { indexFingerTip, multiHandLandmarks } = results;

    if (this.isDrawing && !this.hasDetectedHeart) {
      // 绘制模式：追踪食指
      if (indexFingerTip) {
        if (!this.lastPoint ||
            Math.abs(indexFingerTip.x - this.lastPoint.x) > 0.002 ||
            Math.abs(indexFingerTip.y - this.lastPoint.y) > 0.002) {

          this.trail.push(indexFingerTip);
          this.lastPoint = indexFingerTip;

          if (this.trail.length > 100) {
            this.trail.shift();
          }
        }
      } else {
        this.lastPoint = null;
      }
    } else if (this.hasDetectedHeart) {
      // 3D模式：处理双指缩放
      if (multiHandLandmarks && multiHandLandmarks.length > 0) {
        this.gestureController.processHands(multiHandLandmarks);
      }
    }
  }

  detectHeart() {
    if (this.trail.length < 30 || this.hasDetectedHeart) return false;

    const features = this.analyzeTrajectory();
    return this.checkHeartFeatures(features);
  }

  analyzeTrajectory() {
    const points = this.trail;
    const n = points.length;

    let centerX = 0, centerY = 0;
    points.forEach(p => {
      centerX += p.x;
      centerY += p.y;
    });
    centerX /= n;
    centerY /= n;

    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    // 分析方向变化
    let directionChanges = 0;
    let prevDirection = null;

    for (let i = 2; i < points.length; i++) {
      const dx = points[i].x - points[i-2].x;
      const dy = points[i].y - points[i-2].y;
      const direction = Math.atan2(dy, dx);

      if (prevDirection !== null) {
        const change = Math.abs(direction - prevDirection);
        if (change > 0.3) directionChanges++;
      }
      prevDirection = direction;
    }

    // 检测爱心形状特征
    // 1. 检测上半部分是否有两个隆起（爱心顶部）
    let leftBump = false;
    let rightBump = false;
    
    // 找到上半部分的点
    const upperPoints = points.filter(p => p.y < centerY);
    if (upperPoints.length >= 8) {
      // 检查左侧是否有隆起
      const leftUpper = upperPoints.filter(p => p.x < centerX - 0.05);
      // 检查右侧是否有隆起
      const rightUpper = upperPoints.filter(p => p.x > centerX + 0.05);
      
      leftBump = leftUpper.length >= 3;
      rightBump = rightUpper.length >= 3;
    }
    
    // 2. 检测下半部分是否收窄（爱心底部）
    let hasBottomPoint = false;
    const lowerPoints = points.filter(p => p.y > centerY);
    if (lowerPoints.length >= 5) {
      // 下半部分应该比上半部分窄
      const lowerWidth = Math.max(...lowerPoints.map(p => p.x)) - Math.min(...lowerPoints.map(p => p.x));
      const upperWidth = maxX - minX;
      hasBottomPoint = lowerWidth < upperWidth * 0.8;
    }

    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const closureDistance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
      Math.pow(endPoint.y - startPoint.y, 2)
    );

    return {
      centerX, centerY,
      width: maxX - minX,
      height: maxY - minY,
      directionChanges,
      closureDistance,
      aspectRatio: (maxX - minX) / (maxY - minY + 0.001),
      leftBump,
      rightBump,
      hasBottomPoint,
      hasTwoBumps: leftBump && rightBump
    };
  }

  checkHeartFeatures(features) {
    // 宽高比：爱心通常是竖向略宽
    const aspectRatioOK = features.aspectRatio > 0.5 && features.aspectRatio < 2.0;
    
    // 需要一定的方向变化（有曲线）
    const hasEnoughCurves = features.directionChanges >= 2;
    
    // 轨迹要接近闭合
    const isClosed = features.closureDistance < 0.25;
    
    // 合理的尺寸
    const reasonableSize = features.width > 0.1 && features.height > 0.12;
    
    // 爱心核心特征：顶部两个隆起 + 底部收窄
    const hasHeartShape = features.hasTwoBumps && features.hasBottomPoint;

    return aspectRatioOK && hasEnoughCurves && isClosed && reasonableSize && hasHeartShape;
  }

  startHeartDetection() {
    setInterval(() => {
      if (!this.hasDetectedHeart && this.trail.length > 30) {
        const isHeart = this.detectHeart();
        if (isHeart) {
          this.onHeartDetected();
        }
      }
    }, 300);
  }

  async onHeartDetected() {
    this.hasDetectedHeart = true;
    this.isDrawing = false;
    this.updateStatus('检测到爱心！生成3D全息投影...');

    // 隐藏原canvas，显示3D canvas
    this.canvasElement.style.display = 'none';
    this.canvas3D.style.display = 'block';

    // 初始化3D爱心，传入用户画出的轨迹点
    this.heart3D = new HolographicHeart3D(this.canvas3D, this.trail);

    // 设置初始缩放
    const currentScale = this.gestureController.getCurrentScale();
    this.heart3D.setScale(currentScale);

    this.updateStatus('伸出拇指和食指捏合来缩放爱心');

    // 添加点击重置功能
    setTimeout(() => {
      this.canvas3D.style.cursor = 'pointer';
      this.canvas3D.addEventListener('click', this.handleCanvasClick, { once: true });
    }, 2000);
  }

  handleCanvasClick = () => {
    this.reset();
  }

  reset() {
    this.hasDetectedHeart = false;
    this.isDrawing = true;
    this.trail = [];
    this.lastPoint = null;

    // 重置手势控制器
    this.gestureController.setCurrentScale(1.0);

    // 隐藏3D canvas，显示原canvas
    this.canvas3D.style.display = 'none';
    this.canvasElement.style.display = 'block';
    this.canvas3D.style.cursor = 'default';

    // 清除3D场景
    if (this.heart3D) {
      this.heart3D.hide();
      this.heart3D = null;
    }

    this.updateStatus('请举起食指画出爱心');
  }

  startRenderLoop() {
    const render = () => {
      if (this.isDrawing) {
        // 绘制模式：绘制轨迹
        this.drawTrail();
      } else if (this.hasDetectedHeart && this.heart3D) {
        // 3D模式：渲染全息爱心
        this.heart3D.render();

        // 渲染科技特效
        const ctx = this.canvas2D.getContext('2d');
        ctx.clearRect(0, 0, this.canvas2D.width, this.canvas2D.height);
        this.techEffects.render(this.gestureController.getCurrentScale());
      }

      requestAnimationFrame(render);
    };
    render();
  }

  drawTrail() {
    const ctx = this.canvasElement.getContext('2d');
    ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    if (this.trail.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255, 120, 120, 0.95)';
    ctx.lineWidth = 5;
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(255, 120, 120, 0.5)';

    ctx.beginPath();
    const firstPoint = this.trail[0];
    ctx.moveTo((1 - firstPoint.x) * this.canvasElement.width, firstPoint.y * this.canvasElement.height);

    for (let i = 1; i < this.trail.length; i++) {
      const point = this.trail[i];
      ctx.lineTo((1 - point.x) * this.canvasElement.width, point.y * this.canvasElement.height);
    }

    ctx.stroke();
    ctx.restore();

    // 绘制手指指示器
    const lastPoint = this.trail[this.trail.length - 1];
    if (lastPoint) {
      const x = (1 - lastPoint.x) * this.canvasElement.width;
      const y = lastPoint.y * this.canvasElement.height;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 120, 120, 0.95)';
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#ff7878';
      ctx.fill();
      ctx.restore();
    }
  }

  updateLoadingText(text) {
    this.loadingText.textContent = text;
  }

  updateStatus(text) {
    this.statusText.textContent = text;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new HolographicHeartApp();
});
