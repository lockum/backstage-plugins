import { render, screen } from "@testing-library/react";
import { DataContractDefinitionWidget } from "./index";

describe("DataContractDefinitionWidget", () => {
	const sampleOdcsYaml = `
apiVersion: v3.2.0
kind: DataContract
id: urn:datacontract:checkout:orders
name: Orders Data Contract
version: 1.0.0
status: active
domain: Checkout
dataProduct: OrderService
tenant: Global
description:
  purpose: Real-time customer checkout orders
  limitations: Excludes refunded items
  usage: Query via Athena or S3 parquet
tags:
  - orders
  - checkout
servers:
  - server: production-s3
    type: s3
    environment: production
    location: s3://datacontract-bucket/orders/*.parquet
    format: parquet
schema:
  - name: orders
    physicalName: tbl_orders
    description: Completed orders
    properties:
      - name: order_id
        logicalType: string
        physicalType: varchar(64)
        required: true
        primaryKey: true
        unique: true
        examples:
          - "ORD-001"
      - name: customer
        logicalType: object
        description: Customer details
        properties:
          - name: customer_id
            logicalType: string
            required: true
      - name: line_items
        logicalType: array
        description: Ordered items
        items:
          name: item
          logicalType: string
slaProperties:
  - property: latency
    value: 5m
    unit: minutes
quality:
  - type: rowCount
    rule: "rowCount > 0"
    severity: error
team:
  - name: Alice Smith
    username: asmith
    role: Data Owner
support:
  - channel: "#checkout-data"
    url: https://slack.com/archives/checkout-data
roles:
  - role: data-analyst
    description: Read access to orders
    access: read
`;

	const sampleLegacyYaml = `
dataContractSpecification: 0.9.2
id: urn:datacontract:checkout:legacy-orders
info:
  title: Legacy Orders Contract
  version: 1.0.0
  description: Successful customer orders in the webshop
  owner: checkout-team
models:
  orders:
    type: table
    description: Order data
    fields:
      order_id:
        type: string
        description: Primary key
        required: true
        primary: true
        example: "O-123456"
`;

	it("renders ODCS v3.2.0 contract with all sections and tabs", () => {
		render(<DataContractDefinitionWidget definition={sampleOdcsYaml} />);

		// Header elements
		expect(screen.getByText("Orders Data Contract")).toBeInTheDocument();
		expect(
			screen.getByText("ID: urn:datacontract:checkout:orders"),
		).toBeInTheDocument();
		expect(screen.getByText("Version: 1.0.0")).toBeInTheDocument();
		expect(screen.getByText("ACTIVE")).toBeInTheDocument();
		expect(screen.getByText("Domain: Checkout")).toBeInTheDocument();
		expect(screen.getByText("Data Product: OrderService")).toBeInTheDocument();

		// Structured description
		expect(
			screen.getByText("Real-time customer checkout orders"),
		).toBeInTheDocument();
		expect(screen.getByText("Excludes refunded items")).toBeInTheDocument();

		// Schema object & properties
		expect(screen.getByText("orders")).toBeInTheDocument();
		expect(screen.getByText("order_id")).toBeInTheDocument();
		expect(screen.getByText("PK")).toBeInTheDocument();
		expect(screen.getAllByText("Required").length).toBeGreaterThan(0);
		expect(screen.getByText("Unique")).toBeInTheDocument();
		expect(screen.getByText("ORD-001")).toBeInTheDocument();

		// Nested properties and items
		expect(screen.getByText("customer")).toBeInTheDocument();
		expect(screen.getByText("customer_id")).toBeInTheDocument();
		expect(screen.getByText("line_items")).toBeInTheDocument();
	});

	it("gracefully renders legacy contracts via adapter", () => {
		render(<DataContractDefinitionWidget definition={sampleLegacyYaml} />);

		expect(screen.getByText("Legacy Orders Contract")).toBeInTheDocument();
		expect(screen.getByText("orders")).toBeInTheDocument();
		expect(screen.getByText("order_id")).toBeInTheDocument();
		expect(screen.getByText("O-123456")).toBeInTheDocument();
		expect(screen.getByText("PK")).toBeInTheDocument();
	});

	it("handles invalid YAML gracefully with alert and raw code snippet without crashing", () => {
		const invalidYaml = "invalid: yaml: content: [";
		render(<DataContractDefinitionWidget definition={invalidYaml} />);

		expect(screen.getByText("Data Contract Parsing Error")).toBeInTheDocument();
		expect(screen.getByText("Raw Definition:")).toBeInTheDocument();
	});

	it("handles missing optional arrays without errors", () => {
		const minimalOdcs = `
apiVersion: v3.2.0
kind: DataContract
id: urn:datacontract:minimal
version: 1.0.0
`;
		render(<DataContractDefinitionWidget definition={minimalOdcs} />);

		expect(screen.getByText("urn:datacontract:minimal")).toBeInTheDocument();
		expect(screen.getByText("Version: 1.0.0")).toBeInTheDocument();
		expect(
			screen.getByText("No schema objects defined in this data contract."),
		).toBeInTheDocument();
	});
});
