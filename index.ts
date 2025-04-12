import { NerdGraphService } from './src/services/nerdgraph.js';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from 'zod-to-json-schema';
import { DeploymentOptions } from './src/types/index.js';
import * as nerdgraph from './src/services/nerdgraph.js';

// MCPサーバーの初期化
const server = new Server(
    {
      name: "newrelic-change-tracking-mcp-server",
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
);

const API_KEY = process.env.NEW_RELIC_API_KEY;
const NERDGRAPH_API_URL = process.env.NERDGRAPH_API_URL || 'https://api.newrelic.com/graphql';

if (!API_KEY) {
  console.error('ERROR: NEW_RELIC_API_KEY is not set in the environment variables.');
  process.exit(1);
}

// 必要なサービスの初期化
const nerdGraphService = new NerdGraphService(API_KEY, NERDGRAPH_API_URL);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "newrelic_change_tracking_create_deployment",
        description: "Call the New Relic Change Tracking function's Create Deployment.",
        inputSchema: zodToJsonSchema(nerdgraph.NewRelicChangeTrackingCreateDeploymentSchema)
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    console.error('Received tool call request:', request);

    if (!request.params.arguments) {
        throw new Error("Arguments are required");
    }

    // パラメータにアクセスする正しい方法
    const parameters = request.params?.arguments;
    if (!parameters.name || !parameters.version) {
      return { error: `アプリ名又は Version が設定されていません ${parameters.appName} ${parameters.version}` };
    }
    // パラメータまたは環境変数からアプリ名を取得
    const entityName = String(parameters.name);
    const domainTypeParam = parameters?.domainType;
    const domainType = domainTypeParam && String(domainTypeParam).trim() !== '' 
        ? String(domainTypeParam) 
        : undefined;
    const entityGuid = await nerdGraphService.entitySearch(entityName, domainType)

    let timestamp = Date.now(); // デフォルトは現在のUNIXタイムスタンプ
    
    if (parameters?.timestamp !== undefined) {
      // タイムスタンプが数値か文字列の場合は変換する
      const parsedTimestamp = Number(parameters.timestamp);
      
      // 妥当なUNIXタイムスタンプか確認（ミリ秒単位）
      // 現在時刻の前後24時間以内のみ許可
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000; // 24時間のミリ秒
      if (!isNaN(parsedTimestamp) && 
          parsedTimestamp >= now - oneDayMs && 
          parsedTimestamp <= now + oneDayMs) {
          timestamp = parsedTimestamp;
      } else {
        console.error(`Invalid timestamp value: ${parameters.timestamp}, using current time instead`);
      }
    }

    // パラメータの型変換とチェック
    const version = String(parameters.version || ''); // 必ず文字列に変換
    const userParam = parameters?.user ? String(parameters.user) : 'Claude Desktop';
    const descriptionParam = parameters?.description ? String(parameters.description) : undefined;
    const commitParam = parameters?.commit ? String(parameters.commit) : undefined;
    const changelogParam = parameters?.changelog ? String(parameters.changelog) : undefined;

    // デプロイメントオプションの構築
    const deploymentOptions: DeploymentOptions = {
        version: version,
        entityGuid: entityGuid,
        user: userParam,
        timestamp: timestamp,
        description: descriptionParam,
        deploymentType: 'BASIC', // デフォルトのデプロイメントタイプ
        commit: commitParam,
        changelog: changelogParam
    };

    console.error(`Creating deployment for entity '${entityName || '(not specified)'}' with options:`, deploymentOptions);

    // NerdGraphサービスを使用してデプロイメントを作成
    const response = await nerdGraphService.createDeployment(deploymentOptions);
    const result = response.data?.changeTrackingCreateDeployment;

    if (result) {
        return {
            content: [
                {
                    type: 'text',
                    text: `✅ デプロイが正常に記録されました！\n- エンティティ: ${entityName}\n- バージョン: ${result.version}\n- デプロイID: ${result.deploymentId}\n- エンティティGUID: ${result.entityGuid}`
                }
            ],
        };
    }
    return { error: '必要なパラメータが不足しています。entityName、およびversionが必要です' };
  } catch (error) {
    console.error('Tool call error:', error);
    return { error: error instanceof Error ? error.message : '不明なエラー' };
  }
});

async function main() {
    const transport = new StdioServerTransport();
    // MCPサーバーを起動
    await server.connect(transport);
    console.error("New Relic Change Tracking MCP Server running on stdio");
}

// プログラムを実行
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
