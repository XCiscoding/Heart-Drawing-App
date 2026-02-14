import * as THREE from 'three';

export class HolographicHeart3D {
  constructor(canvas, trailPoints = null) {
    this.canvas = canvas;
    this.trailPoints = trailPoints;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    this.heartGroup = new THREE.Group();
    this.particles = null;
    this.currentScale = 1.0;
    this.targetScale = 1.0;
    
    // 浅红色主题色
    this.heartColor = 0xff7878;
    this.heartColorRGB = { r: 255, g: 120, b: 120 };
    
    this.init();
  }

  init() {
    // 设置相机位置
    this.camera.position.z = 50;
    
    // 创建爱心
    if (this.trailPoints && this.trailPoints.length > 0) {
      this.createHeartFromTrail();
    } else {
      this.createHeartGeometry();
    }
    
    // 创建粒子系统
    this.createParticleSystem();
    
    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    this.scene.add(ambientLight);
    
    // 添加点光源 - 浅粉色
    const pointLight = new THREE.PointLight(this.heartColor, 2, 100);
    pointLight.position.set(0, 0, 20);
    this.scene.add(pointLight);
    
    // 将爱心组添加到场景
    this.scene.add(this.heartGroup);
  }

  createHeartFromTrail() {
    // 将轨迹点转换为3D坐标
    const points = this.trailPoints.map(p => {
      // 将归一化坐标转换为3D坐标（居中并缩放）
      const x = (0.5 - p.x) * 80; // 水平翻转并缩放
      const y = (0.5 - p.y) * 80; // 垂直翻转并缩放
      return new THREE.Vector3(x, y, 0);
    });

    // 如果点数太少，使用默认爱心
    if (points.length < 10) {
      this.createHeartGeometry();
      return;
    }

    // 创建平滑曲线
    const curve = new THREE.CatmullRomCurve3(points, true);
    
    // 创建线框几何体
    const tubeGeometry = new THREE.TubeGeometry(curve, Math.min(points.length * 2, 100), 0.8, 8, true);
    const wireframeGeometry = new THREE.WireframeGeometry(tubeGeometry);
    
    // 线框材质 - 浅粉色发光
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: this.heartColor,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });
    
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    this.heartGroup.add(wireframe);

    // 创建填充形状（使用轮廓点）
    this.createFillFromPoints(points);
    
    // 添加点阵效果
    this.createDotMatrix(points);
  }

  createFillFromPoints(points) {
    // 计算中心点
    let centerX = 0, centerY = 0;
    points.forEach(p => {
      centerX += p.x;
      centerY += p.y;
    });
    centerX /= points.length;
    centerY /= points.length;

    // 创建填充几何体 - 使用轮廓点创建形状
    const fillShape = new THREE.Shape();
    
    // 找到最左、最右、最上、最下的点来确定边界
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    // 使用简化的轮廓创建填充
    const simplifiedPoints = this.simplifyPoints(points, 20);
    if (simplifiedPoints.length > 2) {
      fillShape.moveTo(simplifiedPoints[0].x, simplifiedPoints[0].y);
      for (let i = 1; i < simplifiedPoints.length; i++) {
        fillShape.lineTo(simplifiedPoints[i].x, simplifiedPoints[i].y);
      }
      fillShape.closePath();
    }

    const fillGeometry = new THREE.ShapeGeometry(fillShape);
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: this.heartColor,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    
    const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
    this.heartGroup.add(fillMesh);
  }

  simplifyPoints(points, targetCount) {
    if (points.length <= targetCount) return points;
    
    const result = [];
    const step = points.length / targetCount;
    
    for (let i = 0; i < targetCount; i++) {
      const index = Math.floor(i * step);
      result.push(points[index]);
    }
    
    return result;
  }

  createHeartGeometry() {
    // 使用参数方程生成爱心形状（备用方案）
    const heartShape = new THREE.Shape();
    const points = [];
    
    // 生成爱心轮廓点
    for (let t = 0; t <= Math.PI * 2; t += 0.1) {
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      points.push(new THREE.Vector3(x, y, 0));
    }
    
    // 创建心形路径
    const curve = new THREE.CatmullRomCurve3(points, true);
    
    // 创建线框几何体
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.5, 8, true);
    const wireframeGeometry = new THREE.WireframeGeometry(tubeGeometry);
    
    // 线框材质 - 浅粉色发光
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: this.heartColor,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });
    
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    this.heartGroup.add(wireframe);
    
    // 创建内部填充（半透明）
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: this.heartColor,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    
    // 创建填充几何体
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

  createDotMatrix(points) {
    const dotGeometry = new THREE.BufferGeometry();
    const dotPositions = [];
    
    // 在爱心轮廓上添加点
    points.forEach(point => {
      dotPositions.push(point.x, point.y, point.z);
    });
    
    // 添加内部点
    for (let i = 0; i < 50; i++) {
      const t = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.8;
      const x = 16 * Math.pow(Math.sin(t), 3) * r;
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * r;
      dotPositions.push(x, y, 0);
    }
    
    dotGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    
    const dotMaterial = new THREE.PointsMaterial({
      color: this.heartColor,
      size: 0.8,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    
    const dotMatrix = new THREE.Points(dotGeometry, dotMaterial);
    this.heartGroup.add(dotMatrix);
  }

  createParticleSystem() {
    const particleCount = 300;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
      // 在爱心周围随机生成粒子
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 25 + Math.random() * 30;
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions.push(x, y, z);
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
    this.particles.userData = { velocities };
    this.scene.add(this.particles);
  }

  setScale(scale) {
    this.targetScale = Math.max(0.5, Math.min(3.0, scale));
  }

  update() {
    // 平滑缩放
    this.currentScale += (this.targetScale - this.currentScale) * 0.1;
    this.heartGroup.scale.set(this.currentScale, this.currentScale, this.currentScale);
    
    // 旋转动画
    this.heartGroup.rotation.y += 0.008;
    this.heartGroup.rotation.x += 0.003;
    
    // 粒子动画
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const velocities = this.particles.userData.velocities;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];
        
        // 边界检查，让粒子在范围内循环
        if (Math.abs(positions[i]) > 60) velocities[i] *= -1;
        if (Math.abs(positions[i + 1]) > 60) velocities[i + 1] *= -1;
        if (Math.abs(positions[i + 2]) > 60) velocities[i + 2] *= -1;
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true;
      this.particles.rotation.y += 0.002;
    }
  }

  render() {
    this.update();
    this.renderer.render(this.scene, this.camera);
  }

  show() {
    this.canvas.style.display = 'block';
  }

  hide() {
    this.canvas.style.display = 'none';
  }
}
