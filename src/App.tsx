import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

// 导入自定义图标
import drawioPng from "./assets/icons/drawio.png";
import typoraPng from "./assets/icons/typora.png";
import geminiPng from "./assets/icons/gemini.png";
import aistudioPng from "./assets/icons/aistudio.png";
import notebooklmPng from "./assets/icons/notebooklm.png";
import bucketPng from "./assets/icons/谷歌桶.png";

interface AppCard {
  id: string;
  name: string;
  icon: string;
  type: "url" | "local";
  action: string;
  position: { x: number; y: number };
}

interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

function App() {
  const [showBucketMenu, setShowBucketMenu] = useState(false);
  const [showTyporaDialog, setShowTyporaDialog] = useState(false);
  const [typoraPath, setTyporaPath] = useState("");
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [cards, setCards] = useState<AppCard[]>([
    {
      id: "drawio",
      name: "draw.io",
      icon: drawioPng,
      type: "url",
      action: "https://app.diagrams.net/",
      position: { x: 0, y: 0 },
    },
    {
      id: "typora",
      name: "typora",
      icon: typoraPng,
      type: "local",
      action: "launch_typora",
      position: { x: 1, y: 0 },
    },
    {
      id: "gemini",
      name: "gemini",
      icon: geminiPng,
      type: "url",
      action: "https://gemini.google.com/",
      position: { x: 0, y: 1 },
    },
  ]);

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

    // 加载保存的卡片位置
    const savedLayout = localStorage.getItem("alpha-workspace-layout");
    if (savedLayout) {
      try {
        const parsedLayout = JSON.parse(savedLayout);
        setCards((prevCards) =>
          prevCards.map((card) => {
            const saved = parsedLayout.find((c: AppCard) => c.id === card.id);
            return saved ? { ...card, position: saved.position } : card;
          })
        );
      } catch (error) {
        console.error("Failed to load layout:", error);
      }
    }
  }, []);

  // 显示 Toast 通知
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  // 保存卡片位置
  const saveLayout = (updatedCards: AppCard[]) => {
    localStorage.setItem("alpha-workspace-layout", JSON.stringify(updatedCards));
  };

  // 打开 URL
  const openUrl = async (url: string) => {
    try {
      await invoke("open_url", { url });
    } catch (error) {
      showToast(`打开失败: ${error}`, "error");
    }
  };

  // 启动 Typora
  const launchTypora = async () => {
    try {
      await invoke("launch_typora");
    } catch (error) {
      setShowTyporaDialog(true);
    }
  };

  // 保存 Typora 路径
  const saveTyporaPath = async () => {
    if (!typoraPath.trim()) {
      showToast("请输入有效的路径", "error");
      return;
    }

    // 规范化路径：移除首尾引号
    const normalizedPath = typoraPath.trim().replace(/^"|"$/g, '');

    try {
      await invoke("set_typora_path", { path: normalizedPath });
      setShowTyporaDialog(false);
      showToast("Typora 路径已保存！", "success");

      try {
        await invoke("launch_typora");
      } catch (launchError) {
        showToast(`启动失败: ${launchError}。请检查路径是否正确。`, "error");
      }
    } catch (error) {
      showToast(`保存失败: ${error}`, "error");
    }
  };

  // 处理卡片点击
  const handleCardClick = (e: React.MouseEvent, card: AppCard) => {
    // 如果正在拖拽，不触发点击
    if (draggedCard) {
      e.preventDefault();
      return;
    }

    if (card.type === "url") {
      openUrl(card.action);
    } else if (card.id === "typora") {
      launchTypora();
    }
  };

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCard(cardId);
    e.dataTransfer.effectAllowed = "move";
  };

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedCard(null);
  };

  // 拖拽经过
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // 放置
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedCard || draggedCard === targetId) return;

    const updatedCards = [...cards];
    const draggedIndex = updatedCards.findIndex((c) => c.id === draggedCard);
    const targetIndex = updatedCards.findIndex((c) => c.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // 交换位置
    const draggedPos = { ...updatedCards[draggedIndex].position };
    updatedCards[draggedIndex].position = { ...updatedCards[targetIndex].position };
    updatedCards[targetIndex].position = draggedPos;

    setCards(updatedCards);
    saveLayout(updatedCards);
    setDraggedCard(null);
  };

  // 根据位置排序卡片
  const getSortedCards = () => {
    return [...cards].sort((a, b) => {
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y;
      }
      return a.position.x - b.position.x;
    });
  };

  return (
    <div className="app">
      {/* 顶部标签 */}
      <div className="top-badge">Alpha内测版</div>

      {/* 主容器 */}
      <div className="main-container">
        {getSortedCards().map((card) => (
          <div
            key={card.id}
            className={`function-card ${card.id === "gemini" ? "center" : "square"}`}
            onClick={(e) => handleCardClick(e, card)}
            draggable
            onDragStart={(e) => handleDragStart(e, card.id)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, card.id)}
            style={{
              gridColumn: card.position.x + 1,
              gridRow: card.position.y + 1,
              cursor: draggedCard ? "grabbing" : "grab",
              opacity: draggedCard === card.id ? 0.5 : 1,
            }}
          >
            <div className="card-icon">
              <img src={card.icon} alt={card.name} />
            </div>
            <div className="card-label">{card.name}</div>
          </div>
        ))}
      </div>

      {/* Google Bucket */}
      <div className="google-bucket">
        <div
          className="bucket-icon"
          onClick={() => setShowBucketMenu(!showBucketMenu)}
        >
          <img src={bucketPng} alt="Google Bucket" />
        </div>

        {showBucketMenu && (
          <div className="bucket-menu">
            <div
              className="bucket-item"
              onClick={() => openUrl("https://aistudio.google.com/")}
            >
              <span className="bucket-item-icon">
                <img src={aistudioPng} alt="AI Studio" />
              </span>
              <span>AI Studio</span>
            </div>
            <div
              className="bucket-item"
              onClick={() => openUrl("https://notebooklm.google.com/")}
            >
              <span className="bucket-item-icon">
                <img src={notebooklmPng} alt="NotebookLM" />
              </span>
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

      {/* Toast 通知 */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
