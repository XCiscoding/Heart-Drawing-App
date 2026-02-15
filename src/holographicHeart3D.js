/**
 * 3D全息爱心渲染模块
 * 
 * 功能说明：
 * 使用Three.js库创建和渲染3D全息爱心效果。
 * 
 * 主要功能：
 * - 从用户手绘轨迹生成3D爱心模型
 * - 使用参数方程创建默认爱心形状
 * - 线框渲染（Wireframe）效果
 * - 半透明填充效果
 * - 点阵装饰效果
 * - 环境粒子系统
 * - 平滑缩放和旋转动画
 * 
 * 爱心参数方程：
 * x = 16 * sin³(t)
 * y = -(13 * cos(t) - 5 * cos(2t) - 2 * cos(3t) - cos(4t))
 * 
 * @author 画爱心项目组
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * 3D全息爱心渲染器类
 * 
 * 使用Three.js创建具有科技感的3D爱心效果：
 * - 基于用户轨迹或参数方程生成几何体
 * - 线框+填充的混合渲染
 * - 发光材质和粒子效果
 * - 平滑的缩放和旋转控制
 */
export class HolographicHeart3D {
  /**
   * 构造函数
   * 
   * @param {HTMLCanvasElement} canvas - 3D渲染画布
   * @param {Array} trailPoints - 用户手绘轨迹点（可选），如果提供则基于轨迹生成爱心
   */
  constructor(canvas, trailPoints = null) {
    this.canvas = canvas;                    // 渲染画布
    this.trailPoints = trailPoints;          // 用户轨迹点
    
    // 创建Three.js场景
    this.scene = new THREE.Scene();
    
    // 创建透视相机（视角75度，近裁剪面0.1，远裁剪面1000）
    this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    
    // 创建WebGL渲染器（透明背景，开启抗锯齿）
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(canvas.width, canvas.height);           // 设置渲染尺寸
    this.renderer.setPixelRatio(window.devicePixelRatio);         // 设置像素比（适应高清屏）
    
    // 爱心模型组（包含所有爱心相关的3D对象）
    this.heartGroup = new THREE.Group();
    
    // 粒子系统
    this.particles = null;
    
    // 缩放控制（当前值和目标值，用于平滑过渡）
    this.currentScale = 1.0;
    this.targetScale = 1.0;
    
    // 旋转控制（当前值和目标值，用于平滑过渡）
    this.currentRotationX = 0;
    this.currentRotationY = 0;
    this.targetRotationX = 0;
    this.targetRotationY = 0;
    
    // 浅红色主题色（十六进制）
    this.heartColor = 0xff7878;
    this.heartColorRGB = { r: 255, g: 120, b: 120 };
    
    // 初始化场景
    this.init();
  }

  /**
   * 初始化3D场景
   * 
   * 设置相机位置、创建爱心模型、添加光源
   */
  init() {
    // 设置相机位置（z轴正方向，距离原点50单位）
    this.camera.position.z = 50;
    
    // 创建爱心模型
    // 如果有用户轨迹，基于轨迹创建；否则使用默认参数方程
    if (this.trailPoints && this.trailPoints.length > 0) {
      this.createHeartFromTrail();
    } else {
      this.createHeartGeometry();
    }
    
    // 创建环境粒子系统
    this.createParticleSystem();
    
    // 添加环境光（灰色，强度2）
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    this.scene.add(ambientLight);
    
    // 添加点光源（浅红色，强度2，距离100）
    const pointLight = new THREE.PointLight(this.heartColor, 2, 100);
    pointLight.position.set(0, 0, 20);  // 光源位置
    this.scene.add(pointLight);
    
    // 将爱心组添加到场景
    this.scene.add(this.heartGroup);
  }

