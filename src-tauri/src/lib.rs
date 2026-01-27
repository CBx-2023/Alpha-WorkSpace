use std::process::Command;
use std::path::Path;
use tauri_plugin_store::StoreExt;

// 打开 URL 的命令
#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", &url])
            .spawn()
            .map_err(|e| format!("无法打开浏览器: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("无法打开浏览器: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("无法打开浏览器: {}", e))?;
    }
    
    Ok(())
}

// 自动检测 Typora 安装路径
#[tauri::command]
fn auto_detect_typora_path() -> Option<String> {
    #[cfg(target_os = "windows")]
    {
        // 优先尝试从注册表读取（最准确的方法）
        if let Some(registry_path) = read_typora_from_registry() {
            if Path::new(&registry_path).exists() {
                return Some(registry_path);
            }
        }
        
        // 如果注册表读取失败，回退到常见路径检测
        let possible_paths = vec![
            r"C:\Program Files\Typora\Typora.exe".to_string(),
            r"C:\Program Files (x86)\Typora\Typora.exe".to_string(),
            format!(r"{}\AppData\Local\Programs\Typora\Typora.exe", 
                std::env::var("USERPROFILE").unwrap_or_default()),
            format!(r"{}\Typora\Typora.exe", 
                std::env::var("LOCALAPPDATA").unwrap_or_default()),
        ];
        
        for path in possible_paths {
            if Path::new(&path).exists() {
                return Some(path);
            }
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        let possible_paths = vec![
            "/Applications/Typora.app/Contents/MacOS/Typora".to_string(),
        ];
        
        for path in possible_paths {
            if Path::new(&path).exists() {
                return Some(path);
            }
        }
    }
    
    None
}

// Windows 注册表读取函数
#[cfg(target_os = "windows")]
fn read_typora_from_registry() -> Option<String> {
    use winreg::enums::*;
    use winreg::RegKey;
    
    // 尝试读取 HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Typora.exe
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    
    if let Ok(app_paths) = hklm.open_subkey(r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Typora.exe") {
        // 读取默认值（Path）
        if let Ok(path) = app_paths.get_value::<String, _>("") {
            return Some(path);
        }
        
        // 有些应用在 "Path" 键中存储路径
        if let Ok(path) = app_paths.get_value::<String, _>("Path") {
            // Path 键通常存储的是目录，需要拼接 Typora.exe
            let full_path = format!(r"{}\Typora.exe", path.trim_end_matches('\\'));
            if Path::new(&full_path).exists() {
                return Some(full_path);
            }
        }
    }
    
    // 也尝试读取 HKEY_CURRENT_USER（用户级安装）
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(app_paths) = hkcu.open_subkey(r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Typora.exe") {
        if let Ok(path) = app_paths.get_value::<String, _>("") {
            return Some(path);
        }
    }
    
    None
}

// 启动 Typora 的命令
#[tauri::command]
fn launch_typora(app: tauri::AppHandle) -> Result<(), String> {
    // 从持久化存储中获取 Typora 路径
    let store = app.store("store.json")
        .map_err(|e| format!("无法访问存储: {}", e))?;
    
    let typora_path: Option<String> = store.get("typora_path")
        .and_then(|v| v.as_str().map(|s| s.to_string()));
    
    if let Some(exe_path) = typora_path {
        if exe_path.is_empty() {
            return Err("请先配置 Typora 路径".to_string());
        }
        
        Command::new(&exe_path)
            .spawn()
            .map_err(|e| format!("无法启动 Typora: {}。请检查路径是否正确。", e))?;
        
        Ok(())
    } else {
        Err("请先配置 Typora 路径".to_string())
    }
}

// 获取 Typora 路径
#[tauri::command]
fn get_typora_path(app: tauri::AppHandle) -> Option<String> {
    let store = app.store("store.json").ok()?;
    store.get("typora_path")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
}

// 设置 Typora 路径
#[tauri::command]
fn set_typora_path(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let store = app.store("store.json")
        .map_err(|e| format!("无法访问存储: {}", e))?;
    
    store.set("typora_path", serde_json::json!(path));
    store.save()
        .map_err(|e| format!("保存失败: {}", e))?;
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            open_url,
            auto_detect_typora_path,
            launch_typora,
            get_typora_path,
            set_typora_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
