import fetch from 'node-fetch';
import {DeploymentOptions, EntitySearchResponse, NerdGraphResponse} from '../types/index.js';
import {z} from "zod";

export const NewRelicChangeTrackingCreateDeploymentSchema = z.object({
  version: z.string().describe("Version"),
  name: z.string().describe("Name"),
  entityGuid: z.string().optional().describe("Entity GUID - defaults to mapped value or environment variable if not provided"),
  description: z.string().optional().describe("Description"),
  user: z.string().optional().describe("User"),
  commit: z.string().optional().describe("Commit"),
  changelog: z.string().optional().describe("Changelog"),
  timestamp: z.union([z.number(), z.string()]).optional().describe("Timestamp - defaults to current time"),
})

export class NerdGraphService {
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, apiUrl = 'https://api.newrelic.com/graphql') {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  /**
   * Create a deployment marker in New Relic Change Tracking
   */
  async createDeployment(options: DeploymentOptions): Promise<NerdGraphResponse> {
    // Default timestamp to now if not provided
    if (!options.timestamp) {
      options.timestamp = Date.now();
    }

    // Create GraphQL mutation
    const query = `
      mutation {
        changeTrackingCreateDeployment(
          deployment: {
            version: "${options.version}"
            ${options.user ? `user: "${options.user}"` : ''}
            ${options.timestamp ? `timestamp: ${options.timestamp}` : ''}
            ${options.groupId ? `groupId: "${options.groupId}"` : ''}
            entityGuid: "${options.entityGuid}"
            ${options.description ? `description: "${options.description}"` : ''}
            ${options.deploymentType ? `deploymentType: ${options.deploymentType}` : ''}
            ${options.deepLink ? `deepLink: "${options.deepLink}"` : ''}
            ${options.commit ? `commit: "${options.commit}"` : ''}
            ${options.changelog ? `changelog: "${options.changelog}"` : ''}
          }
        ) {
          changelog
          commit
          deepLink
          deploymentId
          deploymentType
          description
          entityGuid
          groupId
          timestamp
          user
          version
        }
      }
    `;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-Key': this.apiKey
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as NerdGraphResponse;
      
      if (data.errors && data.errors.length > 0) {
        throw new Error(`GraphQL Error: ${data.errors[0].message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating deployment:', error);
      throw error;
    }
  }

  /**
   * Create a minimal deployment marker with just version and entityGuid
   */
  async createMinimalDeployment(version: string, entityGuid: string): Promise<NerdGraphResponse> {
    return this.createDeployment({
      version,
      entityGuid
    });
  }

  /**
   *  Search for an entity by guid
   */
  async entitySearch(name: string): Promise<string> {
    const query = `
      {
        actor {
          user {
            name
          }
          entitySearch(
            query: "name = '${name}' AND domainType IN ('APM-APPLICATION')"
            options: {
              limit: 1
            }
          ) {
            results {
              entities {
                guid
              }
            }
          }
        }
      }`
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-Key': this.apiKey
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json() as EntitySearchResponse;
      console.error('response guid:', data.data.actor.entitySearch.results.entities[0]?.guid);
      return data.data.actor.entitySearch.results.entities[0]?.guid;
    }
    catch (e) {
      console.error("Entity search failed:", e);
      throw new Error(`Failed to search entity with name: ${name}, message: ${e}`);
    }
  }
}
