/**
 * 主应用入口文件
 * 
 * 功能说明：
 * 这是爱心手势交互应用的核心控制器，负责协调所有模块的工作。
 * 主要功能包括：
 * - 初始化摄像头和手势追踪
 * - 处理手指轨迹绘制
 * - 检测爱心形状
 * - 生成3D全息爱心
 * - 处理手势控制（缩放、旋转）
 * 
 * @author 画爱心项目组
 * @version 1.0.0
 */

// 导入样式文件
import './style.css';
// 导入手势追踪模块
import { HandTracker } from './handTracker.js';
// 导入3D爱心渲染模块
import { HolographicHeart3D } from './holographicHeart3D.js';
// 导入手势控制模块（缩放、旋转）
import { GestureController } from './gestureController.js';
// 导入科技特效模块
import { TechEffects } from './techEffects.js';
// 导入爱心检测模块
import { HeartDetector } from './heartDetector.js';

/**
 * 全息爱心应用主类
 * 
 * 负责管理整个应用的生命周期，包括：
 * - 初始化所有模块
 * - 处理手势识别结果
 * - 管理绘制模式和3D模式的切换
 * - 渲染循环控制
 */
class HolographicHeartApp {
  /**
   * 构造函数 - 初始化应用状态和DOM元素
   */
  constructor() {
    // 获取DOM元素 - 视频元素（摄像头）
    this.videoElement = document.getElementById('video');
    // 获取DOM元素 - 2D画布（轨迹绘制层）
    this.canvasElement = document.getElementById('canvas');
    // 获取DOM元素 - 加载提示
    this.loadingElement = document.getElementById('loading');
    // 获取DOM元素 - 加载文字
    this.loadingText = document.getElementById('loading-text');
    // 获取DOM元素 - 状态文字
    this.statusText = document.getElementById('status-text');

    // 创建多层画布架构（3D层、2D特效层、轨迹层）
    this.setupCanvases();

    // 初始化各个模块的引用（将在init中实例化）
    this.heart3D = null;              // 3D爱心渲染器
    this.gestureController = null;    // 手势控制器
    this.techEffects = null;          // 科技特效渲染器
    this.handTracker = null;          // 手势追踪器
    this.heartDetector = null;        // 爱心检测器

    // 应用状态管理
    this.isDrawing = true;            // 是否处于绘制模式
    this.trail = [];                  // 手指轨迹点数组
    this.lastPoint = null;            // 上一个轨迹点
    this.hasDetectedHeart = false;    // 是否已检测到爱心

    // 启动应用初始化
    this.init();
  }

  /**
   * 设置多层画布架构
   * 
   * 创建三个层级的canvas：
   * - 3D层（最上层）：渲染Three.js 3D爱心
   * - 2D特效层（中层）：渲染科技风格UI特效
   * - 轨迹层（底层）：绘制手指运动轨迹
   */
  setupCanvases() {
    // 创建3D渲染canvas（上层，z-index: 3）
    this.canvas3D = document.createElement('canvas');
    this.canvas3D.id = 'canvas-3d';
    this.canvas3D.width = 640;
    this.canvas3D.height = 480;
    this.canvas3D.style.position = 'absolute';
    this.canvas3D.style.top = '0';
    this.canvas3D.style.left = '0';
    this.canvas3D.style.zIndex = '3';
    this.canvas3D.style.display = 'none';  // 初始隐藏，检测到爱心后显示

    // 创建2D特效canvas（中层，z-index: 2）
    this.canvas2D = document.createElement('canvas');
    this.canvas2D.id = 'canvas-2d';
    this.canvas2D.width = 640;
    this.canvas2D.height = 480;
    this.canvas2D.style.position = 'absolute';
    this.canvas2D.style.top = '0';
    this.canvas2D.style.left = '0';
    this.canvas2D.style.zIndex = '2';

    // 将新创建的canvas添加到容器
    const container = document.querySelector('.canvas-container');
    container.appendChild(this.canvas3D);
    container.appendChild(this.canvas2D);

    // 原canvas用于绘制轨迹（最底层，z-index: 1）
    this.canvasElement.style.zIndex = '1';
  }

