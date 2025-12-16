import fs from 'fs/promises';
import path from 'path';

export async function createCompanyWorkflow(companyName: string) {
  if (!process.env.N8N_HOST || !process.env.N8N_API_KEY) {
    console.warn('n8n configuration missing, skipping workflow creation');
    return;
  }

  try {
    // Read the template file
    // Assuming the file is at the project root as specified by the user
    // The user provided absolute path: d:\NEW_NEURT\Web\WhatsappApi-main\Neurt.json
    // In the running application, we should try to find it relative to the project root or use the absolute path if it's stable
    // For this environment, we'll use the absolute path or try to resolve it relative to CWD
    
    let templatePath = path.resolve(process.cwd(), 'Neurt.json');
    
    // Check if file exists
    try {
      await fs.access(templatePath);
    } catch {
       // Fallback to absolute path if CWD resolution fails (though process.cwd() should be correct)
       templatePath = 'd:\\NEW_NEURT\\Web\\WhatsappApi-main\\Neurt.json';
    }

    const fileContent = await fs.readFile(templatePath, 'utf-8');
    const workflow = JSON.parse(fileContent);

    // Update workflow name
    workflow.name = companyName;

    // Remove ID if present to ensure a new workflow is created
    if (workflow.id) {
        delete workflow.id;
    }

    // Send to n8n API
    const response = await fetch(`${process.env.N8N_HOST}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflow),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n API responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Successfully created n8n workflow for company: ${companyName}`, data);
    return data;

  } catch (error) {
    console.error('Failed to create n8n workflow:', error);
    // We don't throw here to avoid blocking user registration, just log the error
    // Unless the requirement is to strictly fail registration if workflow fails.
    // Usually it's better to allow registration and handle this asynchronously or log it.
  }
}
