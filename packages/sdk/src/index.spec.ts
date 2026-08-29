import { VexiusClient, VexiusAgent } from './index';

describe('VexiusAgent SDK', () => {
  it('should construct VexiusAgent properly if manifest is valid', () => {
    const agent = new VexiusAgent({
      id: 'custom-writer-agent',
      name: 'Custom Writer',
      description: 'Writes drafts',
      version: '1.0.0',
      author: 'Tester',
      entryPoint: './dist/index.js',
      permissions: ['read', 'write'],
    });

    expect(agent.manifest.id).toBe('custom-writer-agent');
    expect(agent.manifest.name).toBe('Custom Writer');
  });

  it('should throw an error during constructor validation if id is missing', () => {
    expect(() => {
      new VexiusAgent({
        id: '',
        name: 'Invalid Agent',
        description: 'Missing id',
        version: '1.0.0',
        author: 'Tester',
        entryPoint: './index.js',
        permissions: [],
      });
    }).toThrow('Invalid Agent Manifest: id, name, and version are required.');
  });

  it('should mock VexiusClient endpoint trigger correctly', async () => {
    const client = new VexiusClient('vexius-key-123', 'http://localhost:3000/ai');
    
    // Inject mock for fetch
    const mockResponse = { id: 'doc-1', name: 'Synthesized Report.md' };
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse),
    });

    const result = await client.runAgent('deep-researcher', 'AI trends', 'workspace-123');
    expect(result.id).toBe('doc-1');
    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      'http://localhost:3000/ai/agents/deep-researcher',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer vexius-key-123',
        },
      })
    );
  });
});