  /**
   * 异步初始化应用
   * 
   * 初始化流程：
   * 1. 初始化手势控制器
   * 2. 初始化科技特效
   * 3. 初始化手势追踪
   * 4. 启动摄像头
   * 5. 开始渲染循环和爱心检测
   */
  async init() {
    try {
      this.updateLoadingText('正在加载模型...');

      // 初始化手势控制器
      // 参数1：缩放回调函数 - 当双指缩放时更新3D爱心大小
      // 参数2：旋转回调函数 - 当手指移动时更新3D爱心旋转角度
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

      // 初始化科技特效渲染器
      this.techEffects = new TechEffects(this.canvas2D);

      // 初始化爱心检测器
      this.heartDetector = new HeartDetector();

      // 初始化手势追踪器
      // 参数1：视频元素（摄像头）
      // 参数2：结果回调函数 - 当检测到手势时触发
      this.handTracker = new HandTracker(this.videoElement, (results) => {
        this.onHandResults(results);
      });

      // 初始化手势追踪（加载MediaPipe模型）
      const initialized = await this.handTracker.initialize();

      if (initialized) {
        this.updateLoadingText('正在启动摄像头...');
        // 启动摄像头并开始追踪
        await this.handTracker.start();
        // 隐藏加载提示
        this.loadingElement.classList.add('hidden');
        this.updateStatus('请举起食指画出爱心');

        // 启动渲染循环（持续绘制画面）
        this.startRenderLoop();

        // 启动爱心检测（定时检查轨迹是否为爱心形状）
        this.startHeartDetection();
      } else {
        this.updateLoadingText('启动失败');
        this.updateStatus('启动失败');
      }
    } catch (error) {
      console.error('初始化错误:', error);
      this.updateLoadingText('无法访问摄像头');
      this.updateStatus('无法访问摄像头');
    }
  }

  /**
   * 处理手势识别结果
   * 
   * 根据当前模式处理手势数据：
   * - 绘制模式：追踪食指轨迹
   * - 3D模式：处理双指手势（缩放、旋转）
   * 
   * @param {Object} results - 手势识别结果
   * @param {Object} results.indexFingerTip - 食指指尖坐标
   * @param {Array} results.multiHandLandmarks - 多只手的所有关键点
   */
  onHandResults(results) {
    const { indexFingerTip, multiHandLandmarks } = results;

    if (this.isDrawing && !this.hasDetectedHeart) {
      // 绘制模式：追踪食指轨迹
      if (indexFingerTip) {
        // 使用指数平滑算法消除抖动
        const smoothedPoint = this.applySmoothing(indexFingerTip);

        // 最小距离阈值，避免点过于密集
        const minDistance = 0.005;

        if (!this.lastPoint) {
          // 第一个点直接添加到轨迹
          this.trail.push({ ...smoothedPoint });
          this.lastPoint = { ...smoothedPoint };
          this.lastPointTime = Date.now();
          this.lastMoveTime = Date.now(); // 记录最后移动时间
        } else {
          // 计算与上一个点的距离
          const distance = Math.sqrt(
            Math.pow(smoothedPoint.x - this.lastPoint.x, 2) +
            Math.pow(smoothedPoint.y - this.lastPoint.y, 2)
          );

          const currentTime = Date.now();

          // 检查手指是否静止（超过2秒几乎没动且已有轨迹）
          const timeSinceLastMove = currentTime - this.lastMoveTime;
          if (timeSinceLastMove > 600 && this.trail.length > 7) {
            this.resetTrail();
            return;
          }

          // 只有当移动距离超过阈值时才添加新点
          if (distance > minDistance) {
            // 更新最后移动时间
            this.lastMoveTime = currentTime;

            this.trail.push({ ...smoothedPoint });
            this.lastPoint = { ...smoothedPoint };
            this.lastPointTime = currentTime;

            // 限制轨迹最大长度，防止内存无限增长
            if (this.trail.length > 200) {
              this.trail.shift();
            }
          }
        }
      } else {
        // 手指消失，重置状态
        this.resetTrail();
      }
    } else if (this.hasDetectedHeart) {
      // 3D模式：处理双指手势（缩放、旋转）
      if (multiHandLandmarks && multiHandLandmarks.length > 0) {
        this.gestureController.processHands(multiHandLandmarks);
      }
    }
  }
  
  /**
   * 重置轨迹
   * 
   * 清空所有轨迹点和相关状态
   */
  resetTrail() {
    this.trail = [];
    this.lastPoint = null;
    this.smoothedPoint = null;
    this.lastPointTime = null;
    this.lastMoveTime = null;
  }

