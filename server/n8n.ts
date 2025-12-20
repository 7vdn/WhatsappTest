import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export async function createCompanyWorkflow(companyName: string, accessToken: string) {
  if (!process.env.N8N_HOST || !process.env.N8N_API_KEY) {
    console.warn('n8n configuration missing, skipping workflow creation');
    return;
  }

  const n8nHost = process.env.N8N_HOST.replace(/\/+$/, "");

  try {
    // Try to find clu.json or Neurt.json in multiple locations
    const possiblePaths = [
      path.resolve(process.cwd(), 'clu.json'), // Priority: clu.json in Root
      path.resolve(process.cwd(), 'Neurt.json'), // Fallback: Neurt.json in Root
      path.resolve(process.cwd(), 'dist', 'clu.json'), // Priority: clu.json in Dist
      path.resolve(process.cwd(), 'dist', 'Neurt.json'), // Fallback: Neurt.json in Dist
    ];

    // If __dirname is available (in CommonJS or via banner shim), use it
    if (typeof __dirname !== 'undefined') {
       possiblePaths.push(path.resolve(__dirname, 'clu.json'));
       possiblePaths.push(path.resolve(__dirname, 'Neurt.json'));
    } else {
        // Fallback for ESM without banner
       try {
         const __filename = fileURLToPath(import.meta.url);
         const __dirname = path.dirname(__filename);
         possiblePaths.push(path.resolve(__dirname, 'clu.json'));
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
       console.error(`Could not find clu.json or Neurt.json in any of the checked paths: ${possiblePaths.join(', ')}`);
       return;
    }

    console.log(`Using workflow template from: ${templatePath}`);

    const fileContent = await fs.readFile(templatePath, 'utf-8');
    let workflow;
    try {
      workflow = JSON.parse(fileContent);
    } catch (e) {
      console.error(`Failed to parse template (${templatePath}):`, e);
      return;
    }

    // Verify basic structure
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
       console.error('Template does not look like a valid workflow (missing "nodes" array)');
       return;
    }

    console.log(`Loaded workflow template. Name: ${workflow.name}, Nodes: ${workflow.nodes.length}`);

    // Update access token in WhatsappApi nodes
    let updatedNodesCount = 0;
    workflow.nodes.forEach((node: any) => {
      // Check if node name starts with WhatsappApi (e.g. WhatsappApi, WhatsappApi1, WhatsappApi13)
      if (node.name && node.name.startsWith('WhatsappApi')) {
        console.log(`Inspecting node: ${node.name} for x-access-token...`);
        
        // Check for x-access-token in parameters.headerParameters.parameters
        if (node.parameters?.headerParameters?.parameters && Array.isArray(node.parameters.headerParameters.parameters)) {
          const parameters = node.parameters.headerParameters.parameters;
          const tokenParam = parameters.find((p: any) => p.name === 'x-access-token');
          
          if (tokenParam) {
            console.log(`Found x-access-token in ${node.name}. Old value: ${tokenParam.value.substring(0, 10)}...`);
            tokenParam.value = accessToken;
            console.log(`Updated x-access-token in ${node.name} to: ${accessToken.substring(0, 10)}...`);
            updatedNodesCount++;
          } else {
             console.log(`Node ${node.name} has headerParameters but no x-access-token param.`);
          }
        } else {
             console.log(`Node ${node.name} does not have valid headerParameters.parameters structure.`);
        }
      }
    });

    console.log(`Updated x-access-token in ${updatedNodesCount} nodes.`);

    // Construct a clean payload with only allowed fields
    const newWorkflow = {
      name: companyName,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings,
      staticData: workflow.staticData,
      // tags: [], // Safest to omit tags entirely for creation unless we have valid IDs
    };

    // Send to n8n API
    console.log(`Sending workflow creation request to ${n8nHost}...`);
    // console.log('Payload preview:', JSON.stringify(newWorkflow).substring(0, 200) + '...');

    const response = await fetch(`${n8nHost}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newWorkflow),
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
