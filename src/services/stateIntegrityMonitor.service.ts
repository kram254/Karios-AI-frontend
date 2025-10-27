import { stateManager } from './stateManager.service';
import { workflowStateSyncService } from './workflowStateSync.service';
import { chatIsolationService } from './chatIsolation.service';
import { websocketStateManager } from './websocketStateManager.service';

interface IntegrityIssue {
  type: 'orphaned_workflow' | 'stale_websocket' | 'missing_task' | 'corrupt_state' | 'storage_bloat';
  severity: 'low' | 'medium' | 'high' | 'critical';
  chatId: string;
  description: string;
  timestamp: number;
  autoFixable: boolean;
}

class StateIntegrityMonitor {
  private static instance: StateIntegrityMonitor;
  private monitorInterval: NodeJS.Timeout | null = null;
  private issues: IntegrityIssue[] = [];
  private readonly CHECK_INTERVAL = 60000;

  private constructor() {
    this.startMonitoring();
  }

  static getInstance(): StateIntegrityMonitor {
    if (!StateIntegrityMonitor.instance) {
      StateIntegrityMonitor.instance = new StateIntegrityMonitor();
    }
    return StateIntegrityMonitor.instance;
  }

  private startMonitoring(): void {
    this.monitorInterval = setInterval(() => {
      this.runIntegrityCheck();
    }, this.CHECK_INTERVAL);

    console.log('[IntegrityMonitor] Started monitoring with interval:', this.CHECK_INTERVAL);
  }

  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      console.log('[IntegrityMonitor] Monitoring stopped');
    }
  }

  runIntegrityCheck(): void {
    console.log('📋 LOG: [IntegrityMonitor] 🔍 Running integrity check...');
    this.issues = [];

    this.checkOrphanedWorkflows();
    this.checkStaleWebSockets();
    this.checkStorageHealth();
    this.checkStateCrossReference();

    if (this.issues.length > 0) {
      console.warn('📋 LOG: [IntegrityMonitor] ⚠️ Found', this.issues.length, 'integrity issues');
      this.autoFixIssues();
    } else {
      console.log('✅ LOG: [IntegrityMonitor] ✅ All checks passed');
    }
  }

  private checkOrphanedWorkflows(): void {
    const activeWorkflows = workflowStateSyncService.getAllActiveWorkflows();
    const activeChatId = chatIsolationService.getActiveChatId();

    activeWorkflows.forEach(workflow => {
      if (workflow.chatId !== activeChatId) {
        const age = Date.now() - workflow.lastUpdate;
        
        if (age > 60 * 60 * 1000) {
          this.issues.push({
            type: 'orphaned_workflow',
            severity: 'medium',
            chatId: workflow.chatId,
            description: `Workflow ${workflow.taskId} has been inactive for over 1 hour`,
            timestamp: Date.now(),
            autoFixable: true
          });
        }
      }
    });
  }

  private checkStaleWebSockets(): void {
    const wsStats = websocketStateManager.getStats();
    const allChats = websocketStateManager.getAllConnectedChats();

    allChats.forEach(chatId => {
      const state = websocketStateManager.getConnectionState(chatId);
      if (state && !websocketStateManager.isHealthy(chatId)) {
        this.issues.push({
          type: 'stale_websocket',
          severity: 'low',
          chatId,
          description: `WebSocket connection is unhealthy for chat ${chatId.slice(0, 8)}`,
          timestamp: Date.now(),
          autoFixable: true
        });
      }
    });
  }

  private checkStorageHealth(): void {
    const stats = stateManager.getStorageStats();
    
    if (stats.percentage > 90) {
      this.issues.push({
        type: 'storage_bloat',
        severity: 'high',
        chatId: 'system',
        description: `Storage usage at ${stats.percentage.toFixed(1)}% capacity`,
        timestamp: Date.now(),
        autoFixable: true
      });
    } else if (stats.percentage > 75) {
      this.issues.push({
        type: 'storage_bloat',
        severity: 'medium',
        chatId: 'system',
        description: `Storage usage at ${stats.percentage.toFixed(1)}% capacity`,
        timestamp: Date.now(),
        autoFixable: true
      });
    }
  }

  private checkStateCrossReference(): void {
    const isolationStats = chatIsolationService.getStats();
    const workflowStats = workflowStateSyncService.getStatsSummary();

    if (isolationStats.snapshotCount > 10) {
      this.issues.push({
        type: 'orphaned_workflow',
        severity: 'low',
        chatId: 'system',
        description: `High number of chat snapshots (${isolationStats.snapshotCount}), cleanup recommended`,
        timestamp: Date.now(),
        autoFixable: true
      });
    }
  }

  private autoFixIssues(): void {
    const fixableIssues = this.issues.filter(issue => issue.autoFixable);
    
    if (fixableIssues.length === 0) return;

    console.log('[IntegrityMonitor] 🔧 Auto-fixing', fixableIssues.length, 'issues...');

    fixableIssues.forEach(issue => {
      switch (issue.type) {
        case 'orphaned_workflow':
          if (issue.chatId !== 'system') {
            workflowStateSyncService.clearWorkflowState(issue.chatId);
            console.log('[IntegrityMonitor] ✅ Cleared orphaned workflow for chat:', issue.chatId.slice(0, 8));
          } else {
            chatIsolationService.cleanupInactiveChats(30 * 60 * 1000);
            console.log('[IntegrityMonitor] ✅ Cleaned up inactive chat snapshots');
          }
          break;

        case 'stale_websocket':
          websocketStateManager.clearState(issue.chatId);
          console.log('[IntegrityMonitor] ✅ Cleared stale WebSocket for chat:', issue.chatId.slice(0, 8));
          break;

        case 'storage_bloat':
          this.performStorageCleanup();
          console.log('[IntegrityMonitor] ✅ Performed storage cleanup');
          break;
      }
    });

    console.log('[IntegrityMonitor] ✅ Auto-fix complete');
  }

  private performStorageCleanup(): void {
    const activeChatId = chatIsolationService.getActiveChatId();
    const allWorkflows = workflowStateSyncService.getAllActiveWorkflows();
    
    allWorkflows.forEach(workflow => {
      const age = Date.now() - workflow.lastUpdate;
      
      if (workflow.chatId !== activeChatId && age > 24 * 60 * 60 * 1000) {
        workflowStateSyncService.clearWorkflowState(workflow.chatId);
      }
    });

    chatIsolationService.cleanupInactiveChats(60 * 60 * 1000);
  }

  getIssues(): IntegrityIssue[] {
    return [...this.issues];
  }

  getHealthScore(): number {
    if (this.issues.length === 0) return 100;

    const criticalCount = this.issues.filter(i => i.severity === 'critical').length;
    const highCount = this.issues.filter(i => i.severity === 'high').length;
    const mediumCount = this.issues.filter(i => i.severity === 'medium').length;
    const lowCount = this.issues.filter(i => i.severity === 'low').length;

    const penalty = (criticalCount * 40) + (highCount * 20) + (mediumCount * 10) + (lowCount * 5);
    
    return Math.max(0, 100 - penalty);
  }

  getReport(): {
    health: number;
    issues: IntegrityIssue[];
    timestamp: number;
    summary: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  } {
    const summary = {
      critical: this.issues.filter(i => i.severity === 'critical').length,
      high: this.issues.filter(i => i.severity === 'high').length,
      medium: this.issues.filter(i => i.severity === 'medium').length,
      low: this.issues.filter(i => i.severity === 'low').length
    };

    return {
      health: this.getHealthScore(),
      issues: this.getIssues(),
      timestamp: Date.now(),
      summary
    };
  }
}

export const stateIntegrityMonitor = StateIntegrityMonitor.getInstance();

if (typeof window !== 'undefined') {
  (window as any).__stateIntegrityMonitor = stateIntegrityMonitor;
  (window as any).getStateHealthReport = () => stateIntegrityMonitor.getReport();
}
