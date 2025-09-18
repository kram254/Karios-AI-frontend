export interface TaskTool {
  id: string;
  name: string;
  description: string;
  category: 'search' | 'automation' | 'analysis';
  available: boolean;
}

export const taskTools: TaskTool[] = [
  {
    id: 'perplexity',
    name: 'Search Perplexity',
    description: 'Advanced AI-powered search and research',
    category: 'search',
    available: true
  },
  {
    id: 'google',
    name: 'Google Search',
    description: 'Web search using Google',
    category: 'search',
    available: true
  },
  {
    id: 'web_scraping',
    name: 'Web Scraping',
    description: 'Extract data from websites',
    category: 'automation',
    available: true
  },
  {
    id: 'browser_automation',
    name: 'Browser Automation',
    description: 'Automate browser actions',
    category: 'automation',
    available: true
  },
  {
    id: 'data_analysis',
    name: 'Data Analysis',
    description: 'Analyze and process data',
    category: 'analysis',
    available: true
  }
];

export class TaskToolsService {
  static getAvailableTools(): TaskTool[] {
    return taskTools.filter(tool => tool.available);
  }

  static getToolsByCategory(category: string): TaskTool[] {
    return taskTools.filter(tool => tool.category === category && tool.available);
  }

  static executeTask(taskDescription: string, selectedTools: string[]): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          result: `Task executed with tools: ${selectedTools.join(', ')}`,
          tools_used: selectedTools
        });
      }, 2000);
    });
  }
}
