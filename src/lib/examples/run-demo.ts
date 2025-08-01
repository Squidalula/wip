import { demonstrateFlowExecution, demonstrateErrorHandling } from './flow-execution-example';
import { flowExecutor } from '../services/FlowExecutor';
import { flowService } from '../services/FlowService';

/**
 * Run flow execution demos
 * Call this from browser console: runFlowDemo()
 */
export async function runFlowDemo() {
	console.log('🚀 Starting Flow Execution Demo');
	
	try {
	
		await demonstrateFlowExecution();
		
	
		await demonstrateErrorHandling();
		
	
		console.log('\n📋 Testing Template Flows:');
		const templates = await flowService.getFlowTemplates();
		
		for (const template of templates) {
			if (template.nodes.length > 0) {
				console.log(`\n🔄 Executing template: ${template.name}`);
				const result = await flowExecutor.executeFlow(template);
				console.log(`${result.success ? '✅' : '❌'} ${template.name}: ${result.totalDuration}ms`);
			}
		}
		
		console.log('\n🎉 Demo completed!');
		
	} catch (error) {
		console.error('❌ Demo failed:', error);
	}
}


if (typeof window !== 'undefined') {
	(window as any).runFlowDemo = runFlowDemo;
} 