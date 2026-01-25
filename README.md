# Alpha Workspace 内测版

一款极简风格的桌面启动器，整合常用生产力工具（绘图、写作、AI），提供统一的快速访问入口。

## 功能特性

### 核心功能
- **draw.io** - 在线绘图工具，点击后在浏览器中打开
- **typora** - 本地 Markdown 编辑器，点击后启动本地应用
- **gemini** - Google AI 助手，点击后在浏览器中打开
- **Google Bucket** - 右下角工具集，包含：
  - AI Studio - Google AI 开发平台
  - NotebookLM - Google 智能笔记工具

### 界面特色
- 深色网格背景，营造极客氛围
- 玻璃态效果 (Glassmorphism)
- 悬浮动画和辉光效果
- 响应式交互设计

## 技术栈

- **前端**: React + TypeScript + Vite
- **后端**: Rust (Tauri)
- **打包**: Tauri v2

## 开发环境配置

### 前置要求

1. **Node.js** (v16 或更高版本)
   - 下载地址: https://nodejs.org/

2. **Rust** (必需，用于 Tauri 后端)
   - Windows 安装:
     ```powershell
     # 访问 https://www.rust-lang.org/tools/install
     # 下载并运行 rustup-init.exe
     ```
   - 或使用命令行:
     ```powershell
     winget install --id Rustlang.Rustup
     ```

3. **Visual Studio C++ Build Tools** (Windows 必需)
   - 下载地址: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - 安装时选择 "Desktop development with C++"

### 安装步骤

1. 克隆或下载项目到本地

2. 安装依赖:
   ```bash
   npm install
   ```

3. 运行开发模式:
   ```bash
   npm run tauri dev
   ```

4. 构建生产版本:
   ```bash
   npm run tauri build
   ```
   构建完成后，可执行文件位于 `src-tauri/target/release/`

## 使用说明

### 首次使用

1. 启动应用后，您会看到三个主要功能卡片和一个 Google Bucket 图标
2. 点击 **draw.io** 或 **gemini** 会直接在默认浏览器中打开对应网站
3. 点击 **typora** 时，如果未配置路径，会弹出配置对话框

### 配置 Typora 路径

1. 点击 typora 卡片
2. 在弹出的对话框中输入 Typora.exe 的完整路径
   - 例如: `C:\Program Files\Typora\Typora.exe`
3. 点击"保存"按钮
4. 再次点击 typora 卡片即可启动应用

### Google Bucket 使用

1. 点击右下角的桶图标 🪣
2. 在弹出的菜单中选择:
   - **AI Studio** - 打开 Google AI Studio
   - **NotebookLM** - 打开 Google NotebookLM

## 项目结构

```
WP/
├── src/                    # React 前端源码
│   ├── App.tsx            # 主应用组件
│   ├── App.css            # 样式文件
│   └── main.tsx           # 入口文件
├── src-tauri/             # Tauri 后端
│   ├── src/
│   │   ├── main.rs        # Rust 入口
│   │   └── lib.rs         # 核心功能实现
│   ├── tauri.conf.json    # Tauri 配置
│   └── Cargo.toml         # Rust 依赖
├── package.json           # Node.js 依赖
└── README.md             # 本文件
```

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run tauri dev

# 构建生产版本
npm run tauri build

# 仅运行前端开发服务器
npm run dev
```

## 故障排除

### 问题: 运行 `npm run tauri dev` 时提示 "cargo not found"
**解决方案**: 需要安装 Rust。请参考上面的"前置要求"部分安装 Rust。

### 问题: Typora 无法启动
**解决方案**: 
1. 确保已正确安装 Typora
2. 检查配置的路径是否正确
3. 路径中的反斜杠需要使用双反斜杠 `\\` 或单正斜杠 `/`

### 问题: 浏览器没有打开
**解决方案**: 
1. 确保系统已设置默认浏览器
2. 检查防火墙设置是否阻止了应用

## 后续版本规划

- **v0.2**: 添加设置面板，支持自定义所有应用路径和 URL
- **v0.3**: 支持右键菜单，允许用户自定义图标和名称
- **v0.4**: 添加更多工具集成和主题定制

## 许可证

内测版本，仅供内部使用。

## 联系方式

如有问题或建议，请联系开发团队。
