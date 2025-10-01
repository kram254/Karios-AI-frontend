interface QueuedMessage {
  sequence: number;
  taskId: string;
  agentType: string;
  status: string;
  message: string;
  timestamp: string;
  data?: any;
  received: boolean;
  rendered: boolean;
}

class WorkflowMessageQueue {
  private queue: Map<string, QueuedMessage[]> = new Map();
  private nextSequence: Map<string, number> = new Map();
  private renderCallbacks: Map<string, ((messages: QueuedMessage[]) => void)[]> = new Map();
  private persistenceKey = 'workflow_message_queue';

  constructor() {
    this.loadFromStorage();
    window.addEventListener('beforeunload', () => this.saveToStorage());
  }

  private loadFromStorage() {
    try {
      const stored = sessionStorage.getItem(this.persistenceKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.queue = new Map(Object.entries(data.queue).map(([k, v]) => [k, v as QueuedMessage[]]));
        this.nextSequence = new Map(Object.entries(data.nextSequence).map(([k, v]) => [k, v as number]));
        console.log('📦 MESSAGE QUEUE - Loaded from storage:', this.queue.size, 'tasks');
        
        let totalMessages = 0;
        this.queue.forEach(messages => totalMessages += messages.length);
        console.log('📦 MESSAGE QUEUE - Total messages in storage:', totalMessages);
      }
    } catch (error) {
      console.error('📦 MESSAGE QUEUE - Failed to load from storage:', error);
      this.queue = new Map();
      this.nextSequence = new Map();
    }
  }

  private saveToStorage() {
    try {
      const data = {
        queue: Object.fromEntries(this.queue),
        nextSequence: Object.fromEntries(this.nextSequence)
      };
      const serialized = JSON.stringify(data);
      sessionStorage.setItem(this.persistenceKey, serialized);
      console.log('📦 MESSAGE QUEUE - Saved to storage (' + (serialized.length / 1024).toFixed(2) + ' KB)');
    } catch (error) {
      console.error('📦 MESSAGE QUEUE - Failed to save to storage:', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('⚠️ SESSION STORAGE QUOTA EXCEEDED - Clearing old tasks');
        const oldestTask = Array.from(this.queue.keys())[0];
        if (oldestTask) {
          this.clear(oldestTask);
          this.saveToStorage();
        }
      }
    }
  }

  addMessage(taskId: string, message: any): number {
    try {
      if (!taskId) {
        console.error('📦 MESSAGE QUEUE - Cannot add message: taskId is null or undefined');
        return -1;
      }

      if (!this.queue.has(taskId)) {
        this.queue.set(taskId, []);
        this.nextSequence.set(taskId, 1);
        console.log(`📦 MESSAGE QUEUE - Initialized queue for new task ${taskId.slice(0, 8)}`);
      }

      const sequence = this.nextSequence.get(taskId)!;
      this.nextSequence.set(taskId, sequence + 1);

      const queuedMessage: QueuedMessage = {
        sequence,
        taskId,
        agentType: message.agent_type || message.agentType || 'UNKNOWN',
        status: message.status || 'unknown',
        message: message.message || '',
        timestamp: message.timestamp || new Date().toISOString(),
        data: message.data,
        received: true,
        rendered: false
      };

      const taskQueue = this.queue.get(taskId)!;
      const isDuplicate = taskQueue.some(msg => 
        msg.agentType === queuedMessage.agentType &&
        msg.status === queuedMessage.status &&
        msg.timestamp === queuedMessage.timestamp
      );

      if (isDuplicate) {
        console.warn(`📦 MESSAGE QUEUE - Duplicate message detected, skipping:`, queuedMessage);
        return sequence;
      }

      taskQueue.push(queuedMessage);
      
      console.log(`📦 MESSAGE QUEUE - Added message #${sequence} for task ${taskId.slice(0, 8)}:`, {
        agent: queuedMessage.agentType,
        status: queuedMessage.status,
        totalMessages: taskQueue.length
      });

      this.saveToStorage();
      this.notifyCallbacks(taskId);

      return sequence;
    } catch (error) {
      console.error('📦 MESSAGE QUEUE - Error adding message:', error, message);
      return -1;
    }
  }

  getAllMessages(taskId: string): QueuedMessage[] {
    return this.queue.get(taskId) || [];
  }

  getUnrenderedMessages(taskId: string): QueuedMessage[] {
    const messages = this.queue.get(taskId) || [];
    return messages.filter(msg => !msg.rendered);
  }

