# WSL + Chatwork OAuth 起動時の詰まりポイントと対応記録

最終更新: 2026-02-18

## 実施内容

1. `git pull` で `main` を最新化
2. README を確認してセットアップと起動を実施
3. WSL 環境でのアクセス不具合を切り分け
4. OAuth エラー (`12000`, `16000`) の原因を特定して対処手順を整理

## 詰まったポイントと対処

### 1. 依存パッケージのインストール失敗

- 症状:
  - `make setup` / `pnpm install` で `EAI_AGAIN registry.npmjs.org`
- 原因:
  - 実行環境のネットワーク制限で npm registry の名前解決に失敗
- 対処:
  - ネットワーク許可付きで `pnpm install` を再実行し、依存導入を完了

### 2. `make dev` で `tsx: not found`

- 症状:
  - `pnpm dev` 実行時に `tsx: not found`
- 原因:
  - 依存インストールが途中失敗しており `node_modules` が不完全
- 対処:
  - `pnpm install` を完了させたあと再起動

### 3. `tsx watch` の IPC 作成で `EPERM`

- 症状:
  - `listen EPERM ... /tmp/tsx-1000/*.pipe`
- 原因:
  - サンドボックス制限下で `tsx watch` の IPC ソケット作成が拒否
- 対処:
  - 制限外実行で `make dev` を起動

### 4. `EADDRINUSE: 8000`

- 症状:
  - 再起動時に `port 8000 already in use`
- 原因:
  - 既存の開発サーバープロセスが残存
- 対処:
  - 使用中 PID を確認して停止後に `make dev` を再起動

### 5. ホストOS(Windows)側から `127.0.0.1:8000` に届かない

- 症状:
  - WSL 内では動作するがホストOSの localhost でアクセス不可
- 切り分け:
  - サーバーは `*:8000` で待受
  - `https://<WSL_IP>:8000` には応答 (`200 OK`)
- 対処:
  - ホストOSからは `https://<WSL_IP>:8000` でアクセス
  - OAuth 動作時は `redirect_uri` と開始URLのホストを一致させる

### 6. Chatwork OAuth `Error Code 12000`

- 症状:
  - `The client ID 'your_client_id' is unknown`
- 原因:
  - `.env` がサンプル値のまま
- 対処:
  - `.env` の `CHATWORK_CLIENT_ID` / `CHATWORK_CLIENT_SECRET` を実値へ変更

### 7. Chatwork OAuth `Error Code 16000`

- 症状:
  - `reserved authorization request is not found or already timed out`
- 原因:
  - 認可リクエストの期限切れ、または `code` 再利用
- 対処:
  - `/logout` でセッションをクリアし、`/login` からやり直し
  - `/callback?...` URL を再読込しない

## 運用上の注意

1. `CHATWORK_REDIRECT_URI` と実際に開くURLのホストを必ず一致させる
2. Chatwork 側の Redirect URI 設定も完全一致にする
3. WSL IP でアクセスする場合は自己署名証明書の警告が出る

## 当日の結論

- アプリ本体の重大不具合ではなく、環境差分 (WSL/ネットワーク/URL不一致) が主因
- 現状は `make dev` 起動済みで、`GET /` および `GET /login` まで到達確認済み
