---
"@lockum/backstage-plugin-datacontract": minor
"@lockum/backstage-plugin-datacontract-backend": minor
---

Upgrade Data Contract plugins to Open Data Contract Standard (ODCS) v3.2.0

- Upgraded backend processor to validate ODCS v3.2.0 specifications offline using draft 2019-09 schema.
- Added upstream fix for Bitol issue #322 (properties with only physicalType).
- Added catalog metadata enrichment for domain, dataProduct, version, tags, and support channels.
- Added interactive native Backstage Material-UI frontend explorer for ODCS v3.2.0 schemas, constraints, relationships, servers, SLAs, quality, team, and roles.
- Preserved complete backward compatibility with legacy dataContractSpecification contracts.

