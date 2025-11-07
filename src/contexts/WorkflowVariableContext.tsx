import React, { createContext, useContext, useState, useCallback } from 'react';

export interface WorkflowVariable {
  name: string;
  value: any;
  type: string;
  nodeId: string;
  timestamp: string;
}

interface WorkflowVariableContextType {
  variables: Record<string, WorkflowVariable>;
  getVariable: (name: string) => WorkflowVariable | undefined;
  setVariable: (name: string, value: any, nodeId: string, type?: string) => void;
  deleteVariable: (name: string) => void;
  clearVariables: () => void;
  getAllVariables: () => WorkflowVariable[];
}

const WorkflowVariableContext = createContext<WorkflowVariableContextType | undefined>(undefined);

export function WorkflowVariableProvider({ children }: { children: React.ReactNode }) {
  const [variables, setVariables] = useState<Record<string, WorkflowVariable>>({});

  const getVariable = useCallback((name: string) => {
    return variables[name];
  }, [variables]);

  const setVariable = useCallback((name: string, value: any, nodeId: string, type?: string) => {
    setVariables(prev => ({
      ...prev,
      [name]: {
        name,
        value,
        type: type || typeof value,
        nodeId,
        timestamp: new Date().toISOString(),
      },
    }));
  }, []);

  const deleteVariable = useCallback((name: string) => {
    setVariables(prev => {
      const newVars = { ...prev };
      delete newVars[name];
      return newVars;
    });
  }, []);

  const clearVariables = useCallback(() => {
    setVariables({});
  }, []);

  const getAllVariables = useCallback(() => {
    return Object.values(variables);
  }, [variables]);

  return (
    <WorkflowVariableContext.Provider
      value={{
        variables,
        getVariable,
        setVariable,
        deleteVariable,
        clearVariables,
        getAllVariables,
      }}
    >
      {children}
    </WorkflowVariableContext.Provider>
  );
}

export function useWorkflowVariables() {
  const context = useContext(WorkflowVariableContext);
  if (!context) {
    throw new Error('useWorkflowVariables must be used within WorkflowVariableProvider');
  }
  return context;
}
