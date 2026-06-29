export interface ArtifactCandidate {
  type: 'code' | 'react' | 'html' | 'workflow' | 'markdown' | 'diagram' | 'data' | 'multi_agent_workflow' | 'web_automation' | 'svg';
  content: string;
  metadata: {
    language?: string;
    mimeType?: string;
    title?: string;
    description?: string;
    confidence: number;
    lineCount?: number;
    complexity?: 'low' | 'medium' | 'high';
    executable?: boolean;
  };
  shouldCreateArtifact: boolean;
}

export class ArtifactDetectionService {
  private readonly CODE_LINE_THRESHOLD = 20;
  private readonly SUBSTANTIAL_CONTENT_THRESHOLD = 500;

  detectArtifact(messageContent: string, messageRole: string): ArtifactCandidate | null {
    if (messageRole !== 'assistant') return null;

    const workflows = this.detectWorkflows(messageContent);
    if (workflows) return workflows;

    const multiAgent = this.detectMultiAgentWorkflow(messageContent);
    if (multiAgent) return multiAgent;

    const webAutomation = this.detectWebAutomation(messageContent);
    if (webAutomation) return webAutomation;

    const chart = this.detectChart(messageContent);
    if (chart) return chart;

    const svg = this.detectSVG(messageContent);
    if (svg) return svg;

    const code = this.detectCode(messageContent);
    if (code) return code;

    const html = this.detectHTML(messageContent);
    if (html) return html;

    const react = this.detectReact(messageContent);
    if (react) return react;

    const diagram = this.detectDiagram(messageContent);
    if (diagram) return diagram;

    const structuredContent = this.detectStructuredContent(messageContent);
    if (structuredContent) return structuredContent;

    return null;
  }

  private detectChart(content: string): ArtifactCandidate | null {
    const match = content.match(/```(?:vega-lite|vegalite)\r?\n([\s\S]*?)```/i);
    if (match) {
      return {
        type: 'markdown',
        content: `\n\n\`\`\`vega-lite\n${match[1]}\n\`\`\`\n`,
        metadata: {
          mimeType: 'text/markdown',
          title: 'Chart',
          description: 'Vega-Lite visualization',
          confidence: 0.92,
          complexity: 'medium',
          executable: true
        },
        shouldCreateArtifact: true
      };
    }
    return null;
  }

  private detectSVG(content: string): ArtifactCandidate | null {
    const svgBlock = content.match(/```svg\r?\n([\s\S]*?)```/i);
    if (svgBlock && svgBlock[1]) {
      const svg = svgBlock[1].trim();
      if (svg) {
        return {
          type: 'svg',
          content: svg,
          metadata: {
            language: 'svg',
            mimeType: 'image/svg+xml',
            title: 'SVG Graphic',
            description: 'Scalable Vector Graphics',
            confidence: 0.95,
            complexity: 'low',
            executable: false
          },
          shouldCreateArtifact: true
        };
      }
    }

    const svgInline = content.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgInline) {
      return {
        type: 'svg',
        content: svgInline[0],
        metadata: {
          language: 'svg',
          mimeType: 'image/svg+xml',
          title: 'SVG Graphic',
          description: 'Scalable Vector Graphics',
          confidence: 0.92,
          complexity: 'low',
          executable: false
        },
        shouldCreateArtifact: true
      };
    }

