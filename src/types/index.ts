export interface DeploymentOptions {
  version: string;
  user?: string;
  timestamp?: number;
  groupId?: string;
  entityGuid?: string;
  description?: string;
  deploymentType?: 'BASIC' | 'BLUE_GREEN' | 'CANARY' | 'ROLLING' | 'SHADOW';
  deepLink?: string;
  commit?: string;
  changelog?: string;
}

export interface DeploymentResponse {
  changelog?: string;
  commit?: string;
  deepLink?: string;
  deploymentId: string;
  deploymentType?: string;
  description?: string;
  entityGuid: string;
  groupId?: string;
  timestamp?: number;
  user?: string;
  version: string;
}

export interface NerdGraphResponse {
  data?: {
    changeTrackingCreateDeployment?: DeploymentResponse;
  };
  errors?: Array<{
    message: string;
    path: string[];
  }>;
}

export interface PromptRequest {
  appName: string;
  version: string;
  description?: string;
  user?: string;
  commit?: string;
  changelog?: string;
  entityGuid?: string;
}
