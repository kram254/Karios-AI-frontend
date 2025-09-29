import React, { useState, useRef, useEffect } from 'react';
import { PhaseCard } from './PhaseCard';
import { Maximize2, Minimize2, Move } from 'lucide-react';

interface WorkflowCanvasProps {
  phases: any[];
  isCanvasMode?: boolean;
  onToggleCanvas?: () => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  phases,
  isCanvasMode = false,
  onToggleCanvas
}) => {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [positions, setPositions] = useState<{ [key: number]: { x: number; y: number } }>({});
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem === null) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPositions(prev => ({
      ...prev,
      [draggedItem]: { x, y }
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (isCanvasMode) {
    return (
      <div className="fixed inset-0 bg-gray-100 z-50">
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <h2 className="text-xl font-semibold">Workflow Canvas</h2>
          <button
            onClick={onToggleCanvas}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
            Exit Canvas
          </button>
        </div>
        
        <div
          ref={canvasRef}
          className="relative w-full h-full overflow-auto p-8"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {phases.map((phase, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              className="absolute cursor-move max-w-md"
              style={{
                left: positions[index]?.x || index * 320 + 20,
                top: positions[index]?.y || Math.floor(index / 3) * 300 + 20,
              }}
            >
              <div className="bg-white shadow-lg rounded-lg p-2">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-t-md">
                  <Move className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Drag to reposition</span>
                </div>
                <PhaseCard phase={phase} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Workflow Progress</h2>
        <button
          onClick={onToggleCanvas}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
          Canvas Mode
        </button>
      </div>
      
      {phases.map((phase, index) => (
        <PhaseCard key={index} phase={phase} />
      ))}
    </div>
  );
};
