import { flowService } from '../services/FlowService';

import type { FlowData } from '../types/automation';

// Quick access to flow service methods
export const flows = {
	getTemplates: () => flowService.getFlowTemplates(),
	getFlow: (id: string) => flowService.getFlow(id),
	saveFlow: (flow: Omit<FlowData, 'id' | 'createdAt' | 'updatedAt'>) => flowService.saveFlow(flow),
	updateFlow: (id: string, flow: Partial<FlowData>) => flowService.updateFlow(id, flow),
	deleteFlow: (id: string) => flowService.deleteFlow(id),
}; 