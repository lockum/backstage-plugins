# Backstage Plugins by Lockum

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

A monorepo for production-ready, enterprise-grade [Backstage](https://backstage.io/) plugins maintained by **Lockum**.

## Included Plugins

### 1. Data Contract API Plugin (Frontend) — `@lockum/backstage-plugin-datacontract`
- **Location**: `plugins/datacontract` — [Frontend Documentation](./plugins/datacontract/README.md)
- **Description**: Renders and visualizes **Open Data Contract Standard (ODCS) v3.2.0 / v3.x** and legacy Data Contract specifications inside Backstage API docs.
- **Key Features**: Native Backstage Material-UI components, schema & properties explorer with constraints (`PK`, `Required`, `Unique`, `Partitioned`, `CDE`), nested objects and arrays, foreign keys/relationships, servers, SLAs, data quality, team & support channels, roles, and raw YAML viewers with graceful fallbacks.

### 2. Data Contract Catalog Processor (Backend) — `@lockum/backstage-plugin-datacontract-backend`
- **Location**: `plugins/datacontract-backend` — [Backend Documentation](./plugins/datacontract-backend/README.md)
- **Description**: Catalog processor module for Backstage that validates Data Contract API entities (`spec.type: datacontract`) during ingestion and enriches entity metadata (domain, data product, version, tags, support links).
- **Key Features**: Multi-standard offline validation (ODCS v3.2.0 draft-2019-09 schema + legacy draft-07 schema), Bitol issue #322 support (physical-only types), wildcard/templated cloud URI support (`s3://`, `gs://`, `abfss://`), and human-readable validation errors.

---

## How to Install in Your Backstage Instance

You can integrate these plugins into any Backstage portal using either **Option 1 (Direct Monorepo Copy)** or **Option 2 (Direct GitHub Dependency)** without needing public npm publishing.

### Option 1: Monorepo / Direct Plugin Copy (Recommended)
This is the standard approach used by enterprise teams managing internal or forked Backstage plugins.

1. **Copy the plugin folders** into your Backstage monorepo's `plugins/` directory:
   - Copy `plugins/datacontract` $\rightarrow$ `<your-backstage-repo>/plugins/datacontract`
   - Copy `plugins/datacontract-backend` $\rightarrow$ `<your-backstage-repo>/plugins/datacontract-backend`

2. **Add to your app & backend `package.json`**:
   - In `<your-backstage-repo>/packages/app/package.json`:
     ```json
     "dependencies": {
       "@lockum/backstage-plugin-datacontract": "^0.2.0"
     }
     ```
   - In `<your-backstage-repo>/packages/backend/package.json`:
     ```json
     "dependencies": {
       "@lockum/backstage-plugin-datacontract-backend": "^0.2.0"
     }
     ```

3. **Install dependencies**:
   ```bash
   yarn install
   ```

---

### Option 2: Direct GitHub Git Dependency via Yarn
If you prefer referencing the GitHub repository directly without copying files:

1. **Add packages using Yarn workspace Git URLs**:
   ```bash
   # From your Backstage repository root:
   yarn workspace app add https://github.com/lockum/backstage-plugins.git#workspace=@lockum/backstage-plugin-datacontract
   yarn workspace backend add https://github.com/lockum/backstage-plugins.git#workspace=@lockum/backstage-plugin-datacontract-backend
   ```

2. **Run install**:
   ```bash
   yarn install
   ```

---

### Registering the Plugins in Backstage Code

#### Frontend (`packages/app/src/App.tsx`):
```typescript
import {
  datacontractPlugin,
  withDatacontractApiDocsConfigFactory,
} from '@lockum/backstage-plugin-datacontract';
import { defaultDefinitionWidgets } from '@backstage/plugin-api-docs';

const app = createApp({
  apis: [
    // Intercepts entities with spec.type === 'datacontract'
    withDatacontractApiDocsConfigFactory(defaultDefinitionWidgets()),
  ],
  plugins: [
    datacontractPlugin,
  ],
});
```

#### Backend (`packages/backend/src/index.ts`):
```typescript
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// Registers the Data Contract catalog processor
backend.add(import('@lockum/backstage-plugin-datacontract-backend'));

backend.start();
```

---

## Registering a Data Contract Entity (`catalog-info.yaml`)

Add a contract entity to your Backstage software catalog:

```yaml
apiVersion: backstage.io/v1alpha1
kind: API
metadata:
  name: checkout-orders-contract
  title: Checkout Orders Data Contract
  description: Official customer orders data contract
  owner: checkout-team
spec:
  type: datacontract
  lifecycle: production
  definition: $file:./sample-datacontract-odcs-3.2.0.yaml
```

A complete reference contract demonstrating all ODCS v3.2.0 features is available at [`sample-datacontract-odcs-3.2.0.yaml`](./sample-datacontract-odcs-3.2.0.yaml).

---

## Repository Structure

```
├── .changeset/                             # Semantic versioning & changelog management
├── adr/                                    # Architecture Decision Records
├── docs/                                   # Extended architecture and integration guides
│   ├── backstage-integration-guide.md      # Step-by-step Backstage installation guide
│   └── odcs-v3-2-0-migration-guide.md      # ODCS field mapping & upgrade guide
├── plugins/
│   ├── datacontract/                       # Frontend plugin (@lockum/backstage-plugin-datacontract)
│   └── datacontract-backend/               # Backend catalog module (@lockum/backstage-plugin-datacontract-backend)
├── sample-datacontract-odcs-3.2.0.yaml          # Complete ODCS v3.2.0 sample contract
└── package.json                            # Monorepo workspaces configuration
```

---

## Development

This repository uses **Yarn Berry** and **Biome**.

```bash
# Install dependencies
yarn install

# Run TypeScript typechecks across all packages
yarn tsc

# Run test suites across all packages
yarn test

# Lint and format check
yarn biome check .
```

---

## Links & Community

- **GitHub Repository**: [https://github.com/lockum/backstage-plugins](https://github.com/lockum/backstage-plugins)
- **Issues**: [https://github.com/lockum/backstage-plugins/issues](https://github.com/lockum/backstage-plugins/issues)
- **Open Data Contract Standard**: [https://bitol.io/](https://bitol.io/)

---

## License

Licensed under the Apache-2.0 License.
