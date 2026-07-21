import dagre from 'dagre';
import { Node, Edge, Position } from '@xyflow/react';

const NODE_WIDTH = 250;
const NODE_HEIGHT = 100; // rough estimate of block height
const HORIZONTAL_SPACING = 100;
const VERTICAL_SPACING = 80;

export const buildGraphFromTemplate = (
    templateBlocks: any[],
    templateEdges: any[]
): { nodes: Node[]; edges: Edge[] } => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    // Configure dagre layout direction LR (Left to Right)
    dagreGraph.setGraph({
        rankdir: 'LR',
        ranksep: HORIZONTAL_SPACING,
        nodesep: VERTICAL_SPACING,
    });

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // 1. Map blocks to nodes and add to dagre
    templateBlocks.forEach((block) => {
        const nodeId = block.id || `node-${block.order}`;
        
        // Check if block requires manual input based on its type and config
        let requiresInput = false;
        if (block.type === 'dataNode') {
            requiresInput = true; // Always requires a file
        } else if (block.type === 'modelNode') {
            requiresInput = true; // Always requires target column selection
        }
        
        const node: Node = {
            id: nodeId,
            type: block.type,
            position: { x: 0, y: 0 }, // will be set by dagre
            data: {
                ...block.config,
                requiresInput,
            },
        };
        nodes.push(node);
        
        dagreGraph.setNode(nodeId, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    // 2. Map template edges to React Flow edges and add to dagre
    templateEdges.forEach((edge, index) => {
        const edgeId = `e-${edge.source}-${edge.target}-${index}`;
        
        const rfEdge: Edge = {
            id: edgeId,
            source: edge.source,
            target: edge.target,
            animated: true,
            style: { stroke: '#1A73E8', strokeWidth: 2 },
        };
        edges.push(rfEdge);
        
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // 3. Execute layout
    dagre.layout(dagreGraph);

    // 4. Assign calculated positions back to nodes
    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        // dagre sets x, y to the center of the node, React Flow needs top-left
        node.position = {
            x: nodeWithPosition.x - NODE_WIDTH / 2,
            y: nodeWithPosition.y - NODE_HEIGHT / 2,
        };
        // Explicitly set target/source positions for LR layout
        node.targetPosition = Position.Left;
        node.sourcePosition = Position.Right;
    });

    return { nodes, edges };
};
