import { useCallback, useRef } from "react";
import {
  resolveWorkflowTaskId,
  resolveWorkflowEventId,
  resolveWorkflowEventSeq,
} from "../components/chat/workflowEventHelpers";

const MAX_SEEN_WORKFLOW_EVENTS_PER_TASK = 4000;

export function useWorkflowEventDedup() {
  const seenWorkflowEventsRef = useRef<Map<string, { keys: string[]; set: Set<string> }>>(new Map());
  const lastWorkflowEventSeqByTaskRef = useRef<Map<string, number>>(new Map());

  const shouldSkipWorkflowEvent = useCallback((data: any, fallbackTaskId?: string): boolean => {
    const taskId = (fallbackTaskId && `${fallbackTaskId}`.trim()) || resolveWorkflowTaskId(data) || 'global';
    const eventId = resolveWorkflowEventId(data);
    const eventSeq = resolveWorkflowEventSeq(data);

    let dedupKey = '';
    if (eventId) {
      dedupKey = `${taskId}::id::${eventId}`;
    } else if (eventSeq !== undefined) {
      dedupKey = `${taskId}::seq::${eventSeq}`;
    } else {
      dedupKey = `${taskId}::fallback::${JSON.stringify({
        type: data?.type || '',
        timestamp: data?.timestamp || '',
        agent_type: data?.agent_type || data?.agent || '',
        status: data?.status || '',
        message: data?.message || data?.thought || '',
        step_number: data?.step_number || '',
        total_steps: data?.total_steps || '',
        description: data?.description || '',
        tool_name: data?.tool_name || '',
        approval_id: data?.approval_id || data?.data?.approval_id || ''
      })}`;
    }

    const existingStore = seenWorkflowEventsRef.current.get(taskId);
    const store = existingStore || { keys: [] as string[], set: new Set<string>() };
    if (!existingStore) {
      seenWorkflowEventsRef.current.set(taskId, store);
    }

    const lastSeq = lastWorkflowEventSeqByTaskRef.current.get(taskId) || 0;
    if (eventSeq !== undefined && eventSeq <= lastSeq) {
      return true;
    }

    if (store.set.has(dedupKey)) {
      return true;
    }

    store.set.add(dedupKey);
    store.keys.push(dedupKey);

    if (eventSeq !== undefined && eventSeq > lastSeq) {
      lastWorkflowEventSeqByTaskRef.current.set(taskId, eventSeq);
    }

    while (store.keys.length > MAX_SEEN_WORKFLOW_EVENTS_PER_TASK) {
      const evicted = store.keys.shift();
      if (evicted) {
        store.set.delete(evicted);
      }
    }

    return false;
  }, []);

  return {
    seenWorkflowEventsRef,
    lastWorkflowEventSeqByTaskRef,
    shouldSkipWorkflowEvent,
  };
}
