# Backstage Plugins by Lockum

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

A monorepo for production-ready, enterprise-grade [Backstage](https://backstage.io/) plugins maintained by **Lockum**.

## Included Plugins

### 1. Data Contract API Plugin (Frontend) — `@lockum/backstage-plugin-datacontract`
- **Location**: `plugins/datacontract` — [Documentation](./plugins/datacontract/README.md)
- **Description**: Renders and visualizes **Open Data Contract Standard (ODCS) v3.2.0 / v3.x** and legacy Data Contract specifications inside Backstage API docs.
- **Key Features**: Native Backstage Material-UI components, schema & properties explorer with constraints (`PK`, `Required`, `Unique`, `Partitioned`, `CDE`), nested objects and arrays, foreign keys/relationships, servers, SLAs, data quality, team & support channels, roles, and raw YAML viewers with graceful fallbacks.

### 2. Data Contract Catalog Processor (Backend) — `@lockum/backstage-plugin-datacontract-backend`
- **Location**: `plugins/datacontract-backend` — [Documentation](./plugins/datacontract-backend/README.md)
- **Description**: Catalog processor module for Backstage that validates Data Contract API entities (`spec.type: datacontract`) during ingestion and enriches entity metadata (domain, data product, version, tags, support links).
- **Key Features**: Multi-standard offline validation (ODCS v3.2.0 draft-2019-09 schema + legacy draft-07 schema), Bitol issue #322 support (physical-only types), wildcard/templated cloud URI support (`s3://`, `gs://`, `abfss://`), and human-readable validation errors.

---

## Quick Start Example (ODCS v3.2.0)

A comprehensive sample contract is included in this repository:
- [`sample-datacontract-odcs-3.2.0.yaml`](./sample-datacontract-odcs-3.2.0.yaml)

```yaml
apiVersion: backstage.io/v1alpha1
kind: API
metadata:
  name: orders-datacontract
  title: Orders Data Contract
  owner: checkout-team
spec:
  type: datacontract
  definition: $file:./sample-datacontract-odcs-3.2.0.yaml
```

---

## Repository Structure

```
├── .changeset/                     # Semantic versioning & changelog management
├── adr/                            # Architecture Decision Records
├── docs/                           # Extended architecture and integration guides
├── plugins/
│   ├── datacontract/               # Frontend plugin (@lockum/backstage-plugin-datacontract)
│   └── datacontract-backend/       # Backend catalog module (@lockum/backstage-plugin-datacontract-backend)
├── sample-datacontract-odcs-3.2.0.yaml  # Complete ODCS v3.2.0 sample contract
└── package.json                    # Monorepo workspaces configuration
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

## Releases & Publishing

Releases are managed using [Changesets](https://github.com/changesets/changesets). See [RELEASE.md](./RELEASE.md) for publishing workflows.

---

## Links & Community

- **GitHub Repository**: [https://github.com/lockum/backstage-plugins](https://github.com/lockum/backstage-plugins)
- **Issues**: [https://github.com/lockum/backstage-plugins/issues](https://github.com/lockum/backstage-plugins/issues)
- **Open Data Contract Standard**: [https://bitol.io/](https://bitol.io/)

---

## License

Licensed under the Apache-2.0 License.
