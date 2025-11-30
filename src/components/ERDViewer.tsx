import { useEffect, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'react-flow';
import { invoke } from '@tauri-apps/api/core';
import 'react-flow/dist/style.css';

interface ERDViewerProps {
  connectionId: string;
  schema?: string;
}

export function ERDViewer({ connectionId, schema }: ERDViewerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const loadERD = useCallback(async () => {
    try {
      const result = await invoke<{
        nodes: Array<{ id: string; label: string; schema: string; table: string }>;
        edges: Array<{ from: string; to: string; label: string; from_column: string; to_column: string }>;
      }>('get_erd_data', {
        request: {
          connection_id: connectionId,
          schema,
        },
      });

      const flowNodes: Node[] = result.nodes.map((node, idx) => ({
        id: node.id,
        type: 'default',
        data: { label: node.label },
        position: {
          x: (idx % 5) * 200,
          y: Math.floor(idx / 5) * 150,
        },
      }));

      const flowEdges: Edge[] = result.edges.map((edge) => ({
        id: `${edge.from}-${edge.to}`,
        source: edge.from,
        target: edge.to,
        label: edge.label,
        type: 'smoothstep',
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Failed to load ERD:', error);
    }
  }, [connectionId, schema, setNodes, setEdges]);

  useEffect(() => {
    if (connectionId) {
      loadERD();
    }
  }, [connectionId, loadERD]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
