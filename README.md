# ERROR-CORE 小游戏

一款基于 Electron 开发的桌面小游戏应用。

## 🎮 游戏列表

| 游戏名称 | 描述 |
|---------|------|
| 🐍 贪吃蛇 | 经典贪吃蛇游戏 |
| 🎯 射击游戏 | 打靶射击游戏 |
| 🧱 打砖块 | 经典打砖块游戏 |
| ⚽ 足球大战 | 足球小游戏 |

## 🎨 特色功能

- 🎭 精美的 UI 设计
- ⭐ 星空粒子背景效果
- 🎨 画板功能（支持保存为 PNG）
- 📱 响应式设计

## 📁 项目结构

```
├── index.html          # 首页
├── gamecenter.html     # 游戏中心
├── contact.html        # 联系我们
├── drawing.html        # 画板
├── snake.html          # 贪吃蛇游戏
├── ShootingGame.html   # 射击游戏
├── BreakoutGame.html   # 打砖块游戏
├── FootballGame.html   # 足球游戏
├── style.css           # 样式文件
├── main.js             # Electron 主进程
├── package.json        # 项目配置
└── picture/            # 图片资源
```

## 🚀 快速开始

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start
```

### 打包构建

```bash
# 构建 macOS 应用
npm run dist

# 仅打包（不生成安装包）
npm run pack
```

## 📦 打包产物

构建完成后，产物位于 `dist/` 目录：

- `dist/mac/ERROR-CORE小游戏.app` - macOS 应用程序
- `dist/ERROR-CORE小游戏-1.0.0-mac.zip` - ZIP 压缩包

## 🛠️ 技术栈

- **框架**: Electron 28
- **前端**: HTML5 / CSS3 / JavaScript
- **构建工具**: electron-builder

## 📄 许可证

MIT License
