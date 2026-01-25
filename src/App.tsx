import { useState, useEffect, useRef } from "react";
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
  position: { x: number; y: number }; // 绝对像素坐标
  inBucket: boolean; // 是否在桶中
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

  // 恢复丢失的状态
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showFullManual, setShowFullManual] = useState(false);
  const [newAppForm, setNewAppForm] = useState({
    name: "",
    target: "",
    icon: ""
  });

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cards, setCards] = useState<AppCard[]>([
    {
      id: "drawio",
      name: "draw.io",
      icon: drawioPng,
      type: "url",
      action: "https://app.diagrams.net/",
      position: { x: 300, y: 200 },
      inBucket: false,
    },
    {
      id: "typora",
      name: "typora",
      icon: typoraPng,
      type: "local",
      action: "launch_typora",
      position: { x: 500, y: 200 },
      inBucket: false,
    },
    {
      id: "gemini",
      name: "gemini",
      icon: geminiPng,
      type: "url",
      action: "https://gemini.google.com/",
      position: { x: 400, y: 350 },
      inBucket: false,
    },
  ]);

  // 加载保存的 Typora 路径
  useEffect(() => {
    const loadTyporaPath = async () => {
      try {
        const savedPath = await invoke<string | null>("get_typora_path");
        if (savedPath) {
          setTyporaPath(savedPath);
          return; // 已有路径，无需自动检测
        }

        // 如果没有保存的路径，尝试自动检测
        const detectedPath = await invoke<string | null>("auto_detect_typora_path");
        if (detectedPath) {
          await invoke("set_typora_path", { path: detectedPath });
          setTyporaPath(detectedPath);
          showToast("Typora 路径已自动配置", "success");
          console.log("Typora 路径已自动配置:", detectedPath);
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
            return saved ? { ...card, position: saved.position, inBucket: saved.inBucket } : card;
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

  // 鼠标拖拽状态 - 使用 ref 提高性能
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const dragElementRef = useRef<HTMLDivElement | null>(null);
  const hasMovedRef = useRef(false); // 跟踪是否实际移动了

  // 处理卡片点击
  const handleCardClick = (e: React.MouseEvent, card: AppCard) => {
    // 如果刚刚拖拽过，不触发点击
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      hasMovedRef.current = false;
      return;
    }

    if (card.type === "url") {
      openUrl(card.action);
    } else if (card.id === "typora") {
      launchTypora();
    }
  };

  // 鼠标按下 - 开始拖拽
  const handleMouseDown = (e: React.MouseEvent, cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    e.preventDefault();
    setDraggedCard(cardId);
    setIsDragging(true);
    hasMovedRef.current = false; // 重置移动标志

    // 保存拖拽元素引用
    dragElementRef.current = e.currentTarget as HTMLDivElement;

    // 记录起始位置
    dragStartPosRef.current = {
      x: e.clientX - card.position.x,
      y: e.clientY - card.position.y,
    };
  };

  // 鼠标移动 - 直接操作DOM，避免状态更新
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedCard || !dragElementRef.current) return;

    const newX = e.clientX - dragStartPosRef.current.x;
    const newY = e.clientY - dragStartPosRef.current.y;

    // 标记已经移动
    hasMovedRef.current = true;

    // 直接更新DOM位置，不触发React重渲染
    dragElementRef.current.style.left = `${newX}px`;
    dragElementRef.current.style.top = `${newY}px`;
  };

  // 鼠标松开 - 更新状态并保存
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || !draggedCard) return;

    const newX = e.clientX - dragStartPosRef.current.x;
    const newY = e.clientY - dragStartPosRef.current.y;

    // 检查是否在桶上
    const bucketElement = document.querySelector('.bucket-icon');
    let isOverBucket = false;

    if (bucketElement) {
      const bucketRect = bucketElement.getBoundingClientRect();
      isOverBucket =
        e.clientX >= bucketRect.left &&
        e.clientX <= bucketRect.right &&
        e.clientY >= bucketRect.top &&
        e.clientY <= bucketRect.bottom;
    }

    // 更新状态
    const updatedCards = cards.map((card) => {
      if (card.id === draggedCard) {
        return {
          ...card,
          position: { x: newX, y: newY },
          inBucket: isOverBucket,
        };
      }
      return card;
    });

    setCards(updatedCards);
    saveLayout(updatedCards);

    if (isOverBucket) {
      showToast("图标已添加到桶中", "success");
    }

    // 重置拖拽状态
    if (dragElementRef.current) {
      dragElementRef.current.style.transform = '';
    }
    dragElementRef.current = null;
    setDraggedCard(null);
    setIsDragging(false);
  };

  // 渲染函数助手
  const getVisibleCards = () => cards.filter((card) => !card.inBucket);
  const getBucketCards = () => cards.filter((card) => card.inBucket);

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showToast("图标文件过大，请小于2MB", "error");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAppForm(prev => ({ ...prev, icon: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddApp = () => {
    if (!newAppForm.name || !newAppForm.target || !newAppForm.icon) {
      showToast("请填写完整信息", "error");
      return;
    }

    const newApp: AppCard = {
      id: crypto.randomUUID(),
      name: newAppForm.name,
      icon: newAppForm.icon,
      type: newAppForm.target.startsWith("http") ? "url" : "local",
      action: newAppForm.target,
      position: { x: window.innerWidth / 2 - 50, y: window.innerHeight / 2 - 50 },
      inBucket: false
    };

    const updatedCards = [...cards, newApp];
    setCards(updatedCards);
    saveLayout(updatedCards);

    setShowAddDialog(false);
    setNewAppForm({ name: "", target: "", icon: "" });
    showToast("应用添加成功！", "success");
  };

  // 重置布局 - 打开确认框
  const handleResetLayout = () => {
    setShowResetConfirm(true);
  };

  // 确认重置逻辑
  const confirmReset = () => {
    const defaultPositions: Record<string, { x: number, y: number }> = {
      "drawio": { x: 300, y: 200 },
      "typora": { x: 500, y: 200 },
      "gemini": { x: 400, y: 350 }
    };

    const newCards = cards.map(card => ({
      ...card,
      position: defaultPositions[card.id] || { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      inBucket: false
    }));

    setCards(newCards);
    saveLayout(newCards);
    setShowResetConfirm(false);
    showToast("布局已重置", "success");
  };

  return (
    <div
      className="app"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 顶部栏 */}
      <div className="top-bar">
        <button
          className="add-btn"
          onClick={() => setShowAddDialog(true)}
          title="添加自定义应用"
        >
          <span className="add-icon">+</span>
        </button>
        <button
          className="reset-btn"
          onClick={handleResetLayout}
          title="重置默认布局"
        >
          <span className="reset-icon">⟳</span>
        </button>
        <button
          className="help-btn"
          onClick={() => setShowHelp(true)}
        >
          <span className="help-icon">?</span>
          <span>使用帮助</span>
        </button>
      </div>

      {/* 主容器 - 可见的图标 */}
      <div className="main-container">
        {getVisibleCards().map((card) => (
          <div
            key={card.id}
            className={`function-card ${draggedCard === card.id ? "dragging" : ""}`}
            onClick={(e) => handleCardClick(e, card)}
            onMouseDown={(e) => handleMouseDown(e, card.id)}
            style={{
              position: "absolute",
              left: `${card.position.x}px`,
              top: `${card.position.y}px`,
              opacity: draggedCard === card.id ? 0.7 : 1,
              cursor: isDragging ? "grabbing" : "grab",
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
            {/* 固定的桶项目 */}
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

            {/* 用户添加的图标 */}
            {getBucketCards().length > 0 && (
              <>
                <div style={{
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  margin: "8px 0"
                }} />
                {getBucketCards().map((card) => (
                  <div
                    key={card.id}
                    className="bucket-item"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, card.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(e, card);
                    }}
                  >
                    <span className="bucket-item-icon">
                      <img src={card.icon} alt={card.name} />
                    </span>
                    <span>{card.name}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* 重置确认对话框 */}
      {showResetConfirm && (
        <div className="dialog-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="dialog" style={{ maxWidth: "400px" }} onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>确认重置</h2>
              <button className="close-btn" onClick={() => setShowResetConfirm(false)}>×</button>
            </div>
            <div style={{ margin: "20px 0", color: "rgba(255,255,255,0.8)", lineHeight: "1.6" }}>
              <p>您确定要恢复默认布局吗？</p>
              <p style={{ fontSize: "14px", marginTop: "8px", opacity: 0.7 }}>这将会把所有图标重置回初始位置，自定义应用将被保留在屏幕中央。</p>
            </div>
            <div className="dialog-buttons">
              <button onClick={confirmReset} className="btn-danger">
                确认重置
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="btn-secondary"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

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
