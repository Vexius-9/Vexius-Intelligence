export interface AgentManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  entryPoint: string;
  permissions: string[];
}

export class VexiusClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.vexiusintelligence.tech/ai') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async runAgent(agentType: string, query: string, workspaceId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/agents/deep-researcher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        workspaceId,
        query,
      }),
    });

    if (!response.ok) {
      throw new Error(`Vexius API call failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export class VexiusAgent {
  public manifest: AgentManifest;

  constructor(manifest: AgentManifest) {
    this.validateManifest(manifest);
    this.manifest = manifest;
  }

  private validateManifest(manifest: AgentManifest) {
    if (!manifest.id || !manifest.name || !manifest.version) {
      throw new Error('Invalid Agent Manifest: id, name, and version are required.');
    }
  }

  async execute(context: any): Promise<any> {
    return {
      status: 'success',
      agentId: this.manifest.id,
      executedAt: new Date().toISOString(),
      result: 'Custom Vexius Agent execution trace completed.',
    };
  }
}
