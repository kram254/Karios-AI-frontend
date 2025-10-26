import { Workflow } from '../types/workflow.types';

export const workflowTemplates: Workflow[] = [
  {
    id: 'simple-scraper',
    name: 'Simple Web Scraper',
    description: 'Scrape a single webpage and extract its content',
    category: 'Web Scraping',
    tags: ['scraping', 'web', 'basic'],
    estimatedTime: '1-2 minutes',
    difficulty: 'Beginner',
    nodes: [
      {
        id: 'start',
        type: 'start',
        position: { x: 100, y: 100 },
        data: {
          label: 'Start',
          inputVariables: [
            { name: 'url', type: 'string', required: true, description: 'URL to scrape' }
          ]
        }
      },
      {
        id: 'scrape',
        type: 'mcp',
        position: { x: 100, y: 250 },
        data: {
          label: 'Scrape Page',
          mcpServers: [
            {
              id: 'firecrawl',
              name: 'Firecrawl',
              label: 'Firecrawl Web Scraper',
              url: 'https://api.firecrawl.dev',
              authType: 'api_key'
            }
          ],
          mcpAction: 'scrape',
          scrapeUrl: '{{input.url}}'
        }
      },
      {
        id: 'end',
        type: 'end',
        position: { x: 100, y: 400 },
        data: { label: 'End' }
      }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'scrape' },
      { id: 'e2', source: 'scrape', target: 'end' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'multi-page-research',
    name: 'Multi-Page Research',
    description: 'Search the web, scrape multiple pages, and synthesize results',
    category: 'Research',
    tags: ['research', 'ai', 'analysis'],
    estimatedTime: '5-10 minutes',
    difficulty: 'Intermediate',
    nodes: [
      {
        id: 'start',
        type: 'start',
        position: { x: 100, y: 100 },
        data: {
          label: 'Start',
          inputVariables: [
            { name: 'query', type: 'string', required: true, description: 'Research query' }
          ]
        }
      },
      {
        id: 'search',
        type: 'mcp',
        position: { x: 100, y: 250 },
        data: {
          label: 'Search Web',
          mcpServers: [
            {
              id: 'firecrawl',
              name: 'Firecrawl',
              label: 'Firecrawl Web Scraper',
              url: 'https://api.firecrawl.dev',
              authType: 'api_key'
            }
          ],
          mcpAction: 'search',
          searchQuery: '{{input.query}}',
          searchLimit: 5
        }
      },
      {
        id: 'loop',
        type: 'while',
        position: { x: 100, y: 400 },
        data: {
          label: 'Process Each Result',
          condition: 'state.variables.currentIndex < state.variables.search.results.length',
          maxIterations: 5
        }
      },
      {
        id: 'scrape_page',
        type: 'mcp',
        position: { x: 300, y: 400 },
        data: {
          label: 'Scrape Page',
          mcpServers: [
            {
              id: 'firecrawl',
              name: 'Firecrawl',
              label: 'Firecrawl Web Scraper',
              url: 'https://api.firecrawl.dev',
              authType: 'api_key'
            }
          ],
          mcpAction: 'scrape',
          scrapeUrl: '{{search.results[currentIndex].url}}'
        }
      },
      {
        id: 'analyze',
        type: 'agent',
        position: { x: 100, y: 550 },
        data: {
          label: 'Analyze Results',
          instructions: 'Analyze all scraped content and create a comprehensive research report on {{input.query}}',
          model: 'gpt-4',
          includeChatHistory: true
        }
      },
      {
        id: 'end',
        type: 'end',
        position: { x: 100, y: 700 },
        data: { label: 'End' }
      }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'search' },
      { id: 'e2', source: 'search', target: 'loop' },
      { id: 'e3', source: 'loop', target: 'scrape_page' },
      { id: 'e4', source: 'scrape_page', target: 'loop' },
      { id: 'e5', source: 'loop', target: 'analyze' },
      { id: 'e6', source: 'analyze', target: 'end' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'competitive-analysis',
    name: 'Competitive Analysis',
    description: 'Analyze competitor websites and generate insights',
    category: 'Business',
    tags: ['business', 'analysis', 'competitive'],
    estimatedTime: '10-15 minutes',
    difficulty: 'Advanced',
    nodes: [
      {
        id: 'start',
        type: 'start',
        position: { x: 100, y: 100 },
        data: {
          label: 'Start',
          inputVariables: [
            { name: 'competitors', type: 'array', required: true, description: 'List of competitor URLs' }
          ]
        }
      },
      {
        id: 'loop',
        type: 'while',
        position: { x: 100, y: 250 },
        data: {
          label: 'Process Each Competitor',
          condition: 'state.variables.index < state.variables.input.competitors.length',
          maxIterations: 10
        }
      },
      {
        id: 'scrape',
        type: 'mcp',
        position: { x: 300, y: 250 },
        data: {
          label: 'Scrape Competitor',
          mcpServers: [
            {
              id: 'firecrawl',
              name: 'Firecrawl',
              label: 'Firecrawl Web Scraper',
              url: 'https://api.firecrawl.dev',
              authType: 'api_key'
            }
          ],
          mcpAction: 'scrape',
          scrapeUrl: '{{input.competitors[index]}}'
        }
      },
      {
        id: 'extract',
        type: 'agent',
        position: { x: 500, y: 250 },
        data: {
          label: 'Extract Key Info',
          instructions: 'Extract key information: pricing, features, value propositions, target audience',
          model: 'gpt-4'
        }
      },
      {
        id: 'compare',
        type: 'agent',
        position: { x: 100, y: 400 },
        data: {
          label: 'Generate Comparison',
          instructions: 'Compare all competitors and identify strengths, weaknesses, opportunities, and threats',
          model: 'gpt-4',
          includeChatHistory: true
        }
      },
      {
        id: 'end',
        type: 'end',
        position: { x: 100, y: 550 },
        data: { label: 'End' }
      }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'loop' },
      { id: 'e2', source: 'loop', target: 'scrape' },
      { id: 'e3', source: 'scrape', target: 'extract' },
      { id: 'e4', source: 'extract', target: 'loop' },
      { id: 'e5', source: 'loop', target: 'compare' },
      { id: 'e6', source: 'compare', target: 'end' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'data-extraction',
    name: 'Structured Data Extraction',
    description: 'Extract structured data from web pages with validation',
    category: 'Data Processing',
    tags: ['data', 'extraction', 'structured'],
    estimatedTime: '3-5 minutes',
    difficulty: 'Intermediate',
    nodes: [
      {
        id: 'start',
        type: 'start',
        position: { x: 100, y: 100 },
        data: {
          label: 'Start',
          inputVariables: [
            { name: 'url', type: 'string', required: true, description: 'URL to extract data from' },
            { name: 'schema', type: 'object', required: true, description: 'JSON schema for extraction' }
          ]
        }
      },
      {
        id: 'scrape',
        type: 'mcp',
        position: { x: 100, y: 250 },
        data: {
          label: 'Scrape Page',
          mcpServers: [
            {
              id: 'firecrawl',
              name: 'Firecrawl',
              label: 'Firecrawl Web Scraper',
              url: 'https://api.firecrawl.dev',
              authType: 'api_key'
            }
          ],
          mcpAction: 'scrape',
          scrapeUrl: '{{input.url}}'
        }
      },
      {
        id: 'extract',
        type: 'agent',
        position: { x: 100, y: 400 },
        data: {
          label: 'Extract Data',
          instructions: 'Extract data according to schema: {{input.schema}}',
          model: 'gpt-4',
          outputFormat: 'json',
          jsonSchema: '{{input.schema}}'
        }
      },
      {
        id: 'validate',
        type: 'transform',
        position: { x: 100, y: 550 },
        data: {
          label: 'Validate Data',
          transformScript: 'JSON.stringify(state.variables.extract)'
        }
      },
      {
        id: 'check',
        type: 'if-else',
        position: { x: 100, y: 700 },
        data: {
          label: 'Check Validity',
          condition: 'state.variables.validate !== null',
          trueLabel: 'Valid',
          falseLabel: 'Invalid'
        }
      },
      {
        id: 'success',
        type: 'end',
        position: { x: 300, y: 850 },
        data: { label: 'Success' }
      },
      {
        id: 'error',
        type: 'end',
        position: { x: -100, y: 850 },
        data: { label: 'Error' }
      }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'scrape' },
      { id: 'e2', source: 'scrape', target: 'extract' },
      { id: 'e3', source: 'extract', target: 'validate' },
      { id: 'e4', source: 'validate', target: 'check' },
      { id: 'e5', source: 'check', target: 'success', label: 'true' },
      { id: 'e6', source: 'check', target: 'error', label: 'false' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'content-monitoring',
    name: 'Content Change Monitor',
    description: 'Monitor websites for content changes with approval workflow',
    category: 'Monitoring',
    tags: ['monitoring', 'alerts', 'automation'],
    estimatedTime: '5-10 minutes',
    difficulty: 'Advanced',
    nodes: [
      {
        id: 'start',
        type: 'start',
        position: { x: 100, y: 100 },
        data: {
          label: 'Start',
          inputVariables: [
            { name: 'urls', type: 'array', required: true, description: 'URLs to monitor' },
            { name: 'checkInterval', type: 'number', required: false, description: 'Check interval in minutes', defaultValue: 60 }
          ]
        }
      },
      {
        id: 'loop',
        type: 'while',
        position: { x: 100, y: 250 },
        data: {
          label: 'Check Each URL',
          condition: 'state.variables.index < state.variables.input.urls.length',
          maxIterations: 20
        }
      },
      {
        id: 'scrape',
        type: 'mcp',
        position: { x: 300, y: 250 },
        data: {
          label: 'Scrape Current',
          mcpServers: [
            {
              id: 'firecrawl',
              name: 'Firecrawl',
              label: 'Firecrawl Web Scraper',
              url: 'https://api.firecrawl.dev',
              authType: 'api_key'
            }
          ],
          mcpAction: 'scrape',
          scrapeUrl: '{{input.urls[index]}}'
        }
      },
      {
        id: 'compare',
        type: 'transform',
        position: { x: 500, y: 250 },
        data: {
          label: 'Compare Content',
          transformScript: 'state.variables.scrape.content !== state.variables.previousContent[state.variables.index]'
        }
      },
      {
        id: 'check',
        type: 'if-else',
        position: { x: 500, y: 400 },
        data: {
          label: 'Content Changed?',
          condition: 'state.variables.compare === true',
          trueLabel: 'Changed',
          falseLabel: 'No Change'
        }
      },
      {
        id: 'approve',
        type: 'user-approval',
        position: { x: 700, y: 400 },
        data: {
          label: 'Review Changes',
          approvalMessage: 'Content changed at {{input.urls[index]}}. Review and approve notification.'
        }
      },
      {
        id: 'notify',
        type: 'agent',
        position: { x: 700, y: 550 },
        data: {
          label: 'Send Notification',
          instructions: 'Send notification about content change at {{input.urls[index]}}',
          model: 'gpt-4'
        }
      },
      {
        id: 'end',
        type: 'end',
        position: { x: 100, y: 700 },
        data: { label: 'End' }
      }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'loop' },
      { id: 'e2', source: 'loop', target: 'scrape' },
      { id: 'e3', source: 'scrape', target: 'compare' },
      { id: 'e4', source: 'compare', target: 'check' },
      { id: 'e5', source: 'check', target: 'approve', label: 'true' },
      { id: 'e6', source: 'check', target: 'loop', label: 'false' },
      { id: 'e7', source: 'approve', target: 'notify' },
      { id: 'e8', source: 'notify', target: 'loop' },
      { id: 'e9', source: 'loop', target: 'end' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const getTemplatesByCategory = (category: string) => {
  return workflowTemplates.filter(t => t.category === category);
};

export const getTemplatesByTag = (tag: string) => {
  return workflowTemplates.filter(t => t.tags?.includes(tag));
};

export const getAllCategories = () => {
  return [...new Set(workflowTemplates.map(t => t.category))];
};

export const getAllTags = () => {
  const allTags = workflowTemplates.flatMap(t => t.tags || []);
  return [...new Set(allTags)];
};