  /**
   * 指数平滑算法 - 消除手指抖动
   * 
   * 原理：使用加权平均，新点权重为alpha，历史点权重为(1-alpha)
   * 这样可以平滑突然的跳动，使轨迹更稳定
   * 
   * @param {Object} newPoint - 新的手指坐标点 {x, y}
   * @returns {Object} 平滑后的坐标点
   */
  applySmoothing(newPoint) {
    if (!this.smoothedPoint) {
      // 第一个点直接保存
      this.smoothedPoint = { ...newPoint };
      return this.smoothedPoint;
    }
    
    // 平滑系数（0-1之间）
    // 越大越跟随新点（响应快但抖动多）
    // 越小越平滑（抖动少但延迟大）
    const alpha = 0.3;
    
    // 指数平滑公式：新值 = alpha * 新点 + (1-alpha) * 旧值
    this.smoothedPoint.x = alpha * newPoint.x + (1 - alpha) * this.smoothedPoint.x;
    this.smoothedPoint.y = alpha * newPoint.y + (1 - alpha) * this.smoothedPoint.y;
    
    return this.smoothedPoint;
  }

  /**
   * 检测轨迹是否为爱心形状（使用HeartDetector）
   *
   * @returns {boolean} 是否为爱心形状
   */
  detectHeart() {
    // 轨迹点太少，不足以判断
    if (this.trail.length < 15 || this.hasDetectedHeart) return false;

    // 使用HeartDetector进行检测
    return this.heartDetector.detectHeart(this.trail);
  }

  /**
   * 启动爱心检测定时器
   *
   * 每100毫秒检查一次轨迹是否为爱心形状
   */
  startHeartDetection() {
    this.heartCheckInterval = setInterval(() => {
      if (!this.hasDetectedHeart && this.trail.length >= 15) {
        const isHeart = this.detectHeart();
        if (isHeart) {
          this.onHeartDetected();
          clearInterval(this.heartCheckInterval); // 检测到后停止检测
        }
      }
    }, 100);
  }

  /**
   * 当检测到爱心时的处理
   * 
   * 切换到3D模式：
   * 1. 隐藏轨迹画布
   * 2. 显示3D画布
   * 3. 根据轨迹生成3D爱心
   * 4. 添加点击重置功能
   */
  async onHeartDetected() {
    this.hasDetectedHeart = true;
    this.isDrawing = false;
    this.updateStatus('检测到爱心！生成3D全息投影...');

    // 隐藏2D轨迹画布，显示3D画布
    this.canvasElement.style.display = 'none';
    this.canvas3D.style.display = 'block';

    // 初始化3D爱心，传入用户画出的轨迹点
    this.heart3D = new HolographicHeart3D(this.canvas3D, this.trail);

    // 设置初始缩放
    const currentScale = this.gestureController.getCurrentScale();
    this.heart3D.setScale(currentScale);

    this.updateStatus('伸出拇指和食指捏合来缩放爱心');

    // 2秒后添加点击重置功能
    setTimeout(() => {
      this.canvas3D.style.cursor = 'pointer';
      this.canvas3D.addEventListener('click', this.handleCanvasClick, { once: true });
    }, 2000);
  }

  /**
   * 处理画布点击事件 - 重置应用
   */
  handleCanvasClick = () => {
    this.reset();
  }

  /**
   * 重置应用状态
   *
   * 恢复到初始绘制模式：
   * - 清空轨迹
   * - 隐藏3D画布
   * - 显示轨迹画布
   * - 重置手势控制器
   * - 重新启动爱心检测
   */
  reset() {
    this.hasDetectedHeart = false;
    this.isDrawing = true;
    this.trail = [];
    this.lastPoint = null;

    // 重置手势控制器
    this.gestureController.setCurrentScale(1.0);

    // 重置爱心检测器
    this.heartDetector.reset();

    // 隐藏3D画布，显示轨迹画布
    this.canvas3D.style.display = 'none';
    this.canvasElement.style.display = 'block';
    this.canvas3D.style.cursor = 'default';

    // 清除3D场景
    if (this.heart3D) {
      this.heart3D.hide();
      this.heart3D = null;
    }

    this.updateStatus('请举起食指画出爱心');

    // 重新启动爱心检测
    this.startHeartDetection();
  }

