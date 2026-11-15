/** biome-ignore-all lint/suspicious/noExplicitAny: only tests */
import type { Entity } from "@backstage/catalog-model";
import { DataContractProcessor } from "./DataContractApiEntityProcessor";

describe("DataContractProcessor", () => {
	let processor: DataContractProcessor;
	const mockLogger = {
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		debug: jest.fn(),
	} as any;

	beforeEach(() => {
		processor = new DataContractProcessor(mockLogger);
	});

	describe("getProcessorName", () => {
		it("should return the correct processor name", () => {
			expect(processor.getProcessorName()).toBe("DataContractProcessor");
		});
	});

	describe("validateEntityKind", () => {
		it("should validate a correct legacy datacontract definition", async () => {
			const entity: Entity = {
				apiVersion: "backstage.io/v1alpha1",
				kind: "API",
				metadata: { name: "test-api" },
				spec: {
					type: "datacontract",
					definition: `
            dataContractSpecification: "0.9.0"
            id: test-contract
            info:
              title: Test Data Contract
              version: "1.0.0"
              description: A test data contract
              owner: Test Team
              contact:
                name: Test Team
                email: test@example.com
            servers:
              prod:
                type: bigquery
                project: test-project
                dataset: test_dataset
          `,
				},
			};

			const result = await processor.validateEntityKind?.(entity);
			expect(result).toBe(true);
		});

		it("should validate a valid ODCS v3.2.0 contract", async () => {
			const entity: Entity = {
				apiVersion: "backstage.io/v1alpha1",
				kind: "API",
				metadata: { name: "orders-odcs-api" },
				spec: {
					type: "datacontract",
					definition: `
            apiVersion: v3.2.0
            kind: DataContract
            id: urn:datacontract:checkout:orders
            name: Orders Data Contract
            version: 1.0.0
            status: active
            domain: Checkout
            dataProduct: OrderService
            description:
              purpose: Real-time checkout orders data
              limitations: Only includes completed orders
            servers:
              - server: production
                type: s3
                environment: production
                location: s3://datacontract-orders-bucket/data/orders/*.parquet
                format: parquet
            schema:
              - name: orders
                physicalName: tbl_orders
                logicalType: object
                description: Main orders table
                properties:
                  - name: order_id
                    logicalType: string
                    physicalType: varchar(64)
                    primaryKey: true
                    required: true
                    examples:
                      - "ORD-12345"
                  - name: order_total
                    logicalType: number
                    physicalType: decimal(10,2)
                    required: true
            team:
              - username: jdoe
                name: John Doe
                role: Owner
            support:
              - channel: "#checkout-data"
                tool: slack
                url: https://slack.com/archives/checkout-data
          `,
				},
			};

			const result = await processor.validateEntityKind?.(entity);
			expect(result).toBe(true);
		});

		it("should validate ODCS v3.2.0 property with only physicalType (Bitol #322 upstream fix)", async () => {
			const entity: Entity = {
				apiVersion: "backstage.io/v1alpha1",
				kind: "API",
				metadata: { name: "physical-only-api" },
				spec: {
					type: "datacontract",
					definition: `
            apiVersion: v3.2.0
            kind: DataContract
            id: urn:datacontract:test:physical-only
            name: Physical Only Contract
            version: 1.0.0
            status: active
            schema:
              - name: raw_events
                properties:
                  - name: raw_payload
                    physicalType: jsonb
                    description: Column with only physicalType specified
          `,
				},
			};

			const result = await processor.validateEntityKind?.(entity);
			expect(result).toBe(true);
		});

		it("should return false for non-API entities", async () => {
			const entity: Entity = {
				apiVersion: "backstage.io/v1alpha1",
				kind: "Component",
				metadata: { name: "test-component" },
				spec: {},
			};

			const result = await processor.validateEntityKind?.(entity);
			expect(result).toBe(false);
		});

		it("should return false for non-datacontract API entities", async () => {
			const entity: Entity = {
				apiVersion: "backstage.io/v1alpha1",
				kind: "API",
				metadata: { name: "test-api" },
				spec: {
					type: "openapi",
					definition: "",
				},
			};

			const result = await processor.validateEntityKind?.(entity);
			expect(result).toBe(false);
		});

		it("should throw error for unknown definition format", async () => {
			const entity: Entity = {
				apiVersion: "backstage.io/v1alpha1",
				kind: "API",
				metadata: { name: "test-api" },
				spec: {
					type: "datacontract",
					definition: `
            openapi: 3.0.0
            info:
              title: Invalid API
          `,
				},
			};

			await expect(processor.validateEntityKind?.(entity)).rejects.toThrow(
				"DataContract validation failed",
			);
		});

		it("should throw error for invalid ODCS contract failing schema validation", async () => {
			const entity: Entity = {
				apiVersion: "backstage.io/v1alpha1",
				kind: "API",
				metadata: { name: "test-invalid-odcs" },
				spec: {
					type: "datacontract",
					definition: `
            apiVersion: v3.2.0
            kind: DataContract
            # Missing required id and version
            name: Incomplete Contract
          `,
				},
			};

			await expect(processor.validateEntityKind?.(entity)).rejects.toThrow(
				"DataContract validation failed",
			);
		});

		it("should handle undefined definition gracefully", async () => {
			const entity: Entity = {
				apiVersion: "backstage.io/v1alpha1",
				kind: "API",
				metadata: { name: "test-api" },
				spec: {
					type: "datacontract",
				},
			};

			const result = await processor.validateEntityKind?.(entity);
			expect(result).toBe(true);
		});

		it("should validate S3 URIs with wildcards and template variables", async () => {
			const entity: Entity = {
				apiVersion: "backstage.io/v1alpha1",
				kind: "API",
				metadata: { name: "test-s3-api" },
				spec: {
					type: "datacontract",
					definition: `
            dataContractSpecification: "0.9.0"
            id: test-s3-contract
            info:
              title: Test S3 Data Contract
              version: "1.0.0"
              description: A test data contract with S3 location
              owner: Test Team
            servers:
              prod:
                type: s3
                location: "s3://datacontract-example-orders-latest/data/{model}/*.json"
                format: json
          `,
				},
			};

			const result = await processor.validateEntityKind?.(entity);
			expect(result).toBe(true);
		});

		it("should validate various URI patterns with wildcards and template variables", async () => {
			const testCases = [
				"s3://bucket-name/path/file.json",
				"s3://bucket-name/path/*.json",
				"s3://bucket-name/data/{model}/file.parquet",
				"s3://datacontract-example-orders-latest/data/{model}/*.json",
				"s3://my-bucket/folder/{year}/{month}/*.csv",
				"gs://bucket-name/path/*.json",
				"gs://my-bucket/data/{model}/*.parquet",
				"hdfs://namenode:9000/path/{model}/*.json",
				"hdfs://cluster/data/*.parquet",
				"file:///path/to/data/{model}/*.json",
				"file:///local/data/*.csv",
			];

			for (const location of testCases) {
				const entity: Entity = {
					apiVersion: "backstage.io/v1alpha1",
					kind: "API",
					metadata: { name: "test-uri-api" },
					spec: {
						type: "datacontract",
						definition: `
              dataContractSpecification: "0.9.0"
              id: test-uri-contract
              info:
                title: Test URI Data Contract
                version: "1.0.0"
                description: A test data contract with URI location
                owner: Test Team
              servers:
                prod:
                  type: s3
                  location: "${location}"
                  format: json
            `,
					},
				};

				const result = await processor.validateEntityKind?.(entity);
				expect(result).toBe(true);
			}
		});

		it("should validate Azure ABFSS URIs with wildcards and template variables", async () => {
			const testCases = [
				"abfss://container@account.dfs.core.windows.net/path/{model}/*.json",
				"abfss://my-container@storage.dfs.core.windows.net/data/*.csv",
			];

			for (const location of testCases) {
				const entity: Entity = {
					apiVersion: "backstage.io/v1alpha1",
					kind: "API",
					metadata: { name: "test-azure-api" },
					spec: {
						type: "datacontract",
						definition: `
              dataContractSpecification: "0.9.0"
              id: test-azure-contract
              info:
                title: Test Azure Data Contract
                version: "1.0.0"
                description: A test data contract with Azure location
                owner: Test Team
              servers:
                prod:
                  type: azure
                  location: "${location}"
                  format: json
            `,
					},
				};

				const result = await processor.validateEntityKind?.(entity);
				expect(result).toBe(true);
			}
		});
	});

	describe("postProcessEntity", () => {
		it("enriches entity metadata from ODCS contract", async () => {
			const entity: Entity = {
				apiVersion: "backstage.io/v1alpha1",
				kind: "API",
				metadata: { name: "enriched-api" },
				spec: {
					type: "datacontract",
					definition: `
            apiVersion: v3.2.0
            kind: DataContract
            id: urn:datacontract:checkout:orders
            version: 1.2.0
            domain: Checkout
            dataProduct: OrderAnalytics
            tags:
              - checkout
              - pii-compliant
            support:
              - channel: "#checkout-support"
                url: https://slack.com/archives/checkout-support
          `,
				},
			};

			const mockEmit = jest.fn();
			const mockLocation = { type: "url", target: "http://example.com" };
			const mockCache = {} as any;

			const result = await processor.postProcessEntity?.(
				entity,
				mockLocation,
				mockEmit,
				mockCache,
			);

			expect(result?.metadata.annotations?.["datacontract/domain"]).toBe(
				"Checkout",
			);
			expect(result?.metadata.annotations?.["datacontract/data-product"]).toBe(
				"OrderAnalytics",
			);
			expect(result?.metadata.annotations?.["datacontract/version"]).toBe(
				"1.2.0",
			);
			expect(result?.metadata.tags).toContain("checkout");
			expect(result?.metadata.tags).toContain("pii-compliant");
			expect(result?.metadata.links).toEqual([
				{
					url: "https://slack.com/archives/checkout-support",
					title: "#checkout-support",
					icon: "help",
				},
			]);
			expect(mockEmit).not.toHaveBeenCalled();
		});

		it("emits error when contract is invalid", async () => {
			const entity: Entity = {
				apiVersion: "backstage.io/v1alpha1",
				kind: "API",
				metadata: { name: "invalid-api" },
				spec: {
					type: "datacontract",
					definition: `
            apiVersion: v3.2.0
            kind: DataContract
            # Missing id and version
          `,
				},
			};

			const mockEmit = jest.fn();
			const mockLocation = { type: "url", target: "http://example.com" };
			const mockCache = {} as any;

			await processor.postProcessEntity?.(
				entity,
				mockLocation,
				mockEmit,
				mockCache,
			);

			expect(mockEmit).toHaveBeenCalledTimes(1);
			expect(mockEmit.mock.calls[0][0].error.message).toContain(
				"DataContract validation failed",
			);
		});
	});
});
