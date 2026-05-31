# 永返 — Loop Prison

双人 2D 俯视合作闯关网页游戏。纯前端 HTML5 Canvas + 原生 JS。

## 功能特性

- 🎮 双人协作平台跳跃
- 🎤 语音指挥 AI 队友
- ♾ 无限关卡模式
- 🎨 **AI 绘图** — 集成 GPT-Image-2 (via APIMart)，游戏中直接生成图片

## AI 绘图功能

通过 APIMart (apimart.ai) 接入 GPT-Image-2 模型，在游戏中直接输入文字描述生成图像。

### 配置方法

1. 点击游戏右上角 ⚙️ 设置
2. 在 "AI 绘图设置" 区域填入：
   - **绘图 API Key**: 你的 APIMart API Key
   - **绘图 Endpoint**: `https://api.apimart.ai/v1/images/generations`
   - **绘图 Model**: `gpt-image-2`
3. 点击 "🎨 测试绘图连接" 验证
4. 点击游戏右下角 🎨 按钮打开绘图面板
5. 输入描述文字，点击生成即可

### 技术说明

- 使用 OpenAI 兼容格式
- 异步任务模式：提交 → 轮询 → 获取结果
- 支持 1024×1024 / 1024×1792 / 1792×1024 分辨率
- 生成的历史记录保存在 `window.game.imageGen.history` 中
