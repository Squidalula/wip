# Project Architecture & Organization

## 📁 Recommended Folder Structure

```
src/
├── lib/                          # Shared utilities & business logic
│   ├── stores/                   # Global state management
│   │   ├── theme.svelte.ts       # Theme management
│   │   ├── workflow.svelte.ts    # Workflow state
│   │   └── nodes.svelte.ts       # Node definitions & data
│   ├── types/                    # TypeScript type definitions
│   │   ├── automation.ts         # Automation-specific types
│   │   ├── flow.ts              # Flow/canvas types
│   │   └── ui.ts                # UI component types
│   ├── utils/                    # Utility functions
│   │   ├── node-factory.ts       # Node creation utilities
│   │   ├── validation.ts         # Data validation
│   │   └── export-import.ts      # Workflow serialization
│   └── services/                 # External API services
│       ├── workflow-api.ts       # Workflow CRUD operations
│       └── execution-api.ts      # Workflow execution
│
├── components/                   # UI Components organized by feature
│   ├── ui/                      # Generic/reusable UI components
│   │   ├── Button.svelte
│   │   ├── Modal.svelte
│   │   ├── SearchInput.svelte
│   │   └── index.ts             # Barrel exports
│   ├── layout/                  # Layout-related components
│   │   ├── HamburgerMenu.svelte
│   │   ├── Sidebar.svelte
│   │   └── TopBar.svelte
│   ├── flow/                    # Flow editor related
│   │   ├── FlowEditor.svelte
│   │   ├── FlowControls.svelte
│   │   ├── NodeRenderer.svelte
│   │   └── EdgeRenderer.svelte
│   ├── nodes/                   # Node-specific components
│   │   ├── NodePalette.svelte   # (current NodeSelectionModal)
│   │   ├── AddNodeButton.svelte
│   │   ├── NodeConfigPanel.svelte
│   │   └── node-types/          # Individual node type components
│   │       ├── TriggerNode.svelte
│   │       ├── ActionNode.svelte
│   │       ├── LogicNode.svelte
│   │       └── CodeNode.svelte
│   └── workflow/                # Workflow management
│       ├── WorkflowList.svelte
│       ├── WorkflowSave.svelte
│       └── WorkflowExport.svelte
│
├── routes/                      # SvelteKit routes
│   ├── (app)/                   # Route groups
│   │   ├── workflow/
│   │   │   ├── [id]/
│   │   │   │   └── +page.svelte
│   │   │   └── +page.svelte
│   │   └── +layout.svelte
│   ├── +layout.svelte
│   └── +page.svelte
│
└── tests/                       # Test files mirroring structure
    ├── components/
    ├── lib/
    └── routes/
```

## 🎯 **Organization Principles**

### 1. **Feature-Based Grouping**

- Group related components together
- Each feature has its own folder
- Clear boundaries between concerns

### 2. **Separation of Concerns**

- **`/lib`**: Business logic, stores, utilities
- **`/components`**: Pure UI components
- **`/routes`**: Page-level components and routing

### 3. **Scalable Imports**

```typescript
// Instead of:
import HamburgerMenu from '../components/HamburgerMenu.svelte';
import AddNodeButton from '../components/AddNodeButton.svelte';

// Use barrel exports:
import { HamburgerMenu } from '$lib/components/layout';
import { AddNodeButton } from '$lib/components/nodes';
```

### 4. **Clear Dependencies**

- UI components depend on stores/services
- Stores handle business logic
- Services handle external APIs
- Types are shared across all layers

## 🔄 **Migration Strategy**

1. **Phase 1**: Move current files to new structure
2. **Phase 2**: Create barrel exports (`index.ts` files)
3. **Phase 3**: Extract business logic to stores
4. **Phase 4**: Add type definitions
5. **Phase 5**: Implement services layer

## 📝 **Naming Conventions**

- **Components**: PascalCase (e.g., `FlowEditor.svelte`)
- **Stores**: camelCase (e.g., `themeStore.svelte.ts`)
- **Types**: PascalCase (e.g., `AutomationNode`)
- **Utils**: camelCase (e.g., `createNode()`)
- **Folders**: kebab-case (e.g., `node-types/`)
