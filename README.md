# MCP Server for New Relic Change Tracking

チャットベースでNew Relic Change Trackingと連携するためのMCPサーバー

## 概要

このツールは、New Relicの変更追跡（Change Tracking）をチャットベースで簡単に記録・連携するためのサーバーです。
Model Context Protocol (MCP)を使用して、LLMからの直接リクエストをサポートし、アプリケーションのデプロイイベントなどを簡単に記録できます。

※MCPサーバーの実装練習のために作成したリポジトリになるので本番での利用などには向いていません。

## セットアップ

### docker build

```shell
# イメージのビルド
docker build -t newrelic-change-tracking-mcp-server .
```

## 使い方

### 必要な環境変数

- `NEW_RELIC_API_KEY` - New RelicのAPIキー([USER KEY](https://docs.newrelic.com/docs/apis/intro-apis/new-relic-api-keys/#user-key))を指定します。

Claude Desktop MCP を使用する場合は `claude_desktop_config.json` に以下のように設定できます：

### Docker

```json
{
  "mcpServers": {
    "newrelic-change-tracking": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "NEW_RELIC_API_KEY",
        "newrelic-change-tracking-mcp-server"
      ],
      "env": {
        "NEW_RELIC_API_KEY": "Set New Relic User Key"
      }
    }
  }
}
```

### 使用方法

プロンプトを入力してアプリケーションの変更を記録します：

#### 必須パラメータ

以下のパラメータは必須です：

- `アプリ名`: 変更を記録するアプリケーションの名前
- `version`: デプロイするバージョン

```text
<アプリ名> のアプリに <version> の version でデプロイを記録してください
```

例：
```text
my-application のアプリに 1.0.0 の version でデプロイを記録してください
```

#### オプショナルパラメータ

以下のパラメータはオプションです：

- `user`: デプロイを実行したユーザー名（デフォルト: "system"）
- `description`: デプロイの説明
- `changelog`: 変更内容の詳細
- `repository`: リポジトリURL
- `commit`: コミットハッシュ
- `domainType`: エンティティのドメインタイプ（例: "APM-APPLICATION", "BROWSER-APPLICATION", "MOBILE-APPLICATION"）

```text
<アプリ名> のアプリに <version> の version でデプロイを記録してください
user: <ユーザー名>
description: <説明>
changelog: <変更内容>
repository: <リポジトリURL>
commit: <コミットハッシュ>
domainType: <ドメインタイプ>
```

例：
```text
my-application のアプリに 1.0.0 の version でデプロイを記録してください
user: yuzujoe
description: Spring release update
changelog: - Fixed login bug\n- Added new dashboard feature
repository: リポジトリURL
commit: コミットハッシュ
domainType: APM-APPLICATION
```
