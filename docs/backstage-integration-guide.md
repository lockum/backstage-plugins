# Complete Backstage Integration Guide

This guide details how to integrate `@lockum/backstage-plugin-datacontract` (frontend) and `@lockum/backstage-plugin-datacontract-backend` (backend) into any existing Backstage portal.

---

## Integration Methods

You can choose between **Option 1 (Direct Monorepo Copy)** or **Option 2 (Direct GitHub Dependency)** depending on your organization's workflow.

---

### Option 1: Monorepo / Direct Plugin Copy (Recommended)

This is the standard pattern for custom and forked Backstage plugins. It keeps all code within your portal without needing public npm publishing.

#### Step 1: Copy plugin directories
From the root of this repository, copy the two plugin folders into your target Backstage portal:

```bash
# Target directory: <your-backstage-root>/plugins/
cp -r plugins/datacontract /path-to-your-backstage/plugins/datacontract
cp -r plugins/datacontract-backend /path-to-your-backstage/plugins/datacontract-backend
```

#### Step 2: Add workspace dependencies
1. In `<your-backstage-root>/packages/app/package.json`:
   ```json
   "dependencies": {
     "@lockum/backstage-plugin-datacontract": "^0.2.0"
   }
   ```

2. In `<your-backstage-root>/packages/backend/package.json`:
   ```json
   "dependencies": {
     "@lockum/backstage-plugin-datacontract-backend": "^0.2.0"
   }
   ```

#### Step 3: Run install
```bash
cd /path-to-your-backstage
yarn install
```

---

### Option 2: Direct GitHub Git Dependency via Yarn

If you prefer referencing this repository directly through Git without copying files into your monorepo:

#### Step 1: Add via Yarn workspace Git URLs
From your Backstage repository root:

```bash
yarn workspace app add https://github.com/lockum/backstage-plugins.git#workspace=@lockum/backstage-plugin-datacontract
yarn workspace backend add https://github.com/lockum/backstage-plugins.git#workspace=@lockum/backstage-plugin-datacontract-backend
```

#### Step 2: Run install
```bash
yarn install
```

---

## Configuring Backstage Code

### 1. Frontend Configuration (`packages/app/src/App.tsx`)

In your Backstage frontend application:

```typescript
import {
  datacontractPlugin,
  withDatacontractApiDocsConfigFactory,
} from '@lockum/backstage-plugin-datacontract';
import { defaultDefinitionWidgets } from '@backstage/plugin-api-docs';

const app = createApp({
  apis: [
    // Replaces default definition widget when spec.type === 'datacontract'
    withDatacontractApiDocsConfigFactory(defaultDefinitionWidgets()),
  ],
  plugins: [
    datacontractPlugin,
  ],
});
```

### 2. Backend Configuration (`packages/backend/src/index.ts`)

In your Backstage backend application:

```typescript
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// Register the Data Contract catalog processor
backend.add(import('@lockum/backstage-plugin-datacontract-backend'));

backend.start();
```

---

## Adding Data Contracts to Catalog (`catalog-info.yaml`)

Define an API entity in your catalog with `spec.type: datacontract`:

```yaml
apiVersion: backstage.io/v1alpha1
kind: API
metadata:
  name: checkout-orders-datacontract
  title: Checkout Orders Data Contract
  description: Official customer orders data contract
  owner: checkout-team
spec:
  type: datacontract
  lifecycle: production
  definition: $file:./sample-datacontract-odcs-3.2.0.yaml
```

### Supported Contract Formats
- **Open Data Contract Standard (ODCS) v3.2.0 / v3.x**: Validated with the vendored JSON Schema draft 2019-09.
- **Legacy Data Contract Specifications (0.9.x / 1.x)**: Validated and automatically normalized into the unified ODCS viewer.

---

## Verification in Your Portal

1. Start your Backstage app: `yarn start`.
2. Navigate to **APIs** in the sidebar.
3. Open your Data Contract entity.
4. Click on the **Definition** tab: the interactive ODCS v3.2.0 explorer renders with tabs for Schema, Constraints, Servers, SLAs, Data Quality, Team, and Roles.
