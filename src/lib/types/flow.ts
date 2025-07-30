// Flow editor specific types
export interface FlowPosition {
	x: number;
	y: number;
}

export interface FlowViewport {
	x: number;
	y: number;
	zoom: number;
}

export interface FlowState {
	nodes: any[];
	edges: any[];
	viewport: FlowViewport;
	selectedNodes: string[];
	selectedEdges: string[];
}

export interface FlowEvent {
	type: 'node-click' | 'edge-click' | 'canvas-click' | 'node-drag' | 'zoom' | 'pan';
	data: any;
}

export interface ConnectionParams {
	source: string;
	target: string;
	sourceHandle?: string;
	targetHandle?: string;
}
