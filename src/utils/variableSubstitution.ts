import { WorkflowState } from '../types/workflow.types';

export function substituteVariables(text: string, state: WorkflowState): string {
  if (!text) return text;

  const pattern = /\{\{([^}]+)\}\}/g;

  return text.replace(pattern, (match, expression) => {
    try {
      const cleanExpr = expression.trim();
      const value = evaluateExpression(cleanExpr, state);

      if (value === null || value === undefined) {
        return match;
      }

      if (typeof value === 'object') {
        return JSON.stringify(value);
      }

      return String(value);
    } catch (e) {
      console.warn(`Failed to substitute variable: ${expression}`, e);
      return match;
    }
  });
}

function evaluateExpression(expression: string, state: WorkflowState): any {
  let normalizedExpr = expression;

  if (!expression.startsWith('state.')) {
    if (expression === 'input' || expression.startsWith('input.')) {
      normalizedExpr = `state.variables.${expression}`;
    } else if (expression === 'lastOutput' || expression.startsWith('lastOutput.')) {
      normalizedExpr = `state.variables.${expression}`;
    } else {
      normalizedExpr = `state.variables.${expression}`;
    }
  }

  const parts = normalizedExpr.split('.');

  let current: any = { state };

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      current = current[arrayName]?.[parseInt(index)];
    } else {
      current = current[part];
    }
  }

  if (current === undefined && normalizedExpr.startsWith('state.variables.input.')) {
    const inputPath = normalizedExpr.replace('state.variables.input.', '');

    const nestedValue = state.variables?.input?.input?.[inputPath];
    if (nestedValue !== undefined) {
      return nestedValue;
    }

    if (state.variables?.[inputPath] !== undefined) {
      return state.variables[inputPath];
    }

    const nestedPath = `state.variables.input.input.${inputPath}`;
    const nestedParts = nestedPath.split('.');
    let nestedCurrent: any = { state };
    for (const part of nestedParts) {
      if (nestedCurrent === null || nestedCurrent === undefined) break;
      nestedCurrent = nestedCurrent[part];
    }
    if (nestedCurrent !== undefined) {
      return nestedCurrent;
    }
  }

  return current;
}

export function extractVariableReferences(text: string): string[] {
  if (!text) return [];

  const pattern = /\{\{([^}]+)\}\}/g;
  const matches: string[] = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    matches.push(match[1].trim());
  }

  return matches;
}

export function validateVariableReferences(
  text: string,
  state: WorkflowState
): { valid: boolean; missing: string[] } {
  const references = extractVariableReferences(text);
  const missing: string[] = [];

  for (const ref of references) {
    try {
      const value = evaluateExpression(ref, state);
      if (value === undefined) {
        missing.push(ref);
      }
    } catch (e) {
      missing.push(ref);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}
