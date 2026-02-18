# Chatwork OAuth Sample

Chatwork OAuth2 (Authorization Code + PKCE) のサンプルアプリケーション。

Hono + TypeScript で構築し、`GET /rooms` などの Chatwork API を OAuth2 認証経由で呼び出す。

## 技術スタック

- **Runtime**: Node.js >= 20
- **Framework**: Hono + @hono/node-server (HTTPS)
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Linter/Formatter**: Biome + oxlint
- **Test**: Vitest

## 前提条件

- Node.js 20 以上
- pnpm
- OpenSSL (Ubuntu ではプリインストール済み)
- Chatwork OAuth クライアント登録済み

## Chatwork OAuth クライアントの設定

1. [Chatwork OAuth クライアント管理](https://www.chatwork.com/service/packages/chatwork/subpackages/oauth/index.php) にアクセス
2. 新しいクライアントを作成
3. リダイレクト URI に `https://127.0.0.1:8000/callback` を設定
4. `client_id` と `client_secret` を控える

## セットアップ

```bash
make
```

これだけで以下が実行される:

1. `pnpm install` で依存パッケージをインストール
2. `certs/` に自己署名SSL証明書を生成
3. `.env.example` を `.env` にコピー

セットアップ後、`.env` を編集して Chatwork の認証情報を入力:

```
CHATWORK_CLIENT_ID=your_client_id
CHATWORK_CLIENT_SECRET=your_client_secret
CHATWORK_REDIRECT_URI=https://127.0.0.1:8000/callback
PORT=8000
```

## 起動

```bash
make dev
```

ブラウザで https://127.0.0.1:8000 を開く。

## Ubuntu での Localhost SSL 化手順

このプロジェクトでは `make` 実行時に自動で自己署名証明書が生成されるが、手動で行う場合の手順を以下に示す。

### 1. 自己署名証明書の生成

```bash
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/server.key -out certs/server.crt \
  -days 365 -subj "/CN=127.0.0.1" \
  -addext "subjectAltName=IP:127.0.0.1"
```

ポイント:
- `-nodes`: パスフレーズなし (開発用)
- `-addext "subjectAltName=IP:127.0.0.1"`: SAN を設定しないとブラウザが証明書を拒否する
- `-days 365`: 有効期限 1 年

### 2. ブラウザでの証明書の受け入れ

自己署名証明書のため、初回アクセス時にブラウザが警告を表示する。

**Chrome の場合:**

1. https://127.0.0.1:8000 にアクセス
2. 「この接続ではプライバシーが保護されません」の画面で「詳細設定」をクリック
3. 「127.0.0.1 にアクセスする（安全ではありません）」をクリック

**Firefox の場合:**

1. https://127.0.0.1:8000 にアクセス
2. 「警告: 潜在的なセキュリティリスクあり」の画面で「詳細情報」をクリック
3. 「危険性を承知で続行」をクリック

### 3. (オプション) システムの証明書ストアに追加

毎回の警告を避けたい場合、証明書をシステムに信頼させる:

```bash
sudo cp certs/server.crt /usr/local/share/ca-certificates/localhost-dev.crt
sudo update-ca-certificates
```

削除する場合:

```bash
sudo rm /usr/local/share/ca-certificates/localhost-dev.crt
sudo update-ca-certificates --fresh
```

## 開発コマンド

| コマンド | 説明 |
|---|---|
| `make` | セットアップ (依存関係 + SSL証明書 + .env) |
| `make dev` | 開発サーバー起動 (watch mode) |
| `make test` | テスト実行 |
| `make lint` | リンター実行 |
| `make lint-fix` | リンター実行 (自動修正) |
| `make format` | コードフォーマット |
| `make clean` | 生成ファイル削除 |
| `make help` | コマンド一覧表示 |

## プロジェクト構成

```
src/
  index.ts              # HTTPS サーバー起動
  app.ts                # Hono アプリケーション定義
  routes/
    auth.ts             # OAuth2 ルート (/login, /callback, /logout)
    api.ts              # Chatwork API ルート (/api/rooms, /api/me)
  lib/
    chatwork-oauth.ts   # OAuth2 ユーティリティ (PKCE, トークン交換)
    chatwork-api.ts     # Chatwork API クライアント
    session.ts          # インメモリセッションストア
    types.ts            # TypeScript 型定義
test/
  routes.test.ts        # ルートの結合テスト
  lib/
    chatwork-oauth.test.ts  # OAuth ユーティリティの単体テスト
    chatwork-api.test.ts    # API クライアントの単体テスト
```

## API エンドポイントの追加方法

1. `src/lib/chatwork-api.ts` の `ChatworkApiClient` にメソッドを追加:

```typescript
async getRoomMessages(roomId: number): Promise<ChatworkMessage[]> {
  return this.request<ChatworkMessage[]>(`/rooms/${roomId}/messages`)
}
```

2. `src/lib/types.ts` にレスポンスの型を追加

3. `src/routes/api.ts` にルートを追加:

```typescript
apiRoutes.get("/rooms/:roomId/messages", async (c) => {
  const client = c.get("chatworkClient" as never) as ChatworkApiClient
  const roomId = Number(c.req.param("roomId"))
  const messages = await client.getRoomMessages(roomId)
  return c.json(messages)
})
```

## ライセンス

MIT
