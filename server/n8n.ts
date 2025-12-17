import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export async function createCompanyWorkflow(companyName: string) {
  if (!process.env.N8N_HOST || !process.env.N8N_API_KEY) {
    console.warn('n8n configuration missing, skipping workflow creation');
    return;
  }

  const n8nHost = process.env.N8N_HOST.replace(/\/+$/, "");

  try {
    // Try to find Neurt.json in multiple locations
    const possiblePaths = [
      path.resolve(process.cwd(), 'Neurt.json'), // Root
      path.resolve(process.cwd(), 'dist', 'Neurt.json'), // Dist (if running from root)
    ];

    // If __dirname is available (in CommonJS or via banner shim), use it
    if (typeof __dirname !== 'undefined') {
       possiblePaths.push(path.resolve(__dirname, 'Neurt.json'));
    } else {
        // Fallback for ESM without banner
       try {
         const __filename = fileURLToPath(import.meta.url);
         const __dirname = path.dirname(__filename);
         possiblePaths.push(path.resolve(__dirname, 'Neurt.json'));
       } catch (e) {
         // ignore
       }
    }

    let templatePath: string | null = null;
    for (const p of possiblePaths) {
      try {
        await fs.access(p);
        templatePath = p;
        break;
      } catch {
        // continue
      }
    }

    if (!templatePath) {
       console.error(`Could not find Neurt.json in any of the checked paths: ${possiblePaths.join(', ')}`);
       return;
    }

    console.log(`Using workflow template from: ${templatePath}`);

    const fileContent = await fs.readFile(templatePath, 'utf-8');
    let workflow;
    try {
      workflow = JSON.parse(fileContent);
    } catch (e) {
      console.error('Failed to parse Neurt.json:', e);
      return;
    }

    // Verify basic structure
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
       console.error('Neurt.json does not look like a valid workflow (missing "nodes" array)');
       return;
    }

    console.log(`Loaded workflow template. Name: ${workflow.name}, Nodes: ${workflow.nodes.length}`);

    // Update workflow name
    workflow.name = companyName;

    // Clean up fields to ensure new workflow creation
    // We keep 'settings' and 'staticData' as they are often required/useful
    // We remove 'pinData' as it contains large execution history
    const fieldsToRemove = ['id', 'active', 'createdAt', 'updatedAt', 'versionId', 'pinData', 'shared', 'tags'];
    fieldsToRemove.forEach(field => delete workflow[field]);
    
    // Explicitly set tags to empty to avoid dependency issues
    workflow.tags = [];

    // Send to n8n API
    console.log(`Sending workflow creation request to ${n8nHost}...`);
    // console.log('Payload preview:', JSON.stringify(workflow).substring(0, 200) + '...');

    const response = await fetch(`${n8nHost}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflow),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`n8n API Error (${response.status} ${response.statusText}):`, errorText);
      throw new Error(`n8n API responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Successfully created n8n workflow for company: ${companyName}`, data);
    return data;

  } catch (error) {
    console.error('Failed to create n8n workflow:', error);
  }
}
