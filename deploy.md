# 爱心手势Web应用 - 部署指南

## 项目概述
- **项目名称**: 画出你的爱心 (Heart Drawing)
- **技术栈**: Vite + Three.js + MediaPipe Hands
- **特点**: 纯前端应用，无需后端，无需登录，打开即用

## 部署方式

### 方式一: GitHub Pages (推荐 - 免费)

#### 步骤:
1. **创建GitHub仓库**
   ```bash
   # 在GitHub上创建新仓库，例如: heart-drawing-app
   ```

2. **推送代码到GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/heart-drawing-app.git
   git push -u origin main
   ```

3. **启用GitHub Pages**
   - 进入仓库 Settings → Pages
   - Source 选择 "Deploy from a branch"
   - Branch 选择 "main"，文件夹选择 "/root"
   - 点击 Save

4. **访问地址**
   ```
   https://你的用户名.github.io/heart-drawing-app/
   ```

#### 优点:
- 完全免费
- 自动部署
- 全球CDN加速
- 支持自定义域名

---

### 方式二: Vercel (推荐 - 免费)

#### 步骤:
1. **注册Vercel账号** (使用GitHub账号登录)

2. **导入项目**
   - 点击 "Add New Project"
   - 导入GitHub仓库
   - Framework Preset 选择 "Vite"
   - 点击 Deploy

3. **自动部署**
   - 每次推送到main分支会自动重新部署

4. **访问地址**
   ```
   https://你的项目名.vercel.app
   ```

#### 优点:
- 完全免费
- 自动HTTPS
- 全球CDN
- 预览部署

---

### 方式三: Netlify (免费)

#### 步骤:
1. **注册Netlify账号**

2. **部署方式**
   - 方式A: 拖拽部署
     - 将 `dist` 文件夹拖拽到Netlify部署区域
   
   - 方式B: Git部署
     - 连接GitHub仓库
     - Build command: `npm run build`
     - Publish directory: `dist`

3. **访问地址**
   ```
   https://xxx.netlify.app
   ```

---

### 方式四: 自有服务器/Nginx

#### 步骤:
1. **准备服务器**
   - 购买云服务器 (阿里云/腾讯云/AWS等)
   - 安装Nginx

2. **上传文件**
   ```bash
   # 将dist文件夹上传到服务器
   scp -r dist/* root@你的服务器IP:/var/www/heart-drawing/
   ```

3. **Nginx配置**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           root /var/www/heart-drawing;
           index index.html;
           try_files $uri $uri/ /index.html;
       }
       
       # 启用gzip压缩
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml;
   }
   ```

4. **重启Nginx**
   ```bash
   sudo nginx -s reload
   ```

---

## 部署前检查清单

- [ ] 运行 `npm run build` 成功
- [ ] dist文件夹包含:
  - index.html
  - assets/ (JS和CSS文件)
  - mediapipe/ (MediaPipe模型文件)
  - heart.svg
- [ ] 本地预览正常: `npm run preview`
- [ ] 摄像头权限正常
- [ ] 手势识别功能正常

## 注意事项

1. **HTTPS要求**: 摄像头访问需要HTTPS，确保部署环境支持HTTPS
2. **MediaPipe文件**: 必须包含 `public/mediapipe` 文件夹中的所有文件
3. **浏览器兼容**: 推荐使用Chrome/Edge/Firefox最新版本
4. **摄像头权限**: 首次使用需要用户授权摄像头访问

## 快速部署命令

```bash
# 构建
npm run build

# 本地预览
npm run preview

# 部署到GitHub Pages (使用gh-pages)
npm install -D gh-pages
npm run build
npm run deploy
```

## 自定义域名 (可选)

所有平台都支持自定义域名:
1. 购买域名 (阿里云/腾讯云/GoDaddy等)
2. 添加DNS解析记录
3. 在部署平台配置自定义域名
4. 等待DNS生效 (通常几分钟到几小时)
