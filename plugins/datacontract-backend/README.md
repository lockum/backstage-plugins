# Backstage Data Contract Catalog Processor (Backend)

[![npm version](https://img.shields.io/npm/v/@lockum/backstage-plugin-datacontract-backend.svg)](https://www.npmjs.com/package/@lockum/backstage-plugin-datacontract-backend)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

A production-ready Backstage backend module that registers a catalog processor for validating, ingesting, and enriching **Open Data Contract Standard (ODCS v3.2.0 / v3.x)** and legacy Data Contract API entities in the Backstage catalog.

Works hand-in-hand with the frontend plugin [`@lockum/backstage-plugin-datacontract`](../datacontract).

---

## Features

- **Multi-Standard Validation**:
  - Validates **Open Data Contract Standard (ODCS) v3.2.0 / v3.x** using a vendored draft-2019-09 JSON schema.
  - Validates legacy **Data Contract specifications (0.9.x / 1.x)** using the draft-07 JSON schema.
  - Fully offline schema validation with zero runtime network roundtrips.
- **Upstream Edge Case Fix (Bitol #322)**:
  - Supports properties defining only `physicalType` without `logicalType` (e.g. database-native types like `jsonb`, `timestamptz`).
- **Templated & Wildcard URI Validation**:
  - Validates cloud storage URI locations (`s3://`, `gs://`, `abfss://`, `hdfs://`, `file://`) containing `{model}` or `{partition}` variables and `*` wildcards.
- **Catalog Metadata Enrichment**:
  - Automatically enriches Backstage entity metadata from the contract:
    - Adds `datacontract/domain`, `datacontract/data-product`, and `datacontract/version` annotations.
    - Sanitizes and synchronizes contract `tags` to `entity.metadata.tags`.
    - Populates `entity.metadata.links` from contract `support` channels.
- **Clear Error Reporting**:
  - Emits human-readable validation paths and messages to the catalog processing logs and entity error warnings.

---

## Installation

### 1. Install Backend Package

```bash
# From your Backstage root directory
yarn workspace backend add @lockum/backstage-plugin-datacontract-backend
```

### 2. Register in Backstage Backend

In `packages/backend/src/index.ts`:

```typescript
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// Register the datacontract catalog module
backend.add(import('@lockum/backstage-plugin-datacontract-backend'));

backend.start();
```

---

## Usage

Define an API entity with `spec.type: datacontract` with inline YAML or a `$file:` reference in `spec.definition`:

```yaml
apiVersion: backstage.io/v1alpha1
kind: API
metadata:
  name: orders-datacontract
  title: Orders Data Contract
  description: Customer checkout orders contract
  owner: checkout-team
spec:
  type: datacontract
  definition: $file:./sample-datacontract-odcs-3.2.0.yaml
```

When Backstage processes this entity:
1. The definition is loaded and detected as ODCS v3.2.0 or legacy format.
2. The schema is validated offline using AJV.
3. If valid, domain, dataProduct, tags, and support channels are enriched onto the entity.
4. If invalid, detailed error messages appear in the Backstage catalog entity view.

---

## Development & Testing

```bash
# Run unit tests
yarn workspace @lockum/backstage-plugin-datacontract-backend test

# Build
yarn workspace @lockum/backstage-plugin-datacontract-backend build
```

---

## Links & References

- **GitHub Repository**: [https://github.com/lockum/backstage-plugins](https://github.com/lockum/backstage-plugins)
- **Issues & Contributions**: [https://github.com/lockum/backstage-plugins/issues](https://github.com/lockum/backstage-plugins/issues)
- **Frontend Plugin**: [`@lockum/backstage-plugin-datacontract`](../datacontract)

---

## License

Licensed under the Apache-2.0 License.