  markAsRendered(taskId: string, sequence: number) {
    const messages = this.queue.get(taskId);
    if (messages) {
      const message = messages.find(msg => msg.sequence === sequence);
      if (message) {
        message.rendered = true;
        console.log(`📦 MESSAGE QUEUE - Marked message #${sequence} as rendered`);
        this.saveToStorage();
      }
    }
  }

  markAllAsRendered(taskId: string) {
    const messages = this.queue.get(taskId);
    if (messages) {
      messages.forEach(msg => msg.rendered = true);
      console.log(`📦 MESSAGE QUEUE - Marked all ${messages.length} messages as rendered for task ${taskId.slice(0, 8)}`);
      this.saveToStorage();
    }
  }

  onNewMessages(taskId: string, callback: (messages: QueuedMessage[]) => void) {
    if (!this.renderCallbacks.has(taskId)) {
      this.renderCallbacks.set(taskId, []);
    }
    this.renderCallbacks.get(taskId)!.push(callback);
    
    const unrendered = this.getUnrenderedMessages(taskId);
    if (unrendered.length > 0) {
      callback(unrendered);
    }
  }

  private notifyCallbacks(taskId: string) {
    const callbacks = this.renderCallbacks.get(taskId);
    if (callbacks) {
      const unrendered = this.getUnrenderedMessages(taskId);
      callbacks.forEach(callback => callback(unrendered));
    }
  }

  getMissingSequences(taskId: string): number[] {
    const messages = this.queue.get(taskId);
    if (!messages || messages.length === 0) return [];

    const sequences = messages.map(msg => msg.sequence).sort((a, b) => a - b);
    const missing: number[] = [];

    for (let i = 1; i < sequences[sequences.length - 1]; i++) {
      if (!sequences.includes(i)) {
        missing.push(i);
      }
    }

    return missing;
  }

  getStats(taskId: string) {
    const messages = this.queue.get(taskId) || [];
    const rendered = messages.filter(msg => msg.rendered).length;
    const missing = this.getMissingSequences(taskId);

    return {
      total: messages.length,
      rendered,
      unrendered: messages.length - rendered,
      missing: missing.length,
      missingSequences: missing
    };
  }

  clear(taskId: string) {
    this.queue.delete(taskId);
    this.nextSequence.delete(taskId);
    this.renderCallbacks.delete(taskId);
    this.saveToStorage();
    console.log(`📦 MESSAGE QUEUE - Cleared queue for task ${taskId.slice(0, 8)}`);
  }

  getAllTasks(): string[] {
    return Array.from(this.queue.keys());
  }

  getHealthCheck() {
    const tasks = this.getAllTasks();
    const healthReport: any = {
      totalTasks: tasks.length,
      totalMessages: 0,
      totalRendered: 0,
      totalUnrendered: 0,
      totalMissing: 0,
      tasks: {}
    };

    tasks.forEach(taskId => {
      const stats = this.getStats(taskId);
      healthReport.totalMessages += stats.total;
      healthReport.totalRendered += stats.rendered;
      healthReport.totalUnrendered += stats.unrendered;
      healthReport.totalMissing += stats.missing;
      healthReport.tasks[taskId] = stats;
    });

    return healthReport;
  }

  printHealthReport() {
    const health = this.getHealthCheck();
    console.log('🏥 QUEUE HEALTH REPORT:');
    console.log(`   Total Tasks: ${health.totalTasks}`);
    console.log(`   Total Messages: ${health.totalMessages}`);
    console.log(`   ✅ Rendered: ${health.totalRendered}`);
    console.log(`   ⏳ Unrendered: ${health.totalUnrendered}`);
    console.log(`   ❌ Missing: ${health.totalMissing}`);
    
    Object.entries(health.tasks).forEach(([taskId, stats]: [string, any]) => {
      console.log(`   📋 Task ${taskId.slice(0, 8)}: ${stats.rendered}/${stats.total} rendered`);
    });
  }
}

export const workflowMessageQueue = new WorkflowMessageQueue();
export type { QueuedMessage };

if (typeof window !== 'undefined') {
  (window as any).workflowMessageQueue = workflowMessageQueue;
  (window as any).printQueueHealth = () => workflowMessageQueue.printHealthReport();
  console.log('💉 QUEUE DIAGNOSTICS AVAILABLE:');
  console.log('   - window.workflowMessageQueue');
  console.log('   - window.printQueueHealth()');
}
