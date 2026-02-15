/**
 * 手势追踪模块
 * 
 * 功能说明：
 * 基于Google MediaPipe Hands的手势追踪实现。
 * 负责初始化MediaPipe模型、启动摄像头、实时处理视频帧并提取手指坐标。
 * 
 * 主要功能：
 * - 加载MediaPipe Hands模型文件
 * - 启动并管理摄像头视频流
 * - 实时检测手部关键点
 * - 提取食指指尖坐标用于绘制
 * - 处理多只手的检测数据
 * 
 * MediaPipe Hands关键点索引：
 * - 0: 手腕
 * - 4: 拇指指尖
 * - 8: 食指指尖（用于绘制）
 * - 12: 中指指尖
 * - 16: 无名指指尖
 * - 20: 小指指尖
 * 
 * @author 画爱心项目组
 * @version 1.0.0
 */

/**
 * 手势追踪器类
 * 
 * 封装了MediaPipe Hands的初始化和使用，提供简洁的API：
 * - initialize(): 加载模型并初始化
 * - start(): 启动摄像头开始追踪
 * - stop(): 停止追踪并释放资源
 */
export class HandTracker {
  /**
   * 构造函数
   * 
   * @param {HTMLVideoElement} videoElement - 视频元素，用于显示摄像头画面
   * @param {Function} onResultsCallback - 检测结果回调函数
   *        回调参数: { indexFingerTip: {x, y}, multiHandLandmarks: [...] }
   */
  constructor(videoElement, onResultsCallback) {
    this.videoElement = videoElement;           // 视频元素
    this.onResultsCallback = onResultsCallback; // 结果回调函数
    this.hands = null;                          // MediaPipe Hands实例
    this.isInitialized = false;                 // 是否已初始化
    this.animationId = null;                    // 动画帧ID（用于停止）
  }

  /**
   * 动态加载JavaScript脚本
   * 
   * 用于加载MediaPipe的hands.js库文件
   * 
   * @param {string} src - 脚本文件路径
   * @returns {Promise} 加载完成的Promise
   */
  async loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';  // 允许跨域
      script.onload = resolve;           // 加载成功
      script.onerror = reject;           // 加载失败
      document.head.appendChild(script);
    });
  }

  /**
   * 初始化手势追踪器
   * 
   * 初始化流程：
   * 1. 加载MediaPipe Hands脚本
   * 2. 等待Hands类可用
   * 3. 创建Hands实例并配置参数
   * 4. 设置结果回调函数
   * 
   * @returns {boolean} 初始化是否成功
   */
  async initialize() {
    try {
      console.log('正在加载 MediaPipe 脚本...');
      
      // 按顺序加载依赖脚本（使用相对路径）
      await this.loadScript('./mediapipe/hands/hands.js');
      console.log('✓ hands.js 加载完成');
      
      // 等待 Hands 类可用（最多等待5秒）
      let retries = 0;
      while (!window.Hands && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (!window.Hands) {
        throw new Error('Hands 类未能加载');
      }
      
      console.log('开始初始化 Hands...');
      
      // 创建Hands实例
      this.hands = new window.Hands({
        locateFile: (file) => {
          // 配置模型文件路径
          console.log('加载模型文件:', file);
          return `./mediapipe/hands/${file}`;
        }
      });

      // 配置检测参数
      this.hands.setOptions({
        maxNumHands: 1,                    // 最多检测1只手
        modelComplexity: 1,                // 模型复杂度（0=轻量, 1=完整, 2=重型）
        minDetectionConfidence: 0.3,       // 最小检测置信度（降低以提高灵敏度）
        minTrackingConfidence: 0.3         // 最小追踪置信度
      });

      // 设置结果回调
      let frameCount = 0;
      this.hands.onResults((results) => {
        frameCount++;
        if (frameCount === 1) {
          console.log('✓ MediaPipe 模型加载成功，开始检测');
        }
        
        // 提取食指指尖坐标
        const indexFingerTip = this.extractIndexFingerTip(results);
        
        // 调用回调函数，传递检测结果
        this.onResultsCallback({
          indexFingerTip: indexFingerTip,
          multiHandLandmarks: results.multiHandLandmarks
        });
      });

      this.isInitialized = true;
      console.log('✓ 初始化完成');
      return true;
    } catch (error) {
      console.error('✗ 初始化失败:', error);
      return false;
    }
  }

  /**
   * 从检测结果中提取食指指尖坐标
   * 
   * MediaPipe Hands关键点索引：
   * - 食指指尖 = 8
   * 
   * @param {Object} results - MediaPipe检测结果
   * @param {Array} results.multiHandLandmarks - 多只手的所有关键点
   * @returns {Object|null} 食指指尖坐标 {x, y} 或 null
   */
  extractIndexFingerTip(results) {
    // 没有检测到手
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return null;
    }

    // 获取第一只手的关键点
    const landmarks = results.multiHandLandmarks[0];
    // 获取食指指尖（索引8）
    const indexFingerTip = landmarks[8];

    if (!indexFingerTip) {
      return null;
    }

    // 返回归一化坐标（0-1范围）
    return {
      x: indexFingerTip.x,
      y: indexFingerTip.y
    };
  }

  /**
   * 启动摄像头并开始手势追踪
   * 
   * 流程：
   * 1. 请求摄像头权限
   * 2. 启动视频流
   * 3. 开始处理视频帧
   * 
   * @throws {Error} 如果摄像头启动失败
   */
  async start() {
    if (!this.isInitialized) {
      throw new Error('Hand tracker not initialized');
    }
    
    console.log('启动摄像头...');
    
    try {
      // 请求摄像头权限
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640,           // 视频宽度
          height: 480,          // 视频高度
          frameRate: { ideal: 30, max: 60 }  // 帧率
        }
      });
      
      // 将视频流绑定到视频元素
      this.videoElement.srcObject = stream;
      await this.videoElement.play();
      
      console.log('✓ 摄像头已启动');
      
      // 开始处理视频帧
      this.processVideoFrame();
      
    } catch (error) {
      console.error('✗ 摄像头启动失败:', error);
      throw error;
    }
  }

  /**
   * 处理视频帧
   * 
   * 使用requestAnimationFrame持续处理视频帧，
   * 将每一帧发送给MediaPipe进行检测
   */
  async processVideoFrame() {
    // 等待视频准备就绪
    if (!this.videoElement.videoWidth) {
      this.animationId = requestAnimationFrame(() => this.processVideoFrame());
      return;
    }

    try {
      // 将视频帧发送给MediaPipe处理
      await this.hands.send({ image: this.videoElement });
    } catch (error) {
      console.error('处理帧失败:', error);
    }

    // 请求下一帧
    this.animationId = requestAnimationFrame(() => this.processVideoFrame());
  }

  /**
   * 停止手势追踪
   * 
   * 释放资源：
   * - 停止动画帧循环
   * - 停止摄像头视频流
   */
  stop() {
    // 停止动画帧循环
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // 停止摄像头
    if (this.videoElement.srcObject) {
      const tracks = this.videoElement.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }
  }
}
