import React, { useEffect, useRef, useState } from 'react';
import { Activity, Cpu, Zap } from 'lucide-react';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  avgRenderInterval: number;
  fps: number;
}

export const PerformanceMonitor: React.FC<{ componentName?: string }> = ({ 
  componentName = 'Component' 
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: Date.now(),
    avgRenderInterval: 0,
    fps: 60
  });
  
  const renderTimestamps = useRef<number[]>([]);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    renderTimestamps.current.push(now);
    
    if (renderTimestamps.current.length > 60) {
      renderTimestamps.current.shift();
    }
    
    const intervals = renderTimestamps.current.slice(1).map((time, i) => 
      time - renderTimestamps.current[i]
    );
    
    const avgInterval = intervals.length > 0 
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length 
      : 0;
    
    const fps = avgInterval > 0 ? Math.min(60, 1000 / avgInterval) : 60;
    
    setMetrics({
      renderCount: renderTimestamps.current.length,
      lastRenderTime: now,
      avgRenderInterval: avgInterval,
      fps: Math.round(fps)
    });
  });

  const getPerformanceStatus = () => {
    if (metrics.avgRenderInterval < 100) return { color: 'text-green-500', status: 'Excellent' };
    if (metrics.avgRenderInterval < 250) return { color: 'text-yellow-500', status: 'Good' };
    return { color: 'text-red-500', status: 'Needs Optimization' };
  };

  const status = getPerformanceStatus();
  const uptime = Math.round((Date.now() - mountTime.current) / 1000);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg border border-gray-700 text-xs font-mono z-50">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-4 h-4" />
        <span className="font-bold">{componentName} Performance</span>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Renders:</span>
          <span className="font-bold">{metrics.renderCount}</span>
        </div>
        
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Avg Interval:</span>
          <span className={status.color}>{metrics.avgRenderInterval.toFixed(0)}ms</span>
        </div>
        
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Status:</span>
          <span className={status.color}>{status.status}</span>
        </div>
        
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Uptime:</span>
          <span>{uptime}s</span>
        </div>
      </div>
      
      {metrics.avgRenderInterval > 250 && (
        <div className="mt-2 pt-2 border-t border-gray-700 text-yellow-400">
          ⚠️ High re-render frequency detected
        </div>
      )}
    </div>
  );
};

export const useRenderCount = (componentName: string) => {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Render #${renderCount.current}`);
    }
  });
  
  return renderCount.current;
};

export const useWhyDidYouUpdate = (name: string, props: Record<string, any>) => {
  const previousProps = useRef<Record<string, any>>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key]
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`[${name}] Props changed:`, changedProps);
      }
    }

    previousProps.current = props;
  });
};