  /**
   * 启动渲染循环
   * 
   * 使用requestAnimationFrame实现流畅的动画渲染
   * 根据当前模式选择渲染内容：
   * - 绘制模式：绘制手指轨迹
   * - 3D模式：渲染3D爱心和科技特效
   */
  startRenderLoop() {
    const render = () => {
      if (this.isDrawing) {
        // 绘制模式：绘制手指轨迹
        this.drawTrail();
      } else if (this.hasDetectedHeart && this.heart3D) {
        // 3D模式：渲染全息爱心
        this.heart3D.render();

        // 渲染科技特效
        const ctx = this.canvas2D.getContext('2d');
        ctx.clearRect(0, 0, this.canvas2D.width, this.canvas2D.height);
        this.techEffects.render(this.gestureController.getCurrentScale());
      }

      // 请求下一帧渲染
      requestAnimationFrame(render);
    };
    render();
  }

  /**
   * 绘制手指轨迹
   * 
   * 使用二次贝塞尔曲线绘制平滑的轨迹
   * 并添加发光效果
   */
  drawTrail() {
    const ctx = this.canvasElement.getContext('2d');
    ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    if (this.trail.length < 2) return;

    // 对轨迹点进行平滑处理
    const smoothedTrail = this.smoothTrail(this.trail);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255, 120, 120, 0.95)';  // 浅红色
    ctx.lineWidth = 5;
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(255, 120, 120, 0.5)';  // 发光效果

    ctx.beginPath();
    
    // 使用二次贝塞尔曲线绘制平滑轨迹
    const firstPoint = smoothedTrail[0];
    const startX = (1 - firstPoint.x) * this.canvasElement.width;
    const startY = firstPoint.y * this.canvasElement.height;
    ctx.moveTo(startX, startY);

    for (let i = 1; i < smoothedTrail.length - 1; i++) {
      const prevPoint = smoothedTrail[i - 1];
      const currPoint = smoothedTrail[i];
      const nextPoint = smoothedTrail[i + 1];
      
      const prevX = (1 - prevPoint.x) * this.canvasElement.width;
      const prevY = prevPoint.y * this.canvasElement.height;
      const currX = (1 - currPoint.x) * this.canvasElement.width;
      const currY = currPoint.y * this.canvasElement.height;
      const nextX = (1 - nextPoint.x) * this.canvasElement.width;
      const nextY = nextPoint.y * this.canvasElement.height;
      
      // 计算控制点（使用中点）
      const cpX = (prevX + currX) / 2;
      const cpY = (prevY + currY) / 2;
      
      ctx.quadraticCurveTo(cpX, cpY, currX, currY);
    }
    
    // 连接最后一个点
    const lastSmoothed = smoothedTrail[smoothedTrail.length - 1];
    const lastX = (1 - lastSmoothed.x) * this.canvasElement.width;
    const lastY = lastSmoothed.y * this.canvasElement.height;
    ctx.lineTo(lastX, lastY);

    ctx.stroke();
    ctx.restore();

    // 绘制手指指示器（使用原始轨迹的最后一个点）
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

  /**
   * 平滑轨迹点（高斯加权移动平均算法）
   * 
   * 使用5点窗口和高斯权重对轨迹进行平滑
   * 减少抖动，使轨迹更流畅
   * 
   * @param {Array} trail - 原始轨迹点数组
   * @returns {Array} 平滑后的轨迹点数组
   */
  smoothTrail(trail) {
    if (trail.length < 5) return trail;
    
    const smoothed = [];
    const windowSize = 5;  // 平滑窗口大小
    
    // 高斯权重系数（中心点权重最高）
    const weights = [0.1, 0.2, 0.4, 0.2, 0.1];
    
    for (let i = 0; i < trail.length; i++) {
      let weightedSumX = 0;
      let weightedSumY = 0;
      let weightSum = 0;
      
      // 计算加权平均值
      for (let j = -Math.floor(windowSize / 2); j <= Math.floor(windowSize / 2); j++) {
        const index = i + j;
        const weightIndex = j + Math.floor(windowSize / 2);
        
        if (index >= 0 && index < trail.length) {
          weightedSumX += trail[index].x * weights[weightIndex];
          weightedSumY += trail[index].y * weights[weightIndex];
          weightSum += weights[weightIndex];
        }
      }
      
      smoothed.push({
        x: weightedSumX / weightSum,
        y: weightedSumY / weightSum
      });
    }
    
    return smoothed;
  }

  /**
   * 更新加载提示文字
   * @param {string} text - 提示文字
   */
  updateLoadingText(text) {
    this.loadingText.textContent = text;
  }

  /**
   * 更新状态文字
   * @param {string} text - 状态文字
   */
  updateStatus(text) {
    this.statusText.textContent = text;
  }
}

// DOM加载完成后启动应用
document.addEventListener('DOMContentLoaded', () => {
  new HolographicHeartApp();
});
