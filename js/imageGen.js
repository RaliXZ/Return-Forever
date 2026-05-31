/* ============================================================
 * 图片生成模块 — GPT-Image-2 (via APIMart)
 *
 * 接入 apimart.ai 的 GPT-Image-2 模型，支持文本生成图像
 * API 为异步任务模式：提交任务 → 轮询获取结果
 *
 * 挂载点：window.game.imageGen
 * 依赖：无
 * ============================================================ */

window.game.imageGen = {
  apiKey: '',
  endpoint: 'https://api.apimart.ai/v1/images/generations',
  taskEndpoint: 'https://api.apimart.ai/v1/tasks',
  model: 'gpt-image-2',
  connected: false,
  history: [],
  _isGenerating: false,
  _pollInterval: 2000,
  _maxPollTime: 120000,

  setApiKey(key) {
    this.apiKey = (key || "").trim();
    localStorage.setItem('loopPrisonImageApiKey', this.apiKey);
  },

  setEndpoint(endpoint, model) {
    if (endpoint) {
      this.endpoint = (endpoint || "").trim();
      if (!this.endpoint.startsWith('http://') && !this.endpoint.startsWith('https://')) {
        this.endpoint = 'https://' + this.endpoint;
      }
      localStorage.setItem('loopPrisonImageEndpoint', this.endpoint);
    }
    if (model) {
      this.model = (model || "").trim();
      localStorage.setItem('loopPrisonImageModel', this.model);
    }
  },

  /**
   * 提交图片生成任务
   * @param {string} prompt - 文本描述
   * @param {object} options - { n, size }
   * @returns {Promise<{ok: boolean, data: string[], record: object, error: string}>}
   */
  async generate(prompt, options) {
    if (!this.apiKey) {
      window.game.addEventLog('[AI绘图] 错误：未设置 API 密钥');
      return { ok: false, error: 'API Key 未设置' };
    }
    if (!prompt || !prompt.trim()) {
      window.game.addEventLog('[AI绘图] 错误：请输入描述文字');
      return { ok: false, error: '提示词为空' };
    }
    if (this._isGenerating) {
      window.game.addEventLog('[AI绘图] 正在生成中，请稍候...');
      return { ok: false, error: '正在生成中' };
    }

    this._isGenerating = true;
    window.game.addEventLog('[AI绘图] 🎨 正在生成图像：' + prompt.slice(0, 40) + '...');

    try {
      // 1. 提交任务
      var url = this.endpoint;
      if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
        url = 'https://api.apimart.ai/v1/images/generations';
      }

      var body = JSON.stringify({
        model: this.model || 'gpt-image-2',
        prompt: prompt,
        n: (options && options.n) || 1,
        size: (options && options.size) || '1024x1024'
      });

      var submitResp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.apiKey
        }
      });

      if (!submitResp.ok) {
        var errBody = '';
        try { errBody = await submitResp.text(); } catch (e) {}
        window.game.addEventLog('[AI绘图] 提交失败：HTTP ' + submitResp.status);
        this._isGenerating = false;
        return { ok: false, error: 'HTTP ' + submitResp.status + ': ' + (errBody.slice(0, 200) || submitResp.statusText) };
      }

      var submitData = await submitResp.json();
      var taskId = '';

      // 兼容不同响应格式
      if (submitData.data && submitData.data[0] && submitData.data[0].task_id) {
        taskId = submitData.data[0].task_id;
      } else if (submitData.task_id) {
        taskId = submitData.task_id;
      } else if (submitData.id) {
        taskId = submitData.id;
      }

      if (!taskId) {
        window.game.addEventLog('[AI绘图] 未获取到任务 ID');
        this._isGenerating = false;
        return { ok: false, error: '未获取到任务 ID', raw: submitData };
      }

      window.game.addEventLog('[AI绘图] 任务已提交，等待生成中...');

      // 2. 轮询任务结果
      var taskUrl = this.taskEndpoint + '/' + taskId;
      var startTime = Date.now();
      var pollCount = 0;

      while (Date.now() - startTime < this._maxPollTime) {
        pollCount++;
        await this._sleep(this._pollInterval);

        var taskResp = await fetch(taskUrl, {
          headers: { 'Authorization': 'Bearer ' + this.apiKey }
        });

        if (!taskResp.ok) {
          this._isGenerating = false;
          window.game.addEventLog('[AI绘图] 查询任务状态失败');
          return { ok: false, error: '查询任务状态失败' };
        }

        var taskData = await taskResp.json();
        var taskResult = taskData.data || taskData;
        var status = (taskResult.status || '').toLowerCase();

        // 更新时间提示
        if (pollCount % 5 === 0) {
          window.game.addEventLog('[AI绘图] 生成中... (' + Math.round((Date.now() - startTime) / 1000) + 's)');
        }

        if (status === 'completed' || status === 'succeeded') {
          // 提取图片 URL
          var images = [];
          if (taskResult.result && taskResult.result.urls) {
            images = taskResult.result.urls;
          } else if (taskResult.result && taskResult.result.url) {
            images = [taskResult.result.url];
          } else if (taskResult.urls) {
            images = taskResult.urls;
          } else if (taskResult.url) {
            images = [taskResult.url];
          } else if (taskResult.output && taskResult.output[0]) {
            images = [taskResult.output[0]];
          }

          if (images.length === 0) {
            window.game.addEventLog('[AI绘图] 生成完成但未获取到图片 URL');
            this._isGenerating = false;
            return { ok: false, error: '未获取到图片 URL' };
          }

          this.connected = true;
          var elapsed = Math.round((Date.now() - startTime) / 1000);
          window.game.addEventLog('[AI绘图] ✅ 生成成功！耗时 ' + elapsed + 's');

          var record = {
            id: Date.now(),
            prompt: prompt,
            urls: images,
            timestamp: new Date().toLocaleString()
          };
          this.history.unshift(record);
          if (this.history.length > 50) this.history.length = 50;

          this._isGenerating = false;
          return { ok: true, data: images, record: record };
        }

        if (status === 'failed' || status === 'error') {
          window.game.addEventLog('[AI绘图] 生成失败：' + (taskResult.error || '任务异常'));
          this._isGenerating = false;
          return { ok: false, error: taskResult.error || '任务失败' };
        }
      }

      // 超时
      window.game.addEventLog('[AI绘图] 生成超时');
      this._isGenerating = false;
      return { ok: false, error: '生成超时' };
    } catch (err) {
      window.game.addEventLog('[AI绘图] 异常：' + err.message);
      this._isGenerating = false;
      return { ok: false, error: err.message };
    }
  },

  _sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  },

  /**
   * 使用图片 URL 作为游戏背景
   */
  async setAsBackground(imageUrl) {
    if (!imageUrl) return;
    try {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise(function(resolve, reject) {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      this._bgImage = img;
      window.game.addEventLog('[AI绘图] 背景图片已加载');
      if (window.game.map) {
        window.game.map._bgOverride = img;
      }
    } catch (e) {
      window.game.addEventLog('[AI绘图] 背景加载失败：' + e.message);
    }
  },

  async testConnection() {
    if (!this.apiKey) {
      return { ok: false, error: 'API Key 未设置' };
    }
    this._isGenerating = false;
    try {
      var url = this.endpoint;
      var body = JSON.stringify({
        model: this.model || 'gpt-image-2',
        prompt: 'test connection - colorful gradient',
        n: 1,
        size: '256x256'
      });
      var resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.apiKey
        }
      });
      if (resp.ok) {
        this.connected = true;
        return { ok: true };
      }
      return { ok: false, error: 'HTTP ' + resp.status };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  clearHistory() {
    this.history = [];
    window.game.addEventLog('[AI绘图] 历史已清除');
  }
};
