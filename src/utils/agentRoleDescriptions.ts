import { AgentRole } from '../types/agent';

/**
 * Role descriptions for the agent creation wizard
 * These provide user-friendly descriptions of each agent role
 */
export const AGENT_ROLE_DESCRIPTIONS: Record<AgentRole, {
  title: string;
  description: string;
  icon: string;
  specialties: string[];
}> = {
  [AgentRole.CUSTOMER_SUPPORT]: {
    title: 'Customer Support',
    description: 'Empathetic problem-solver focused on customer satisfaction',
    icon: '🎧',
    specialties: ['Issue Resolution', 'Product Knowledge', 'Customer Relations']
  },
  [AgentRole.SALES_ASSISTANT]: {
    title: 'Sales Assistant',
    description: 'Consultative advisor focused on understanding needs and creating value',
    icon: '💼',
    specialties: ['Needs Assessment', 'Solution Selling', 'Relationship Building']
  },
  [AgentRole.TECHNICAL_SUPPORT]: {
    title: 'Technical Support',
    description: 'Expert troubleshooter with systematic problem-solving approach',
    icon: '🔧',
    specialties: ['System Diagnostics', 'Integration Support', 'Performance Optimization']
  },
  [AgentRole.CONSULTING]: {
    title: 'Consulting Services',
    description: 'Strategic advisor providing implementation expertise and guidance',
    icon: '📊',
    specialties: ['Strategic Planning', 'Process Optimization', 'Change Management']
  },
  [AgentRole.SALES_SERVICES]: {
    title: 'Sales Services',
    description: 'Account growth specialist focused on expansion and optimization',
    icon: '📈',
    specialties: ['Account Growth', 'Usage Optimization', 'Expansion Planning']
  },
  [AgentRole.CUSTOM]: {
    title: 'Custom Role',
    description: 'Define your own specialized agent role',
    icon: '⚙️',
    specialties: ['Flexible', 'Customizable', 'Specialized']
  }
};

/**
 * Get the role description for a specific agent role
 * 
 * @param role The agent role
 * @returns The role description object
 */
export function getRoleDescription(role: AgentRole) {
  return AGENT_ROLE_DESCRIPTIONS[role];
}
