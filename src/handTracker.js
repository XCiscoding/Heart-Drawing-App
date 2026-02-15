export class HandTracker {
  constructor(videoElement, onResultsCallback) {
    this.videoElement = videoElement;
    this.onResultsCallback = onResultsCallback;
    this.hands = null;
    this.isInitialized = false;
    this.animationId = null;
  }

  async loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async initialize() {
    try {
      console.log('正在加载 MediaPipe 脚本...');
      
      // 按顺序加载依赖脚本（使用相对路径）
      await this.loadScript('./mediapipe/hands/hands.js');
      console.log('✓ hands.js 加载完成');
      
      // 等待 Hands 类可用
      let retries = 0;
      while (!window.Hands && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (!window.Hands) {
        throw new Error('Hands 类未能加载');
      }
      
      console.log('开始初始化 Hands...');
      
      this.hands = new window.Hands({
        locateFile: (file) => {
          console.log('加载模型文件:', file);
          return `./mediapipe/hands/${file}`;
        }
      });

      // 降低置信度阈值，提高识别灵敏度
      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3
      });

      let frameCount = 0;
      this.hands.onResults((results) => {
        frameCount++;
        if (frameCount === 1) {
          console.log('✓ MediaPipe 模型加载成功，开始检测');
        }
        
        const indexFingerTip = this.extractIndexFingerTip(results);
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

  extractIndexFingerTip(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return null;
    }

    const landmarks = results.multiHandLandmarks[0];
    const indexFingerTip = landmarks[8];

    if (!indexFingerTip) {
      return null;
    }

    return {
      x: indexFingerTip.x,
      y: indexFingerTip.y
    };
  }

  async start() {
    if (!this.isInitialized) {
      throw new Error('Hand tracker not initialized');
    }
    
    console.log('启动摄像头...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          frameRate: { ideal: 30, max: 60 }
        }
      });
      
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

  async processVideoFrame() {
    if (!this.videoElement.videoWidth) {
      this.animationId = requestAnimationFrame(() => this.processVideoFrame());
      return;
    }

    try {
      await this.hands.send({ image: this.videoElement });
    } catch (error) {
      console.error('处理帧失败:', error);
    }

    this.animationId = requestAnimationFrame(() => this.processVideoFrame());
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.videoElement.srcObject) {
      const tracks = this.videoElement.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }
  }
}
