declare module '@xyflow/react' {
  import { ComponentType, CSSProperties, ReactNode } from 'react';

  export interface XYPosition {
    x: number;
    y: number;
  }

  export enum Position {
    Top = 'top',
    Right = 'right',
    Bottom = 'bottom',
    Left = 'left',
  }

  export interface Node<T = any> {
    id: string;
    type?: string;
    position: XYPosition;
    data: T;
    style?: CSSProperties;
    className?: string;
    sourcePosition?: Position;
    targetPosition?: Position;
    hidden?: boolean;
    selected?: boolean;
    dragging?: boolean;
    draggable?: boolean;
    selectable?: boolean;
    connectable?: boolean;
    deletable?: boolean;
    dragHandle?: string;
    width?: number | null;
    height?: number | null;
    parentNode?: string;
    zIndex?: number;
    extent?: 'parent' | CoordinateExtent;
    expandParent?: boolean;
    ariaLabel?: string;
  }

  export interface Edge<T = any> {
    id: string;
    type?: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    style?: CSSProperties;
    animated?: boolean;
    hidden?: boolean;
    deletable?: boolean;
    data?: T;
    className?: string;
    sourceNode?: Node;
    targetNode?: Node;
    selected?: boolean;
    markerStart?: EdgeMarkerType;
    markerEnd?: EdgeMarkerType;
    zIndex?: number;
    ariaLabel?: string;
    interactionWidth?: number;
  }

  export interface NodeProps<T = any> {
    id: string;
    data: T;
    selected: boolean;
    isConnectable: boolean;
    xPos: number;
    yPos: number;
    dragging: boolean;
    type: string;
    sourcePosition?: Position;
    targetPosition?: Position;
  }

  export interface Connection {
    source: string | null;
    target: string | null;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  }

  export interface HandleProps {
    type: 'source' | 'target';
    position: Position;
    id?: string;
    isConnectable?: boolean;
    style?: CSSProperties;
    className?: string;
    onConnect?: (connection: Connection) => void;
  }

  export type CoordinateExtent = [[number, number], [number, number]];
  export type EdgeMarkerType = string | { type?: string; color?: string; width?: number; height?: number; markerUnits?: string; orient?: string; strokeWidth?: number };

  export interface ReactFlowProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange?: (changes: any[]) => void;
    onEdgesChange?: (changes: any[]) => void;
    onConnect?: (connection: Connection) => void;
    nodeTypes?: { [key: string]: ComponentType<NodeProps> };
    edgeTypes?: { [key: string]: ComponentType<any> };
    children?: ReactNode;
    style?: CSSProperties;
    className?: string;
    fitView?: boolean;
    fitViewOptions?: any;
    nodesDraggable?: boolean;
    nodesConnectable?: boolean;
    elementsSelectable?: boolean;
    [key: string]: any;
  }

  export enum BackgroundVariant {
    Lines = 'lines',
    Dots = 'dots',
    Cross = 'cross',
  }

  export const ReactFlow: ComponentType<ReactFlowProps>;
  export const Handle: ComponentType<HandleProps>;
  export const Background: ComponentType<any>;
  export const Controls: ComponentType<any>;
  export const MiniMap: ComponentType<any>;
  export const Panel: ComponentType<any>;
  export const useNodesState: (initialNodes: Node[]) => [Node[], any, any];
  export const useEdgesState: (initialEdges: Edge[]) => [Edge[], any, any];
  export const addEdge: (connection: Connection, edges: Edge[]) => Edge[];
  export default ReactFlow;
}
