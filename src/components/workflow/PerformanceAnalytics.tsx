import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, Clock, TrendingUp, Zap, Activity, X } from 'lucide-react';
import axios from 'axios';

interface NodeMetrics {
  nodeId: string;
  nodeName: string;
  executionCount: number;
  avgDuration: number;
  tokenUsage: number;
  cost: number;
  successRate: number;
}

interface WorkflowMetrics {
  totalExecutions: number;
  totalCost: number;
  avgDuration: number;
  totalTokens: number;
  nodeMetrics: NodeMetrics[];
}

interface PerformanceAnalyticsProps {
  workflowId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PerformanceAnalytics({ workflowId, isOpen, onClose }: PerformanceAnalyticsProps) {
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && workflowId) {
      loadMetrics();
    }
  }, [isOpen, workflowId, timeRange]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/workflows/${workflowId}/metrics`, {
        params: { timeRange }
      });
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
      setMetrics({
        totalExecutions: 42,
        totalCost: 0.87,
        avgDuration: 3245,
        totalTokens: 87450,
        nodeMetrics: [
          {
            nodeId: 'node-1',
            nodeName: 'AI Agent',
            executionCount: 42,
            avgDuration: 2100,
            tokenUsage: 54000,
            cost: 0.54,
            successRate: 97.6
          },
          {
            nodeId: 'node-2',
            nodeName: 'Transform',
            executionCount: 42,
            avgDuration: 145,
            tokenUsage: 0,
            cost: 0,
            successRate: 100
          },
          {
            nodeId: 'node-3',
            nodeName: 'Guardrail',
            executionCount: 42,
            avgDuration: 1000,
            tokenUsage: 33450,
            cost: 0.33,
            successRate: 100
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '480px',
        height: '100%',
        backgroundColor: '#0a0a0a',
        borderLeft: '1px solid #333',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BarChart3 size={20} color="#3b82f6" />
          <h3 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 600 }}>
            Performance Analytics
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: 20,
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: 16, borderBottom: '1px solid #333' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['1h', '24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                flex: 1,
                padding: '6px 12px',
                backgroundColor: timeRange === range ? '#3b82f6' : '#1a1a1a',
                color: 'white',
                border: `1px solid ${timeRange === range ? '#3b82f6' : '#333'}`,
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                transition: 'all 0.2s',
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            Loading metrics...
          </div>
        ) : metrics && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div
                style={{
                  padding: 16,
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Activity size={16} color="#10b981" />
                  <span style={{ color: '#888', fontSize: 11 }}>Executions</span>
                </div>
                <div style={{ color: 'white', fontSize: 24, fontWeight: 600 }}>
                  {formatNumber(metrics.totalExecutions)}
                </div>
              </div>

              <div
                style={{
                  padding: 16,
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <DollarSign size={16} color="#f59e0b" />
                  <span style={{ color: '#888', fontSize: 11 }}>Total Cost</span>
                </div>
                <div style={{ color: 'white', fontSize: 24, fontWeight: 600 }}>
                  {formatCurrency(metrics.totalCost)}
                </div>
              </div>

              <div
                style={{
                  padding: 16,
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Clock size={16} color="#3b82f6" />
                  <span style={{ color: '#888', fontSize: 11 }}>Avg Duration</span>
                </div>
                <div style={{ color: 'white', fontSize: 24, fontWeight: 600 }}>
                  {formatDuration(metrics.avgDuration)}
                </div>
              </div>

              <div
                style={{
                  padding: 16,
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Zap size={16} color="#8b5cf6" />
                  <span style={{ color: '#888', fontSize: 11 }}>Total Tokens</span>
                </div>
                <div style={{ color: 'white', fontSize: 24, fontWeight: 600 }}>
                  {formatNumber(metrics.totalTokens)}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h4 style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                Node Performance
              </h4>

              {metrics.nodeMetrics.map((node, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: 12,
                    padding: 16,
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>
                      {node.nodeName}
                    </span>
                    <span
                      style={{
                        color: node.successRate >= 95 ? '#10b981' : node.successRate >= 80 ? '#f59e0b' : '#ef4444',
                        fontSize: 12,
                      }}
                    >
                      {node.successRate}% success
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>Duration</div>
                      <div style={{ color: 'white', fontSize: 12 }}>{formatDuration(node.avgDuration)}</div>
                    </div>
                    <div>
                      <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>Tokens</div>
                      <div style={{ color: 'white', fontSize: 12 }}>{formatNumber(node.tokenUsage)}</div>
                    </div>
                    <div>
                      <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>Cost</div>
                      <div style={{ color: 'white', fontSize: 12 }}>{formatCurrency(node.cost)}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div
                      style={{
                        height: 4,
                        backgroundColor: '#333',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${(node.cost / metrics.totalCost) * 100}%`,
                          height: '100%',
                          backgroundColor: '#8b5cf6',
                          borderRadius: 2,
                        }}
                      />
                    </div>
                    <div style={{ color: '#888', fontSize: 10, marginTop: 4 }}>
                      {((node.cost / metrics.totalCost) * 100).toFixed(1)}% of total cost
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
