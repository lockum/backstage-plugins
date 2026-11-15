# Backstage Data Contract Plugin (Frontend)

[![npm version](https://img.shields.io/npm/v/@lockum/backstage-plugin-datacontract.svg)](https://www.npmjs.com/package/@lockum/backstage-plugin-datacontract)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

A production-ready Backstage frontend plugin for rendering and exploring **Open Data Contract Standard (ODCS v3.2.0 / v3.x)** as well as legacy Data Contract specifications within your Backstage software catalog.

This plugin bridges the gap between data producers and data consumers by providing native, interactive documentation of data contracts directly inside Backstage API entities.

## Key Capabilities

- **Native Open Data Contract Standard (ODCS) v3.2.0 Support**: Validates and renders ODCS specifications (`apiVersion: v3.2.0`, `kind: DataContract`).
- **Universal Backward Compatibility**: Seamlessly renders legacy Data Contract specifications (`dataContractSpecification: 0.9.x / 1.x`) via an automated internal adapter.
- **Rich Interactive UI (Backstage Material-UI)**:
  - **Header & Overview**: Contract name, version badge, lifecycle status (`active`, `draft`, `deprecated`), domain, data product, tenant, and structured descriptions (`purpose`, `limitations`, `usage`).
  - **Schema & Properties Explorer**: Detailed tables with logical & physical data types, constraints badges (`PK`, `Required`, `Unique`, `Partitioned`, `CDE`), classifications, examples, and foreign key relationships.
  - **Nested Object & Array Support**: Recursively renders nested object properties and array items.
  - **Dedicated Governance Tabs**: Dedicated views for Servers, Service Level Agreements (SLAs), Data Quality rules, Team Members & Support Channels, Access Roles & Security, and Raw YAML.
  - **Graceful Error Fallback**: If an invalid definition is loaded, displays a clear warning alert and a raw syntax-highlighted YAML viewer without crashing the portal.

---

## Installation

### 1. Install Frontend Package

From your Backstage repository root:

```bash
yarn workspace app add @lockum/backstage-plugin-datacontract
```

### 2. Configure in Backstage App

In your Backstage frontend app (`packages/app/src/App.tsx`):

```typescript
import {
  datacontractPlugin,
  withDatacontractApiDocsConfigFactory,
} from '@lockum/backstage-plugin-datacontract';
import {
  defaultDefinitionWidgets,
  apiDocsConfigRef,
} from '@backstage/plugin-api-docs';

const app = createApp({
  apis: [
    // Register the Data Contract definition widget factory with fallback to defaults
    withDatacontractApiDocsConfigFactory(defaultDefinitionWidgets()),
  ],
  plugins: [
    datacontractPlugin,
  ],
});
```

---

## Companion Backend Processor

To validate Data Contract entities during catalog ingestion, install the backend processor:

```bash
yarn workspace backend add @lockum/backstage-plugin-datacontract-backend
```

In `packages/backend/src/index.ts`:

```typescript
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// Register the datacontract catalog module
backend.add(import('@lockum/backstage-plugin-datacontract-backend'));

backend.start();
```

---

## ODCS v3.2.0 Data Contract Example

Create a Backstage API entity referencing an ODCS v3.2.0 contract:

```yaml
apiVersion: backstage.io/v1alpha1
kind: API
metadata:
  name: checkout-orders-contract
  title: Checkout Orders Data Contract
  description: Official customer orders data contract
  owner: checkout-team
  tags:
    - datacontract
    - checkout
    - orders
spec:
  type: datacontract
  definition: |
    apiVersion: v3.2.0
    kind: DataContract
    id: urn:datacontract:checkout:orders
    name: Checkout Orders Data Contract
    version: 3.2.0
    status: active
    domain: Checkout
    dataProduct: OrderAnalytics
    tenant: Global
    description:
      purpose: Provides certified real-time customer order events.
      limitations: Excludes raw payment gateway tokens.
      usage: Query via Athena on S3 or the PostgreSQL read replica.
    tags:
      - orders
      - checkout
    servers:
      - server: production-s3
        type: s3
        environment: production
        location: s3://datacontract-checkout-prod/orders/v3/*.parquet
        format: parquet
    schema:
      - name: orders
        physicalName: tbl_orders
        description: Master table containing verified customer orders.
        relationships:
          - type: foreign_key
            from: customer_id
            to: customers.id
        properties:
          - name: order_id
            businessName: Order Identifier
            logicalType: string
            physicalType: varchar(64)
            required: true
            primaryKey: true
            unique: true
            examples:
              - "ORD-2026-001"
          - name: customer_id
            logicalType: string
            physicalType: uuid
            required: true
            classification: sensitive
          - name: order_total
            logicalType: number
            physicalType: decimal(12,2)
            required: true
            criticalDataElement: true
          - name: raw_metadata
            physicalType: jsonb
            description: Column specifying only physicalType
    slaProperties:
      - property: latency
        value: 15
        unit: minutes
    quality:
      - type: rowCount
        rule: "rowCount > 0"
        severity: error
    team:
      - name: Alice Smith
        username: asmith
        role: Lead Data Engineer
    support:
      - channel: "#checkout-data"
        tool: slack
        url: https://slack.com/archives/checkout-data
    roles:
      - role: data-analyst
        access: read
```

### Loading External Definition Files

You can also reference external files using `$file:` in `spec.definition`:

```yaml
apiVersion: backstage.io/v1alpha1
kind: API
metadata:
  name: orders-contract
spec:
  type: datacontract
  definition: $file:./sample-datacontract-odcs-3.2.0.yaml
```

---

## Development & Testing

```bash
# Run unit and component tests
yarn workspace @lockum/backstage-plugin-datacontract test

# Run build
yarn workspace @lockum/backstage-plugin-datacontract build
```

---

## Links & References

- **GitHub Repository**: [https://github.com/lockum/backstage-plugins](https://github.com/lockum/backstage-plugins)
- **Issues & Contributions**: [https://github.com/lockum/backstage-plugins/issues](https://github.com/lockum/backstage-plugins/issues)
- **Open Data Contract Standard (ODCS)**: [https://github.com/bitol-io/open-data-contract-standard](https://github.com/bitol-io/open-data-contract-standard)
- **DataContract Specification**: [https://datacontract.com/](https://datacontract.com/)

---

## License

Licensed under the Apache-2.0 License.
