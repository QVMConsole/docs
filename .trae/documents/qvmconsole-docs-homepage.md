# QVMConsole 文档站首页实现计划

## 背景

QVMConsole 是一个基于 KVM/QEMU 的轻量级虚拟机管理面板（Go + Vue.js），拥有丰富的功能。当前文档站使用 Docusaurus 3.10.1 框架，但首页仍为默认模板内容（标题 "My Site"、标语 "Dinosaurs are cool"、空的 FeatureList）。需要根据项目文档中提炼的特色功能，制作一个专业的项目首页。

## 项目特色（从文档提炼）

| 特色 | 对应文档 |
|------|---------|
| 虚拟机生命周期管理（创建/克隆/删除/迁移/重装/导入导出） | vm-create-and-infra.md, vm-migration.md |
| 浏览器 VNC 远程控制台（noVNC + WebSocket + 密码粘贴/文本发送） | vnc-console.md |
| 网络管理（端口转发/静态IP/VPC/安全组/速率限制/网络诊断） | network-manage.md, vpc-network.md |
| 轻量云模式（管理员登记/用户确认/单VM配额/带宽限速） | lightweight-cloud.md |
| 安全体系（2FA/邮箱验证/邀请注册/高风险操作二次验证） | security-2fa-email.md |
| 异步任务中心（任务队列/SSE实时推送/底部任务面板） | task-center.md |
| 模板管理（模板树/链式克隆/导入导出/快照） | vm-create-and-infra.md |
| 存储池管理（硬盘管理/格式化挂载/ISO管理/配额） | vm-create-and-infra.md |
| 调度事件中心（气球调度/弹性内存/定时任务） | scheduler-center.md |
| 救援系统（挂载ISO修复/自动切换兼容模式） | rescue-system.md |
| 跨节点迁移（冷迁移/热迁移/脏页速率检测/线路测速） | vm-migration.md |
| 宿主机优化（KSM/zRAM 配置） | host-zram.md, host-ksm.md |

## 需要修改的文件

### 1. `docusaurus.config.ts` — 更新站点配置
- `title`: `'QVMConsole'`
- `tagline`: `'基于 KVM/QEMU 的轻量级虚拟机管理面板'`
- `i18n.defaultLocale`: `'zh-Hans'`
- `i18n.locales`: `['zh-Hans']`
- `organizationName` / `projectName`: 根据实际仓库调整
- `themeConfig.navbar.title`: `'QVMConsole'`

### 2. `src/pages/index.tsx` — 重写首页组件
- Hero 区域：大标题 + 描述 + 两个 CTA 按钮（"快速开始" / "GitHub"）
- 特色功能区：8 个核心功能卡片，每个带 SVG 图标 + 标题 + 描述
- 技术架构区：简要展示前后端技术栈
- 底部 CTA 区

### 3. `src/pages/index.module.css` — 重写首页样式
- Hero 渐变背景（深蓝/紫色科技风）
- 功能卡片网格布局 + hover 效果
- 响应式设计

### 4. `src/components/HomepageFeatures/index.tsx` — 重写功能列表组件
- 替换空 FeatureList 为 8 个实际功能项
- 使用内联 SVG 图标（不依赖外部资源）
- 功能列表：
  1. 虚拟机全生命周期 — 创建、克隆、迁移、重装、导入导出，一站式管理
  2. 浏览器 VNC 控制台 — noVNC 远程桌面，支持密码粘贴和文本发送
  3. 网络与安全组 — VPC 隔离、端口转发、静态 IP、带宽限速
  4. 轻量云模式 — 管理员登记分配，用户确认开通，单 VM 精细配额
  5. 多层安全体系 — 2FA、邮箱验证、邀请注册、高风险操作二次验证
  6. 异步任务中心 — 任务队列 + SSE 实时推送，底部任务面板
  7. 模板与存储 — 链式克隆模板树、存储池管理、ISO 镜像库
  8. 调度与救援 — 智能内存调度、定时任务、救援系统一键恢复

### 5. `src/components/HomepageFeatures/styles.module.css` — 重写功能卡片样式
- 网格布局（2行4列 desktop，响应式到 mobile）
- 卡片圆角、阴影、hover 上浮效果
- SVG 图标容器样式

### 6. `src/css/custom.css` — 更新全局主题色
- 主色从绿色调整为蓝色/紫色科技感配色
- 暗色模式适配

## 实现步骤

1. 更新 `docusaurus.config.ts`：站点元信息和导航栏
2. 重写 `src/css/custom.css`：主题色和全局样式
3. 重写 `src/components/HomepageFeatures/styles.module.css`：功能卡片样式
4. 重写 `src/components/HomepageFeatures/index.tsx`：功能卡片组件（含内联 SVG）
5. 重写 `src/pages/index.module.css`：首页布局样式
6. 重写 `src/pages/index.tsx`：首页主组件
7. 构建验证：运行 `pnpm build` 确保无报错
8. 更新 docs 目录下的开发文档

## 设计规范

- 语言：所有 UI 文本使用中文
- 注释：代码注释使用中文
- 代码：文件名和变量名使用英文
- 图标：使用内联 SVG，不依赖外部图片资源
- 响应式：支持桌面端和移动端
- 暗色模式：支持 `respectPrefersColorScheme`
