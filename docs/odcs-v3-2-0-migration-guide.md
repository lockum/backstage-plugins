# ODCS v3.2.0 Migration & Integration Guide

This guide details the architecture, upgrade paths, and field mapping from legacy Data Contract specifications (0.9.x / 1.x) to the **Open Data Contract Standard (ODCS) v3.2.0**.

---

## ODCS v3.2.0 Field Mapping Matrix

| Category | Legacy (`dataContractSpecification`) | ODCS v3.2.0 (`apiVersion: v3.2.0`) | Notes / Guidance |
| :--- | :--- | :--- | :--- |
| **Contract Header** | `dataContractSpecification`, `id`, `info.title`, `info.version`, `info.description` | `apiVersion`, `kind: DataContract`, `id`, `name`, `version`, `status`, `domain`, `dataProduct`, `tenant`, `description` | `description` can be a markdown string or a structured object (`purpose`, `limitations`, `usage`). |
| **Ownership & Team** | `info.owner`, `info.contact` | `team` array (`name`, `username`, `role`, `dateIn`, `dateOut`, `replacedByUsername`) | Enables rich team hierarchy and ownership tracking. |
| **Support Channels** | `info.contact.url` | `support` array (`channel`, `url`, `description`, `tool`, `scope`) | Integrates Slack channels, mailing lists, and escalation scopes. |
| **Servers / Endpoints** | `servers` object keyed by server name | `servers` array of objects (`server`, `type`, `description`, `environment`, `host`, `port`, `database`, `schema`, `location`, `format`) | Standardized array format with typed properties for cloud and relational sources. |
| **Schema Objects (Tables)** | `models` object keyed by model name | `schema` array of SchemaObjects (`name`, `physicalName`, `logicalType`, `physicalType`, `description`, `businessName`, `authoritativeDefinitions`, `tags`, `relationships`, `properties`) | First-class support for multiple schema objects and foreign key relationships. |
| **Properties (Columns)** | `models.<model>.fields.<field>` (`type`, `required`, `primary`, `unique`, `example`, `classification`) | `schema[].properties[]` array (`name`, `businessName`, `logicalType`, `logicalTypeOptions`, `physicalType`, `description`, `required`, `primaryKey`, `primaryKeyPosition`, `unique`, `examples`, `classification`, `partitioned`, `criticalDataElement`, `relationships`, `items`, `properties`) | Full support for nested object properties and array item schemas. Supports physical-only types (Bitol #322). |
| **Relationships (ER / FK)** | Not natively supported | `relationships` array on both `schema[]` and `properties[]` (`type`, `from`, `to`, `customProperties`) | Expresses foreign keys and entity-relationship links. |
| **Service Level Agreements**| `servicelevels` object | `slaProperties` array (`property`, `value`, `valueExt`, `unit`, `element`, `driver`) | Standardized SLA metrics (latency, freshness, availability). |
| **Data Quality** | `quality` object | `quality` array (`type`, `description`, `dimension`, `rule`, `severity`, `engine`, `implementation`, `schedule`) | Standardized data quality rules across tables and fields. |
| **Roles & Pricing** | Not supported | `roles` array (`role`, `description`, `access`, `firstLevelApprovers`, `secondLevelApprovers`) & `price` object | Role-based data access governance and chargeback modeling. |

---

## Dual-Standard Support

The `@lockum/backstage-plugin-datacontract` and `@lockum/backstage-plugin-datacontract-backend` plugins support dual operation:

1. **Native ODCS v3.2.0 Ingestion**: Contracts specifying `apiVersion: v3.2.0` (or `v3.x`) and `kind: DataContract` are validated against the vendored ODCS JSON Schema Draft 2019-09.
2. **Backward Compatibility**: Legacy contracts specifying `dataContractSpecification` are automatically validated against the legacy Draft-07 schema on the backend and adapted on the frontend into the unified ODCS model.

---

## Catalog Metadata Enrichment

When an ODCS contract is processed, the backend processor automatically populates the Backstage API entity:

- **Annotations**:
  - `datacontract/domain`: Contract domain
  - `datacontract/data-product`: Contract dataProduct
  - `datacontract/version`: Contract version
- **Tags**: Synchronizes sanitized contract tags (`entity.metadata.tags`).
- **Links**: Automatically populates `entity.metadata.links` with support channel URLs (e.g. Slack channels, docs).

---

## Example ODCS v3.2.0 Contract

See [`sample-datacontract-odcs-3.2.0.yaml`](../sample-datacontract-odcs-3.2.0.yaml) in the repository root for a full production example.