  /**
   * 从用户轨迹创建3D爱心
   * 
   * 将2D轨迹点转换为3D坐标，创建：
   * - 管状线框（TubeGeometry + Wireframe）
   * - 半透明填充面
   * - 点阵装饰
   */
  createHeartFromTrail() {
    // 将归一化轨迹点（0-1范围）转换为3D坐标
    const points = this.trailPoints.map(p => {
      // 水平翻转（因为摄像头是镜像的）并缩放到合适大小
      const x = (0.5 - p.x) * 80;
      const y = (0.5 - p.y) * 80;
      return new THREE.Vector3(x, y, 0);
    });

    // 如果点数太少，使用默认爱心形状
    if (points.length < 10) {
      this.createHeartGeometry();
      return;
    }

    // 使用Catmull-Rom曲线创建平滑路径（闭合曲线）
    const curve = new THREE.CatmullRomCurve3(points, true);
    
    // 创建管状几何体（沿曲线创建管道）
    // 参数：曲线、分段数、管道半径、径向分段数、是否闭合
    const tubeGeometry = new THREE.TubeGeometry(curve, Math.min(points.length * 2, 100), 0.8, 8, true);
    
    // 从管状几何体创建线框几何体
    const wireframeGeometry = new THREE.WireframeGeometry(tubeGeometry);
    
    // 线框材质（浅红色，半透明，发光效果）
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: this.heartColor,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });
    
    // 创建线框对象并添加到爱心组
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    this.heartGroup.add(wireframe);

    // 创建填充形状
    this.createFillFromPoints(points);
    
    // 添加点阵效果
    this.createDotMatrix(points);
  }

  /**
   * 从点集创建爱心填充面
   * 
   * 使用简化后的点集创建ShapeGeometry填充面
   * 
   * @param {Array} points - 3D点数组
   */
  createFillFromPoints(points) {
    // 计算中心点
    let centerX = 0, centerY = 0;
    points.forEach(p => {
      centerX += p.x;
      centerY += p.y;
    });
    centerX /= points.length;
    centerY /= points.length;

    // 创建填充形状
    const fillShape = new THREE.Shape();
    
    // 简化点集（降采样到20个点）
    const simplifiedPoints = this.simplifyPoints(points, 20);
    
    if (simplifiedPoints.length > 2) {
      // 使用简化后的点创建形状路径
      fillShape.moveTo(simplifiedPoints[0].x, simplifiedPoints[0].y);
      for (let i = 1; i < simplifiedPoints.length; i++) {
        fillShape.lineTo(simplifiedPoints[i].x, simplifiedPoints[i].y);
      }
      fillShape.closePath();  // 闭合路径
    }

    // 创建形状几何体
    const fillGeometry = new THREE.ShapeGeometry(fillShape);
    
    // 半透明填充材质
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: this.heartColor,
      transparent: true,
      opacity: 0.15,  // 低透明度
      side: THREE.DoubleSide  // 双面渲染
    });
    
    // 创建填充网格并添加到爱心组
    const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
    this.heartGroup.add(fillMesh);
  }

  /**
   * 简化点集（降采样）
   * 
   * 将大量点简化为指定数量的点，用于优化性能
   * 
   * @param {Array} points - 原始点数组
   * @param {number} targetCount - 目标点数
   * @returns {Array} 简化后的点数组
   */
  simplifyPoints(points, targetCount) {
    if (points.length <= targetCount) return points;
    
    const result = [];
    const step = points.length / targetCount;  // 采样步长
    
    // 均匀采样
    for (let i = 0; i < targetCount; i++) {
      const index = Math.floor(i * step);
      result.push(points[index]);
    }
    
    return result;
  }

  /**
   * 使用参数方程创建默认爱心几何体
   * 
   * 当没有用户轨迹时使用此默认形状
   * 
   * 爱心参数方程：
   * x = 16 * sin³(t)
   * y = -(13 * cos(t) - 5 * cos(2t) - 2 * cos(3t) - cos(4t))
   */
  createHeartGeometry() {
    const points = [];
    
    // 使用参数方程生成爱心轮廓点
    for (let t = 0; t <= Math.PI * 2; t += 0.1) {
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      points.push(new THREE.Vector3(x, y, 0));
    }
    
    // 创建平滑曲线
    const curve = new THREE.CatmullRomCurve3(points, true);
    
    // 创建管状线框
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.5, 8, true);
    const wireframeGeometry = new THREE.WireframeGeometry(tubeGeometry);
    
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: this.heartColor,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });
    
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    this.heartGroup.add(wireframe);
    
    // 创建半透明填充
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: this.heartColor,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    
    // 使用参数方程创建填充形状
    const fillShape = new THREE.Shape();
    for (let t = 0; t <= Math.PI * 2; t += 0.1) {
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      if (t === 0) {
        fillShape.moveTo(x, y);
      } else {
        fillShape.lineTo(x, y);
      }
    }
    
    const fillGeometry = new THREE.ShapeGeometry(fillShape);
    const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
    this.heartGroup.add(fillMesh);
    
    // 添加点阵效果
    this.createDotMatrix(points);
  }

  /**
   * 创建点阵效果
   * 
   * 在爱心轮廓和内部添加发光点，增强科技感
   * 
   * @param {Array} points - 爱心轮廓点
   */
  createDotMatrix(points) {
    const dotGeometry = new THREE.BufferGeometry();
    const dotPositions = [];
    
    // 在轮廓上添加点
    points.forEach(point => {
      dotPositions.push(point.x, point.y, point.z);
    });
    
    // 在内部随机添加点
    for (let i = 0; i < 50; i++) {
      const t = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.8;  // 随机半径（0-0.8倍）
      const x = 16 * Math.pow(Math.sin(t), 3) * r;
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * r;
      dotPositions.push(x, y, 0);
    }
    
    // 设置位置属性
    dotGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    
    // 点材质（发光效果）
    const dotMaterial = new THREE.PointsMaterial({
      color: this.heartColor,
      size: 0.8,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending  // 加法混合，产生发光效果
    });
    
    // 创建点阵对象
    const dotMatrix = new THREE.Points(dotGeometry, dotMaterial);
    this.heartGroup.add(dotMatrix);
  }

  /**
   * 创建环境粒子系统
   * 
   * 在爱心周围创建漂浮的粒子，增强全息效果
   */
  createParticleSystem() {
    const particleCount = 300;  // 粒子数量
    const particleGeometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];  // 粒子速度
    
    // 在球面空间内随机生成粒子
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;  // 水平角度
      const phi = Math.random() * Math.PI;        // 垂直角度
      const r = 25 + Math.random() * 30;          // 半径（25-55）
      
      // 球坐标转直角坐标
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions.push(x, y, z);
      
      // 随机速度
      velocities.push(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      );
    }
    
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: this.heartColor,
      size: 0.5,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.particles.userData = { velocities };  // 存储速度数据
    this.scene.add(this.particles);
  }

  /**
   * 设置目标缩放值
   * 
   * @param {number} scale - 缩放值（范围0.5-3.0）
   */
  setScale(scale) {
    this.targetScale = Math.max(0.4, Math.min(3.3, scale));
  }
  
  /**
   * 设置目标旋转角度
   * 
   * @param {number} rotX - X轴旋转角度（弧度）
   * @param {number} rotY - Y轴旋转角度（弧度）
   */
  setRotation(rotX, rotY) {
    this.targetRotationX = rotX;
    this.targetRotationY = rotY;
  }

  /**
   * 更新动画状态
   * 
   * 每帧调用，实现：
   * - 平滑缩放过渡
   * - 平滑旋转过渡
   * - 粒子动画更新
   */
  update() {
    // 平滑缩放（线性插值，系数0.05）
    this.currentScale += (this.targetScale - this.currentScale) * 0.05;
    this.heartGroup.scale.set(this.currentScale, this.currentScale, this.currentScale);

    // 平滑旋转（系数0.08）
    this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 0.08;
    this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.08;

    this.heartGroup.rotation.x = this.currentRotationX;
    this.heartGroup.rotation.y = this.currentRotationY;

    // 粒子跟随爱心缩放和旋转
    if (this.particles) {
      // 粒子组跟随爱心缩放
      this.particles.scale.set(this.currentScale, this.currentScale, this.currentScale);

      // 粒子组跟随爱心旋转（同步旋转）
      this.particles.rotation.x = this.currentRotationX;
      this.particles.rotation.y = this.currentRotationY;

      // 粒子自转动画（额外的缓慢旋转）
      this.particles.rotation.y += 0.002;

      // 更新粒子位置动画
      const positions = this.particles.geometry.attributes.position.array;
      const velocities = this.particles.userData.velocities;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

        // 边界检查，超出范围则反弹
        if (Math.abs(positions[i]) > 60) velocities[i] *= -1;
        if (Math.abs(positions[i + 1]) > 60) velocities[i + 1] *= -1;
        if (Math.abs(positions[i + 2]) > 60) velocities[i + 2] *= -1;
      }

      // 标记位置属性需要更新
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }

  /**
   * 渲染场景
   * 
   * 调用update()更新状态，然后执行渲染
   */
  render() {
    this.update();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * 显示画布
   */
  show() {
    this.canvas.style.display = 'block';
  }

  /**
   * 隐藏画布
   */
  hide() {
    this.canvas.style.display = 'none';
  }
}
