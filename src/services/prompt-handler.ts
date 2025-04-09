import { PromptRequest, DeploymentOptions } from '../types/index.js';
import { NerdGraphService } from './nerdgraph.js';

export class PromptHandler {
  private nerdGraphService: NerdGraphService;
  private entityGuidMap: Map<string, string> = new Map();
  private defaultEntityGuid?: string;

  constructor(nerdGraphService: NerdGraphService, defaultEntityGuid?: string) {
    this.nerdGraphService = nerdGraphService;
    this.defaultEntityGuid = defaultEntityGuid;
  }

  // アプリ名からエンティティGUIDを取得または設定
  setEntityGuid(appName: string, entityGuid: string): void {
    this.entityGuidMap.set(appName, entityGuid);
  }

  getEntityGuid(appName: string): string | undefined {
    return this.entityGuidMap.get(appName) || this.defaultEntityGuid;
  }

  // プロンプトを解析してデプロイメント情報を抽出
  parsePrompt(promptText: string): PromptRequest | null {
    // アプリ名の抽出
    const appNameMatch = promptText.match(/アプリ名[\s：:]\s*(.+?)(?:\r?\n|$)/i);
    if (!appNameMatch) return null;
    
    // バージョンの抽出
    const versionMatch = promptText.match(/バージョン[\s：:]\s*(.+?)(?:\r?\n|$)/i);
    
    // 説明の抽出
    const descriptionMatch = promptText.match(/説明[\s：:]\s*(.+?)(?:\r?\n|$)/i);
    
    // ユーザーの抽出
    const userMatch = promptText.match(/ユーザー[\s：:]\s*(.+?)(?:\r?\n|$)/i);
    
    // コミットの抽出
    const commitMatch = promptText.match(/コミット[\s：:]\s*(.+?)(?:\r?\n|$)/i);
    
    // 変更ログの抽出
    const changelogMatch = promptText.match(/変更ログ[\s：:]\s*(.+?)(?:\r?\n|$)/i);
    
    // エンティティGUIDの抽出（明示的に指定された場合）
    const entityGuidMatch = promptText.match(/エンティティ(?:GUID)?[\s：:]\s*(.+?)(?:\r?\n|$)/i);

    return {
      appName: appNameMatch[1].trim(),
      version: versionMatch ? versionMatch[1].trim() : '0.0.1', // デフォルトバージョン
      description: descriptionMatch ? descriptionMatch[1].trim() : undefined,
      user: userMatch ? userMatch[1].trim() : undefined,
      commit: commitMatch ? commitMatch[1].trim() : undefined,
      changelog: changelogMatch ? changelogMatch[1].trim() : undefined,
      entityGuid: entityGuidMatch ? entityGuidMatch[1].trim() : undefined
    };
  }

  // プロンプトからデプロイメントを作成
  async handlePrompt(promptText: string): Promise<string> {
    const request = this.parsePrompt(promptText);
    
    if (!request) {
      return '有効なプロンプトを検出できませんでした。「アプリ名：<アプリ名>」形式で指定してください。';
    }

    // エンティティGUIDの決定（プロンプト内 > マップ > デフォルト）
    const entityGuid = request.entityGuid || this.getEntityGuid(request.appName);
    
    if (!entityGuid) {
      return `アプリ「${request.appName}」のエンティティGUIDが未設定です。まず「エンティティGUID：<GUID>」を設定してください。`;
    }

    // デプロイメントオプションの構築
    const deploymentOptions: DeploymentOptions = {
      version: request.version,
      entityGuid: entityGuid
    };

    // オプションフィールドの追加
    if (request.user) deploymentOptions.user = request.user;
    if (request.description) deploymentOptions.description = request.description;
    if (request.commit) deploymentOptions.commit = request.commit;
    if (request.changelog) deploymentOptions.changelog = request.changelog;

    try {
      // NerdGraphサービスを使用してデプロイメントを登録
      const response = await this.nerdGraphService.createDeployment(deploymentOptions);
      
      const deploymentData = response.data?.changeTrackingCreateDeployment;
      
      if (deploymentData) {
        return `✅ デプロイが正常に記録されました！
- アプリ: ${request.appName}
- バージョン: ${deploymentData.version}
- デプロイID: ${deploymentData.deploymentId}
- エンティティGUID: ${deploymentData.entityGuid}`;
      } else {
        return '✅ デプロイは記録されましたが、詳細情報を取得できませんでした。';
      }
    } catch (error) {
      console.error('Deployment error:', error);
      return `❌ エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`;
    }
  }
}
