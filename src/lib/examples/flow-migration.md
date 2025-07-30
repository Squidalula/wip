# Flow Service - API-Ready Structure

This service provides API-like data structures and methods while working locally. When ready to migrate to a real API, you'll only need to change the implementation inside the service methods.

## Current Setup (Local with API-like Structure)

The FlowService is designed to mimic what an API would look like:

```typescript
// Data structures match what API would return
interface FlowData {
  id: string;
  name: string;
  description?: string;
  nodes: AutomationNode[];
  edges: Edge[];
  createdAt?: string;
  updatedAt?: string;
}

interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  nodes: AutomationNode[];
  edges: Edge[];
}
```

## Current Methods

```typescript
// These method signatures match what an API service would have
await flowService.getFlowTemplates()     // GET /api/flows/templates
await flowService.getFlow(id)            // GET /api/flows/:id
await flowService.saveFlow(flow)         // POST /api/flows
await flowService.updateFlow(id, flow)   // PUT /api/flows/:id
await flowService.deleteFlow(id)         // DELETE /api/flows/:id
```

## Future API Migration

When you're ready to use a real API, you'll only need to replace the method implementations:

```typescript
// BEFORE (current local implementation)
async getFlow(id: string): Promise<FlowData | null> {
  if (this.flows.has(id)) {
    return this.flows.get(id)!;
  }
  // ... local logic
}

// AFTER (API implementation)
async getFlow(id: string): Promise<FlowData | null> {
  const response = await fetch(`/api/flows/${id}`);
  return response.ok ? await response.json() : null;
}
```

## Using the Service

```typescript
import { flows } from '../lib/config/flows';

// Get available templates
const templates = await flows.getTemplates();

// Load a specific flow
const flow = await flows.getFlow('empty');

// Save a new flow (works locally for now)
const saved = await flows.saveFlow({
  name: 'My Workflow',
  description: 'Custom automation',
  nodes: [...],
  edges: [...]
});

// Update existing flow
const updated = await flows.updateFlow(saved.id, {
  name: 'Updated Workflow'
});
```

## Benefits of This Approach

✅ **API-ready structure** - Data matches what API would return
✅ **Same method signatures** - No refactoring needed when switching to API
✅ **Type safety** - Full TypeScript support
✅ **Working locally** - No API needed during development
✅ **Easy migration** - Only change method implementations, not calling code

## Migration Path

1. **Now**: Use local FlowService with API-like structure
2. **Later**: Replace method implementations with fetch calls
3. **Done**: Same interfaces, same calling code, now using real API

The service is designed to make this transition seamless! 