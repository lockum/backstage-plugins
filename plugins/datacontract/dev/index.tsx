import type { ApiEntity } from "@backstage/catalog-model";
import { createApiFactory } from "@backstage/core-plugin-api";
import { createDevApp } from "@backstage/dev-utils";
import {
	type ApiDefinitionWidget,
	apiDocsConfigRef,
	defaultDefinitionWidgets,
} from "@backstage/plugin-api-docs";
import {
	DataContractDefinitionWidget,
	datacontractPlugin,
} from "../src/plugin";

const sampleOdcsContract: string = `
apiVersion: v3.2.0
kind: DataContract
id: urn:datacontract:checkout:orders-v3
name: Checkout Orders Data Contract
version: 3.2.0
status: active
domain: Checkout
dataProduct: OrderAnalytics
tenant: Global
description:
  purpose: Real-time customer checkout orders data for analytics and fraud detection.
  limitations: Excludes raw payment gateway tokens and test transactions.
  usage: Query via Athena/S3 partitioned parquet files or the PostgreSQL read replica.
tags:
  - checkout
  - orders
  - e-commerce
servers:
  - server: production-s3
    type: s3
    environment: production
    location: s3://datacontract-checkout-prod/orders/v3/*.parquet
    format: parquet
    description: Primary production data lake storage.
  - server: postgres-replica
    type: postgresql
    environment: staging
    host: pg-replica.internal.example.com
    port: 5432
    database: checkout_analytics
    schema: public
schema:
  - name: orders
    physicalName: tbl_orders_v3
    logicalType: object
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
        description: Unique primary transaction identifier.
        required: true
        primaryKey: true
        unique: true
        examples:
          - "ORD-2026-98124"
      - name: customer_id
        logicalType: string
        physicalType: uuid
        required: true
        classification: sensitive
        relationships:
          - type: foreign_key
            to: customers.id
      - name: order_total
        businessName: Gross Total
        logicalType: number
        physicalType: decimal(12,2)
        required: true
        criticalDataElement: true
        examples:
          - 129.99
      - name: raw_metadata
        businessName: Gateway Payload
        physicalType: jsonb
        description: Property with physicalType only (Bitol #322 upstream fix).
      - name: items
        logicalType: array
        description: Line items contained in this order.
        items:
          name: order_item
          logicalType: object
          properties:
            - name: sku
              logicalType: string
              required: true
            - name: quantity
              logicalType: integer
              required: true
slaProperties:
  - property: latency
    value: 15
    unit: minutes
  - property: freshness
    value: 1
    unit: hours
quality:
  - type: rowCount
    rule: "rowCount > 0"
    severity: error
team:
  - name: Alice Smith
    username: asmith
    role: Lead Data Engineer
support:
  - channel: "#checkout-data-support"
    tool: slack
    url: https://slack.com/archives/checkout-data-support
roles:
  - role: data-analyst
    description: Read-only query access.
    access: read
`;

const sampleLegacyDataContract: string = `
dataContractSpecification: 0.9.3
id: urn:datacontract:checkout:orders-latest
info:
  title: Orders Latest (Legacy)
  version: 1.0.0
  description: Successful customer orders in the webshop (legacy specification).
  owner: Checkout Team
  contact:
    name: John Doe (Data Product Owner)
    url: https://teams.microsoft.com/l/channel/example/checkout
servers:
  production:
    type: s3
    location: s3://datacontract-example-orders-latest/data/{model}/*.json
    format: json
models:
  orders:
    type: table
    description: Orders table.
    fields:
      order_id:
        type: string
        required: true
        primary: true
        unique: true
      customer_id:
        type: string
        required: true
`;

createDevApp()
	.registerPlugin(datacontractPlugin)
	.addPage({
		element: <DataContractDefinitionWidget definition={sampleOdcsContract} />,
		title: "ODCS v3.2.0 Contract",
		path: "/backstage-plugin-datacontract",
	})
	.addPage({
		element: (
			<DataContractDefinitionWidget definition={sampleLegacyDataContract} />
		),
		title: "Legacy Contract (0.9.x)",
		path: "/backstage-plugin-datacontract-legacy",
	})
	.registerApi(
		createApiFactory({
			api: apiDocsConfigRef,
			deps: {},
			factory: () => {
				const definitionWidgets = defaultDefinitionWidgets();

				const factory = {
					getApiDefinitionWidget: (apiEntity: ApiEntity) => {
						if (apiEntity.spec.type === "datacontract") {
							return {
								type: "datacontract",
								title: "DataContract",
								rawLanguage: "yaml",
								component: (definition: string) => (
									<div>
										<DataContractDefinitionWidget definition={definition} />
									</div>
								),
							} as ApiDefinitionWidget;
						}
						return definitionWidgets.find(
							(d) => d.type === apiEntity.spec.type,
						);
					},
				};
				return factory;
			},
		}),
	)
	.render();
