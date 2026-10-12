"use client";

import { createContext, use, useMemo } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import type { TableInfo } from "@/lib/types";

const NODE_WIDTH = 250;
const HEADER_HEIGHT = 36;
const ROW_HEIGHT = 26;

type TableNode = Node<{ table: TableInfo }, "table">;

const SelectedTableContext = createContext<string | null>(null);

function TableNodeView({ data }: NodeProps<TableNode>) {
  const selected = use(SelectedTableContext) === data.table.name;
  return (
    <div
      style={{ width: NODE_WIDTH }}
      className={`overflow-hidden rounded-lg border bg-panel shadow-sm transition-shadow ${
        selected ? "border-accent ring-2 ring-accent/40" : "border-line"
      }`}
    >
      <div
        style={{ height: HEADER_HEIGHT }}
        className={`flex items-center px-3 font-mono text-sm font-semibold ${
          selected ? "bg-accent text-white" : "bg-panel-strong"
        }`}
      >
        {data.table.name}
      </div>
      {data.table.columns.map((c) => (
        <div
          key={c.name}
          style={{ height: ROW_HEIGHT }}
          className="relative flex items-center justify-between border-t border-line px-3 font-mono text-xs"
        >
          <Handle type="target" position={Position.Left} id={`${c.name}-t`} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />
          <span className="flex items-center gap-1.5">
            <span className="w-5 text-[10px] font-bold">
              {c.isPrimaryKey ? (
                <span className="text-amber-500">PK</span>
              ) : c.references ? (
                <span className="text-accent">FK</span>
              ) : null}
            </span>
            {c.name}
          </span>
          <span className="text-muted">{c.type.replace("timestamp with time zone", "timestamptz")}</span>
          <Handle type="source" position={Position.Right} id={`${c.name}-s`} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />
        </div>
      ))}
    </div>
  );
}

const nodeTypes = { table: TableNodeView };

function buildGraph(tables: TableInfo[]): { nodes: TableNode[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 40, ranksep: 110 });
  g.setDefaultEdgeLabel(() => ({}));

  const edges: Edge[] = [];
  for (const t of tables) {
    g.setNode(t.name, { width: NODE_WIDTH, height: HEADER_HEIGHT + ROW_HEIGHT * t.columns.length });
    for (const c of t.columns) {
      if (!c.references) continue;
      // Draw from the referenced side (1) to the referencing side (N).
      if (c.references.table !== t.name) g.setEdge(c.references.table, t.name);
      edges.push({
        id: `${t.name}.${c.name}`,
        source: c.references.table,
        sourceHandle: `${c.references.column}-s`,
        target: t.name,
        targetHandle: `${c.name}-t`,
        type: "smoothstep",
        label: "1 : N",
        labelStyle: { fontSize: 10, fill: "var(--muted)" },
        labelBgStyle: { fill: "var(--panel)" },
        style: { stroke: "var(--accent)", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "var(--accent)" },
      });
    }
  }

  dagre.layout(g);

  const nodes: TableNode[] = tables.map((t) => {
    const { x, y, height } = g.node(t.name);
    return {
      id: t.name,
      type: "table",
      position: { x: x - NODE_WIDTH / 2, y: y - height / 2 },
      data: { table: t },
    };
  });

  return { nodes, edges };
}

export function ErdDiagram({
  tables,
  selected,
  onSelect,
}: {
  tables: TableInfo[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  const graph = useMemo(() => buildGraph(tables), [tables]);
  const [nodes, , onNodesChange] = useNodesState(graph.nodes);

  return (
    <SelectedTableContext value={selected}>
      <div className="h-[600px] overflow-hidden rounded-lg border border-line bg-background">
        <ReactFlow
          nodes={nodes}
          edges={graph.edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeClick={(_, node) => onSelect(node.id)}
          nodesConnectable={false}
          fitView
          minZoom={0.2}
          colorMode="dark"
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </SelectedTableContext>
  );
}
