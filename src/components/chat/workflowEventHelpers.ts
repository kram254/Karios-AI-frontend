export const resolveWorkflowTaskId = (data: any): string => {
  const directTaskId = data?.task_id || data?.taskId;
  if (directTaskId !== undefined && directTaskId !== null && `${directTaskId}`.trim().length > 0) {
    return `${directTaskId}`;
  }
  const nestedDataTaskId = data?.data?.task_id || data?.data?.taskId;
  if (nestedDataTaskId !== undefined && nestedDataTaskId !== null && `${nestedDataTaskId}`.trim().length > 0) {
    return `${nestedDataTaskId}`;
  }
  const metadataTaskId = data?.metadata?.task_id || data?.metadata?.taskId || data?.metadata?.workflow_task_id;
  if (metadataTaskId !== undefined && metadataTaskId !== null && `${metadataTaskId}`.trim().length > 0) {
    return `${metadataTaskId}`;
  }
  return '';
};

export const resolveWorkflowEventId = (data: any): string => {
  const rawEventId = data?.event_id ?? data?.eventId;
  if (rawEventId === undefined || rawEventId === null) {
    return '';
  }
  const normalized = `${rawEventId}`.trim();
  return normalized.length > 0 ? normalized : '';
};

export const resolveWorkflowEventSeq = (data: any): number | undefined => {
  const rawEventSeq = data?.event_seq ?? data?.eventSeq;
  if (rawEventSeq === undefined || rawEventSeq === null) {
    return undefined;
  }
  const parsed = Number(rawEventSeq);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
};

export const parseWorkflowTimestampMs = (value: any): number => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const compareWorkflowEventOrder = (a: any, b: any): number => {
  const seqA = resolveWorkflowEventSeq(a);
  const seqB = resolveWorkflowEventSeq(b);
  if (seqA !== undefined && seqB !== undefined && seqA !== seqB) {
    return seqA - seqB;
  }
  if (seqA !== undefined && seqB === undefined) {
    return 1;
  }
  if (seqA === undefined && seqB !== undefined) {
    return -1;
  }
  const tsA = parseWorkflowTimestampMs(a?.timestamp);
  const tsB = parseWorkflowTimestampMs(b?.timestamp);
  if (tsA !== tsB) {
    return tsA - tsB;
  }
  const idA = resolveWorkflowEventId(a);
  const idB = resolveWorkflowEventId(b);
  if (idA && idB && idA !== idB) {
    return idA.localeCompare(idB);
  }
  return 0;
};
