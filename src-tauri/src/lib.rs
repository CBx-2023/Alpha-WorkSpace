use std::process::Command;
use tauri::Manager;

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

// 启动 Typora 的命令
#[tauri::command]
fn launch_typora(app: tauri::AppHandle) -> Result<(), String> {
    // 从存储中获取 Typora 路径
    let typora_path = app.state::<std::sync::Mutex<Option<String>>>();
    let path = typora_path.lock().unwrap();
    
    if let Some(exe_path) = path.as_ref() {
        if exe_path.is_empty() {
            return Err("请先配置 Typora 路径".to_string());
        }
        
        Command::new(exe_path)
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
    let typora_path = app.state::<std::sync::Mutex<Option<String>>>();
    let path = typora_path.lock().unwrap().clone();
    path
}

// 设置 Typora 路径
#[tauri::command]
fn set_typora_path(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let typora_path = app.state::<std::sync::Mutex<Option<String>>>();
    let mut stored_path = typora_path.lock().unwrap();
    *stored_path = Some(path);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(std::sync::Mutex::new(None::<String>))
        .invoke_handler(tauri::generate_handler![
            open_url,
            launch_typora,
            get_typora_path,
            set_typora_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