    return null;
  }

  private detectWorkflows(content: string): ArtifactCandidate | null {
    if (content.includes('[AUTOMATION_PLAN]') || content.includes('"workflow"') || content.includes('"phases"')) {
      try {
        const jsonMatch = content.match(/\{[\s\S]*"(?:workflow|phases|steps)"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.workflow || parsed.phases || parsed.steps) {
            return {
              type: 'workflow',
              content: JSON.stringify(parsed, null, 2),
              metadata: {
                title: parsed.name || 'Automation Workflow',
                description: parsed.description || 'Visual workflow execution plan',
                confidence: 0.95,
                complexity: 'high',
                executable: true
              },
              shouldCreateArtifact: true
            };
          }
        }
      } catch {}
    }
    return null;
  }

  private detectMultiAgentWorkflow(content: string): ArtifactCandidate | null {
    if (content.includes('workflow') && (content.includes('agent') || content.includes('task'))) {
      const hasAgentKeywords = /(?:prompt refiner|planner|executor|reviewer|formatter|host agent)/i.test(content);
      const hasWorkflowStages = /(?:refining|planning|executing|reviewing|formatting)/i.test(content);
      
      if (hasAgentKeywords || hasWorkflowStages) {
        return {
          type: 'multi_agent_workflow',
          content: content,
          metadata: {
            title: 'Multi-Agent Workflow',
            description: 'Collaborative agent task execution',
            confidence: 0.85,
            complexity: 'high',
            executable: true
          },
          shouldCreateArtifact: true
        };
      }
    }
    return null;
  }

  private detectWebAutomation(content: string): ArtifactCandidate | null {
    const automationIndicators = [
      'browser', 'navigate', 'click', 'scrape', 'automation',
      'selenium', 'playwright', 'web automation', 'extract data'
    ];
    
    const hasAutomation = automationIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );

    if (hasAutomation && content.length > 300) {
      const title = this.extractWebAutomationTitle(content);
      const description = this.extractWebAutomationDescription(content);
      return {
        type: 'web_automation',
        content: content,
        metadata: {
          title,
          description,
          confidence: 0.80,
          complexity: 'medium',
          executable: true
        },
        shouldCreateArtifact: true
      };
    }
    return null;
  }

  private extractWebAutomationTitle(content: string): string {
    const headingMatch = content.match(/^#+\s+(.+)$/m);
    if (headingMatch && headingMatch[1]) {
      return headingMatch[1].trim().slice(0, 60);
    }
    const boldMatch = content.match(/\*\*([^*]+)\*\*/);
    if (boldMatch && boldMatch[1] && boldMatch[1].length < 60) {
      return boldMatch[1].trim();
    }
    const lines = content.split('\n').filter(l => l.trim().length > 10);
    if (lines.length > 0) {
      const firstLine = lines[0].replace(/^[-*#>\s]+/, '').trim();
      if (firstLine.length > 5 && firstLine.length <= 80) {
        return firstLine.slice(0, 60);
      }
    }
    return 'Web Automation Results';
  }

  private extractWebAutomationDescription(content: string): string {
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    for (const line of lines.slice(0, 5)) {
      const clean = line.replace(/^[-*#>\s]+/, '').trim();
      if (clean.length > 20 && clean.length < 150 && !clean.startsWith('http')) {
        return clean.slice(0, 100);
      }
    }
    return 'Automated browser interaction results';
  }

  private detectCode(content: string): ArtifactCandidate | null {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const matches = [...content.matchAll(codeBlockRegex)];
    
    for (const match of matches) {
      const language = match[1] || 'text';
      const code = match[2];
      const lineCount = code.split('\n').length;

      if (lineCount >= this.CODE_LINE_THRESHOLD) {
        const complexity = this.assessCodeComplexity(code);
        const executable = this.isExecutableCode(language);

        return {
          type: 'code',
          content: code,
          metadata: {
            language,
            mimeType: 'application/vnd.ant.code',
            title: `${language.toUpperCase()} Code`,
            description: `${lineCount} lines of ${language} code`,
            confidence: 0.95,
            lineCount,
            complexity,
            executable
          },
          shouldCreateArtifact: true
        };
      }
    }
    return null;
  }

  private detectHTML(content: string): ArtifactCandidate | null {
    const htmlRegex = /<html[\s\S]*<\/html>|<!DOCTYPE html>[\s\S]*<\/html>/i;
    const match = content.match(htmlRegex);

    if (match) {
      return {
        type: 'html',
        content: match[0],
        metadata: {
          language: 'html',
          mimeType: 'text/html',
          title: 'HTML Document',
          description: 'Interactive HTML content',
          confidence: 0.98,
          complexity: 'medium',
          executable: true
        },
        shouldCreateArtifact: true
      };
    }
    return null;
  }

  private detectReact(content: string): ArtifactCandidate | null {
    const reactIndicators = [
      /import\s+React/,
      /import\s+\{.*\}\s+from\s+['"]react['"]/,
      /const\s+\w+\s*=\s*\(\)\s*=>\s*{[\s\S]*return\s*\(/,
      /function\s+\w+\(\)\s*{[\s\S]*return\s*\(/,
      /<\w+[\s\S]*\/>/
    ];

    const codeBlockRegex = /```(?:jsx|tsx|javascript|typescript)?\n([\s\S]*?)```/g;
    const matches = [...content.matchAll(codeBlockRegex)];

    for (const match of matches) {
      const code = match[1];
      const isReact = reactIndicators.some(indicator => indicator.test(code));

      if (isReact && code.split('\n').length >= 15) {
        return {
          type: 'react',
          content: code,
          metadata: {
            language: 'jsx',
            mimeType: 'application/vnd.ant.react',
            title: 'React Component',
            description: 'Interactive React component',
            confidence: 0.90,
            lineCount: code.split('\n').length,
            complexity: 'high',
            executable: true
          },
          shouldCreateArtifact: true
        };
      }
    }
    return null;
  }

  private detectDiagram(content: string): ArtifactCandidate | null {
    const diagramKeywords = ['mermaid', 'flowchart', 'diagram', 'graph TD', 'sequenceDiagram'];
    const hasDiagram = diagramKeywords.some(keyword => content.toLowerCase().includes(keyword));

    if (hasDiagram) {
      const mermaidRegex = /```mermaid\n([\s\S]*?)```/;
      const match = content.match(mermaidRegex);

      if (match) {
        return {
          type: 'diagram',
          content: match[1],
          metadata: {
            language: 'mermaid',
            mimeType: 'application/vnd.ant.mermaid',
            title: 'Diagram',
            description: 'Visual diagram representation',
            confidence: 0.92,
            complexity: 'medium',
            executable: true
          },
          shouldCreateArtifact: true
        };
      }
    }
    return null;
  }

  private detectStructuredContent(content: string): ArtifactCandidate | null {
    if (content.length < this.SUBSTANTIAL_CONTENT_THRESHOLD) return null;

    const hasMultipleSections = (content.match(/#{1,3}\s+/g) || []).length >= 3;
    const hasList = (content.match(/^[-*]\s+/gm) || []).length >= 5;
    const hasCodeExamples = (content.match(/```/g) || []).length >= 2;
    const hasTable = /\|.*\|/.test(content);

    const structureScore = (
      (hasMultipleSections ? 1 : 0) +
      (hasList ? 1 : 0) +
      (hasCodeExamples ? 1 : 0) +
      (hasTable ? 1 : 0)
    );

    if (structureScore >= 2) {
      return {
        type: 'markdown',
        content: content,
        metadata: {
          mimeType: 'text/markdown',
          title: 'Documentation',
          description: 'Structured reference content',
          confidence: 0.75,
          complexity: 'medium',
          executable: false
        },
        shouldCreateArtifact: true
      };
    }

    return null;
  }

  private assessCodeComplexity(code: string): 'low' | 'medium' | 'high' {
    const lines = code.split('\n').length;
    const functions = (code.match(/function|=>|async|class/g) || []).length;
    const conditionals = (code.match(/if|else|switch|case|\?/g) || []).length;
    const loops = (code.match(/for|while|map|filter|reduce/g) || []).length;

    const complexityScore = functions + conditionals * 1.5 + loops * 2;

    if (complexityScore > 20 || lines > 100) return 'high';
    if (complexityScore > 10 || lines > 50) return 'medium';
    return 'low';
  }

  private isExecutableCode(language: string): boolean {
    const executableLanguages = ['javascript', 'typescript', 'jsx', 'tsx', 'python', 'html'];
    return executableLanguages.includes(language.toLowerCase());
  }

  shouldAutoExpand(artifact: ArtifactCandidate): boolean {
    if (artifact.metadata.executable && artifact.type !== 'markdown') return true;
    if (artifact.metadata.complexity === 'high') return true;
    if (artifact.type === 'workflow' || artifact.type === 'multi_agent_workflow') return true;
    if (artifact.metadata.lineCount && artifact.metadata.lineCount > 50) return true;
    return false;
  }
}

export const artifactDetectionService = new ArtifactDetectionService();
