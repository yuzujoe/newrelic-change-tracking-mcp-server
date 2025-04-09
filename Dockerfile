### ビルドステージ ###
FROM node:22.12-alpine AS builder

WORKDIR /app

# ソースファイルをコピー
COPY . .

# npmキャッシュを使用して依存関係をインストール
RUN --mount=type=cache,target=/root/.npm npm install

# TypeScriptのコンパイル
RUN npm run build

# 本番環境用の依存関係をインストール（開発用依存関係は除く）
RUN --mount=type=cache,target=/root/.npm-production npm ci --ignore-scripts --omit=dev

### 実行ステージ ###
FROM node:22.12-alpine AS release

# ビルドステージから必要なファイルのみをコピー
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

# 本番環境を設定
ENV NODE_ENV=production

WORKDIR /app

# 本番環境の依存関係のみをインストール
RUN npm ci --ignore-scripts --omit=dev

# アプリケーションの起動
ENTRYPOINT ["node", "dist/index.js"]
