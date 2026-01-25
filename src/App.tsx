import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [showBucketMenu, setShowBucketMenu] = useState(false);
  const [showTyporaDialog, setShowTyporaDialog] = useState(false);
  const [typoraPath, setTyporaPath] = useState("");

  // 加载保存的 Typora 路径
  useEffect(() => {
    const loadTyporaPath = async () => {
      try {
        const savedPath = await invoke<string | null>("get_typora_path");
        if (savedPath) {
          setTyporaPath(savedPath);
        }
      } catch (error) {
        console.error("Failed to load Typora path:", error);
      }
    };
    loadTyporaPath();
  }, []);

  // 打开 URL
  const openUrl = async (url: string) => {
    try {
      await invoke("open_url", { url });
    } catch (error) {
      alert(`打开失败: ${error}`);
    }
  };

  // 启动 Typora
  const launchTypora = async () => {
    try {
      await invoke("launch_typora");
    } catch (error) {
      // 如果失败，显示配置对话框
      setShowTyporaDialog(true);
    }
  };

  // 保存 Typora 路径
  const saveTyporaPath = async () => {
    if (!typoraPath.trim()) {
      alert("请输入有效的路径");
      return;
    }

    try {
      await invoke("set_typora_path", { path: typoraPath });
      setShowTyporaDialog(false);
      alert("Typora 路径已保存！");

      // 保存后立即尝试启动
      try {
        await invoke("launch_typora");
      } catch (launchError) {
        alert(`启动失败: ${launchError}\n请检查路径是否正确。`);
      }
    } catch (error) {
      alert(`保存失败: ${error}`);
    }
  };


  return (
    <div className="app">
      {/* 顶部标签 */}
      <div className="top-badge">Alpha内测版</div>

      {/* 主容器 */}
      <div className="main-container">
        {/* draw.io 卡片 */}
        <div
          className="function-card square"
          onClick={() => openUrl("https://app.diagrams.net/")}
        >
          <div className="card-icon">📊</div>
          <div className="card-label">draw.io</div>
        </div>

        {/* typora 卡片 */}
        <div className="function-card square" onClick={launchTypora}>
          <div className="card-icon">📝</div>
          <div className="card-label">typora</div>
        </div>

        {/* gemini 卡片 */}
        <div
          className="function-card center"
          onClick={() => openUrl("https://gemini.google.com/")}
        >
          <div className="card-icon">✨</div>
          <div className="card-label">gemini</div>
        </div>
      </div>

      {/* Google Bucket */}
      <div className="google-bucket">
        <div
          className="bucket-icon"
          onClick={() => setShowBucketMenu(!showBucketMenu)}
        >
          🪣
        </div>

        {showBucketMenu && (
          <div className="bucket-menu">
            <div
              className="bucket-item"
              onClick={() => openUrl("https://aistudio.google.com/")}
            >
              <span className="bucket-item-icon">🤖</span>
              <span>AI Studio</span>
            </div>
            <div
              className="bucket-item"
              onClick={() => openUrl("https://notebooklm.google.com/")}
            >
              <span className="bucket-item-icon">📚</span>
              <span>NotebookLM</span>
            </div>
          </div>
        )}
      </div>

      {/* Typora 路径配置对话框 */}
      {showTyporaDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>配置 Typora 路径</h2>
            <p>请输入 Typora.exe 的完整路径：</p>
            <input
              type="text"
              value={typoraPath}
              onChange={(e) => setTyporaPath(e.target.value)}
              placeholder="例如: C:\Program Files\Typora\Typora.exe"
              className="path-input"
            />
            <div className="dialog-buttons">
              <button onClick={saveTyporaPath} className="btn-primary">
                保存
              </button>
              <button
                onClick={() => setShowTyporaDialog(false)}
                className="btn-secondary"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
