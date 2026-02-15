# Netlify 自定义域名配置指南

## 方案一：购买新域名（推荐）

### 步骤 1：选择域名注册商

| 注册商 | 价格（.com） | 特点 |
|--------|-------------|------|
| **阿里云** | ¥60-80/年 | 国内访问快，中文界面 |
| **腾讯云** | ¥60-80/年 | 国内访问快，中文界面 |
| **Namecheap** | $10-15/年 | 国外知名，隐私保护免费 |
| **GoDaddy** | $12-20/年 | 全球最大，服务全面 |
| **Cloudflare** | 成本价 | 无溢价，但需转入 |

### 步骤 2：购买域名

以阿里云为例：
1. 访问 https://wanwang.aliyun.com
2. 搜索想要的域名（如：heartdrawing.fun）
3. 加入购物车并支付
4. 完成实名认证（国内注册商需要）

**推荐域名后缀：**
- `.com` - 最通用，但较贵
- `.fun` - 有趣，便宜（约¥20-30/年）
- `.love` - 符合爱心主题
- `.app` - 适合应用
- `.net` - 技术类

---

## 方案二：使用已有域名

如果你已经有域名，可以直接绑定到 Netlify。

---

## Netlify 绑定域名步骤

### 方法 A：通过 Netlify 购买（最简单）

1. 登录 Netlify 后台
2. 进入你的站点 → **Domain management**
3. 点击 **"Add custom domain"**
4. 输入你想要的域名
5. 点击 **Search**
6. 如果可用，直接购买并自动配置

### 方法 B：绑定已有域名（推荐）

#### 步骤 1：在 Netlify 添加域名

1. 登录 https://app.netlify.com
2. 选择你的站点
3. 点击 **"Site settings"**
4. 选择 **"Domain management"**
5. 点击 **"Add custom domain"**
6. 输入你的域名（如：heartdrawing.fun）
7. 点击 **Verify**

#### 步骤 2：配置 DNS 记录

Netlify 会提供两种配置方式：

**方式 1：使用 Netlify DNS（推荐）**

1. Netlify 会显示需要设置的 DNS 服务器
   ```
   dns1.p01.nsone.net
   dns2.p01.nsone.net
   dns3.p01.nsone.net
   dns4.p01.nsone.net
   ```

2. 登录你的域名注册商后台
3. 找到 DNS 管理或域名服务器设置
4. 将默认 DNS 修改为 Netlify 提供的 DNS
5. 保存并等待生效（通常 5-30 分钟）

**方式 2：使用 CNAME 记录**

如果不想修改 DNS 服务器，可以添加 CNAME 记录：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| CNAME | www | 你的站点名.netlify.app |
| A | @ | 75.2.60.5 |

---

## 详细配置示例

### 阿里云域名配置

1. 登录 https://dc.console.aliyun.com
2. 找到你的域名 → 点击 **"解析"**
3. 点击 **"添加记录"**

**配置方式 A（使用 CNAME）：**
```
记录类型：CNAME
主机记录：www
记录值：jazzy-figolia-9068a5.netlify.app
TTL：10分钟
```

**配置方式 B（使用 A 记录）：**
```
记录类型：A
主机记录：@
记录值：75.2.60.5
TTL：10分钟
```

### 腾讯云域名配置

1. 登录 https://console.cloud.tencent.com/cns
2. 找到你的域名 → 点击 **"解析"**
3. 添加记录，同上

---

## 配置完成后的检查

### 1. 等待 DNS 生效

```bash
# 使用命令检查（Windows PowerShell）
nslookup yourdomain.com

# 或使用在线工具
https://dnschecker.org
```

### 2. 在 Netlify 验证

1. 返回 Netlify Domain management
2. 等待状态变为 **"DNS verification successful"**
3. 点击 **"Provision certificate"** 自动申请 SSL 证书

### 3. 测试访问

- HTTP: http://yourdomain.com
- HTTPS: https://yourdomain.com ✅ 应该自动跳转

---

## 免费域名方案

### 方案 1：Freenom（.tk/.ml/.ga/.cf/.gq）

1. 访问 https://www.freenom.com
2. 搜索免费域名（如：heartdrawing.tk）
3. 选择免费时长（最长12个月）
4. 完成注册

**注意：**
- 免费域名可能不稳定
- 需要定期续期
- 某些地区访问受限

### 方案 2：GitHub Pages 子域名

如果不想购买域名，可以使用：
```
https://你的用户名.github.io/heart-drawing-app/
```

---

## 推荐配置流程图

```
┌─────────────────┐
│ 1. 购买域名      │
│ (阿里云/腾讯云)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. 部署到Netlify│
│ (拖拽dist文件夹) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. 添加自定义域名│
│ (Site settings) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. 配置DNS解析   │
│ (CNAME或A记录)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. 等待SSL证书   │
│ (自动申请)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. 完成！        │
│ https访问        │
└─────────────────┘
```

---

## 常见问题

### Q1: 域名解析后无法访问？

**检查步骤：**
1. DNS 是否生效（等待 10-30 分钟）
2. 检查 DNS 记录是否正确
3. 清除浏览器缓存
4. 尝试使用隐身模式访问

### Q2: HTTPS 证书没有自动申请？

**解决方法：**
1. 确保 DNS 已正确解析
2. 在 Netlify 点击 **"Renew certificate"**
3. 等待 5-10 分钟

### Q3: 如何同时支持 www 和非 www？

**配置方法：**
1. 在 Netlify 同时添加：
   - yourdomain.com
   - www.yourdomain.com
2. 设置主域名（Primary domain）
3. 另一个会自动重定向

### Q4: 国内访问慢怎么办？

**优化方案：**
1. 使用国内域名注册商（阿里云/腾讯云）
2. 开启 CDN 加速（Netlify 自带全球 CDN）
3. 考虑使用国内云服务部署

---

## 推荐域名示例

| 域名 | 说明 | 预估价格 |
|------|------|---------|
| heartdrawing.fun | 有趣、易记 | ¥20-30/年 |
| drawheart.app | 应用专用 | ¥100-150/年 |
| lovegesture.cn | 国内访问 | ¥30-50/年 |
| myheart.art | 艺术感 | ¥50-80/年 |
| heartcam.xyz | 简短 | ¥10-20/年 |

---

## 快速开始

### 最简配置（推荐新手）

1. **购买域名**：阿里云搜索 `.fun` 后缀域名
2. **部署网站**：Netlify Drop 拖拽 dist 文件夹
3. **绑定域名**：
   - Netlify: Site settings → Domain management → Add domain
   - 阿里云: 域名解析 → 添加 CNAME → 指向 netlify.app
4. **等待生效**：10-30 分钟后访问

**总成本**：域名 ¥20-30/年 + Netlify 免费 = **¥20-30/年**

---

## 需要帮助？

如果遇到问题：
1. 检查 Netlify 的 DNS 配置提示
2. 查看域名注册商的解析教程
3. 使用 https://dnschecker.org 检查全球解析状态
