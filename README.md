# LINE LIFF Mall V2

中油行動商城團購系統，整合 LINE LIFF、Supabase、商品管理、團主操作、紙本
DM 與操作導引，並透過 Google Cloud Run 部署。

## 開始閱讀

- [完整系統架構](docs/ARCHITECTURE.md)
- [AI／Coding Agent 接手規則](AGENTS.md)

## 本機啟動

準備好 `.env.local` 後執行：

```bash
npm ci
npm run dev
```

正式建置檢查：

```bash
npm run build
```

Windows PowerShell 如果封鎖 `npm.ps1`，請改用 `npm.cmd`。

## 主要頁面

- `/`：LINE LIFF 團購商城
- `/admin`：商品管理後台
- `/dm?leaderId=...`：團主紙本商品型錄
- `/intro`：團購主操作導引

請勿把 `.env.local`、Supabase service role key、管理 PIN 或其他敏感憑證
提交到 Git。

