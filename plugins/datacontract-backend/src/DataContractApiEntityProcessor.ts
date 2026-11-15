import type { LoggerService } from "@backstage/backend-plugin-api";
import type { Entity } from "@backstage/catalog-model";
import type { LocationSpec } from "@backstage/plugin-catalog-common";
import {
	type CatalogProcessor,
	type CatalogProcessorCache,
	type CatalogProcessorEmit,
	processingResult,
} from "@backstage/plugin-catalog-node";
import Ajv from "ajv";
import Ajv2019 from "ajv/dist/2019";
import addFormats from "ajv-formats";
import yaml from "js-yaml";
import legacySchema from "../schemas/datacontract.schema.json";
import odcsSchema from "../schemas/odcs-json-schema-v3.2.0.json";

// Add custom URI format that allows URIs with wildcards and template variables
const uriValidator = (uri: string): boolean => {
	// Allow standard URIs
	try {
		new URL(uri);
		return true;
	} catch {
		// If standard URL parsing fails, check for URIs with patterns
		// Support various schemes like s3://, gs://, abfss://, hdfs://, file://, etc.
		const uriPattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[a-zA-Z0-9\-._@]+\/.*$/;
		const hasTemplateVariables = /\{[^}]+\}/.test(uri);
		const hasWildcards = /\*/.test(uri);

		// Allow URIs with template variables and wildcards
		if (uriPattern.test(uri) && (hasTemplateVariables || hasWildcards)) {
			return true;
		}

		// Try to validate by replacing template variables and wildcards with valid characters
		const normalizedUri = uri
			.replace(/\{[^}]+\}/g, "placeholder") // Replace {model} with placeholder
			.replace(/\*/g, "wildcard"); // Replace * with wildcard

		try {
			new URL(normalizedUri);
			return true;
		} catch {
			return false;
		}
	}
};

// Legacy Schema Validator (Draft-07)
const ajvLegacy = new Ajv({
	allErrors: true,
	strict: "log",
	allowUnionTypes: true,
	validateFormats: true,
	strictSchema: false,
	strictTypes: false,
});
addFormats(ajvLegacy);
ajvLegacy.addFormat("uri", { type: "string", validate: uriValidator });
const validateLegacy = ajvLegacy.compile(legacySchema);

// ODCS v3.2.0 / v3.x Validator (Draft 2019-09)
const ajvOdcs = new Ajv2019({
	allErrors: true,
	strict: false,
	allowUnionTypes: true,
	validateFormats: true,
	strictSchema: false,
	strictTypes: false,
});
addFormats(ajvOdcs);
ajvOdcs.addFormat("uri", { type: "string", validate: uriValidator });
const validateOdcs = ajvOdcs.compile(odcsSchema);

function isOdcsContract(definition: unknown): boolean {
	if (!definition || typeof definition !== "object") {
		return false;
	}
	const def = definition as Record<string, unknown>;
	if (def.kind === "DataContract") {
		return true;
	}
	if (
		typeof def.apiVersion === "string" &&
		/^v?3(\.\d+)*$/i.test(def.apiVersion)
	) {
		return true;
	}
	return false;
}

function isLegacyContract(definition: unknown): boolean {
	if (!definition || typeof definition !== "object") {
		return false;
	}
	const def = definition as Record<string, unknown>;
	return Boolean(def.dataContractSpecification);
}

function formatValidationErrors(
	errors: Array<{ instancePath?: string; message?: string }> | null | undefined,
): string {
	if (!errors || errors.length === 0) {
		return "Unknown validation error";
	}
	return errors
		.map((error) => `${error.instancePath || "root"}: ${error.message}`)
		.join("; ");
}

function sanitizeTag(rawTag: string): string | null {
	if (typeof rawTag !== "string") return null;
	const sanitized = rawTag
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9+#/]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 63);
	return sanitized.length > 0 ? sanitized : null;
}

/**
 * Catalog processor that loads datacontract definitions from $file references
 * in API entities with type `datacontract`. Supports both ODCS v3.2.0 (v3.x)
 * and legacy Data Contract specifications.
 */
export class DataContractProcessor implements CatalogProcessor {
	logger: LoggerService;

	constructor(logger: LoggerService) {
		this.logger = logger;
		this.logger.info("DataContractProcessor initialized");
	}

	getProcessorName(): string {
		return "DataContractProcessor";
	}

	private validateContract(definition: unknown): {
		valid: boolean;
		format: "odcs" | "legacy" | "unknown";
		errors?: string;
	} {
		if (isOdcsContract(definition)) {
			const valid = validateOdcs(definition);
			return {
				valid: Boolean(valid),
				format: "odcs",
				errors: valid ? undefined : formatValidationErrors(validateOdcs.errors),
			};
		}

		if (isLegacyContract(definition)) {
			const valid = validateLegacy(definition);
			return {
				valid: Boolean(valid),
				format: "legacy",
				errors: valid
					? undefined
					: formatValidationErrors(validateLegacy.errors),
			};
		}

		return {
			valid: false,
			format: "unknown",
			errors:
				"Definition is neither a recognized Open Data Contract Standard (ODCS) contract (expected 'kind: DataContract' and 'apiVersion: v3.2.0') nor a legacy Data Contract specification (expected 'dataContractSpecification').",
		};
	}

	async validateEntityKind?(entity: Entity): Promise<boolean> {
		if (entity.kind !== "API" || entity.spec?.type !== "datacontract") {
			this.logger.info(
				`Validating DataContract for entity ${entity.metadata.name}: skipped`,
			);
			return false;
		}

		this.logger.info(
			`Validating DataContract for entity ${entity.metadata.name}`,
		);

		try {
			const definition = this.getDefinitionYaml(entity);
			if (definition) {
				const result = this.validateContract(definition);
				if (!result.valid) {
					throw new Error(`DataContract validation failed: ${result.errors}`);
				}
			}
		} catch (error) {
			if (error instanceof Error) {
				throw error;
			}
			throw new Error(`DataContract validation failed: ${String(error)}`);
		}

		return true;
	}

	private getDefinitionYaml(entity: Entity): unknown {
		const definition = entity.spec?.definition;
		if (definition && typeof definition === "string") {
			const parsed = yaml.load(definition);
			if (typeof parsed !== "object" || parsed === null) {
				throw new Error(
					`Invalid DataContract definition for entity ${entity.metadata.name}: not a valid YAML object`,
				);
			}
			return parsed;
		}
		return undefined;
	}

	postProcessEntity?(
		entity: Entity,
		location: LocationSpec,
		emit: CatalogProcessorEmit,
		_cache: CatalogProcessorCache,
	): Promise<Entity> {
		// Only process datacontract API entities
		if (entity.kind !== "API" || entity.spec?.type !== "datacontract") {
			return Promise.resolve(entity);
		}

		let processedEntity = entity;

		try {
			const definition = this.getDefinitionYaml(entity);
			if (definition) {
				const result = this.validateContract(definition);
				this.logger.info(
					`Validating DataContract (${result.format}) for entity ${entity.metadata.name}: ${result.valid}`,
				);

				if (!result.valid) {
					this.logger.warn(
						`DataContract validation failed for entity ${entity.metadata.name}: ${result.errors}`,
					);

					// Emit validation errors so they appear in the Backstage UI
					emit(
						processingResult.generalError(
							location,
							`DataContract validation failed: ${result.errors}`,
						),
					);
				} else if (result.format === "odcs") {
					// Enrich entity metadata with ODCS details
					const def = definition as Record<string, unknown>;
					const annotations: Record<string, string> = {
						...processedEntity.metadata.annotations,
					};
					let modified = false;

					if (typeof def.domain === "string" && def.domain.trim()) {
						annotations["datacontract/domain"] = def.domain;
						modified = true;
					}
					if (typeof def.dataProduct === "string" && def.dataProduct.trim()) {
						annotations["datacontract/data-product"] = def.dataProduct;
						modified = true;
					}
					if (typeof def.version === "string" && def.version.trim()) {
						annotations["datacontract/version"] = def.version;
						modified = true;
					}

					const existingTags = new Set(processedEntity.metadata.tags || []);
					if (Array.isArray(def.tags)) {
						for (const tag of def.tags) {
							const cleanTag = sanitizeTag(tag);
							if (cleanTag) {
								existingTags.add(cleanTag);
								modified = true;
							}
						}
					}

					const existingLinks = [...(processedEntity.metadata.links || [])];
					if (Array.isArray(def.support)) {
						for (const item of def.support) {
							if (item && typeof item === "object") {
								const sup = item as Record<string, unknown>;
								if (typeof sup.url === "string" && sup.url.trim()) {
									const url = sup.url.trim();
									const alreadyExists = existingLinks.some(
										(l) => l.url === url,
									);
									if (!alreadyExists) {
										existingLinks.push({
											url,
											title:
												typeof sup.channel === "string"
													? sup.channel
													: typeof sup.tool === "string"
														? sup.tool
														: typeof sup.description === "string"
															? sup.description
															: "Support Channel",
											icon: "help",
										});
										modified = true;
									}
								}
							}
						}
					}

					if (modified) {
						processedEntity = {
							...processedEntity,
							metadata: {
								...processedEntity.metadata,
								annotations:
									Object.keys(annotations).length > 0
										? annotations
										: processedEntity.metadata.annotations,
								tags:
									existingTags.size > 0
										? Array.from(existingTags)
										: processedEntity.metadata.tags,
								links:
									existingLinks.length > 0
										? existingLinks
										: processedEntity.metadata.links,
							},
						};
					}
				}
			}
		} catch (error) {
			this.logger.error(
				`Error processing DataContract for entity ${entity.metadata.name}: ${error}`,
			);

			// Emit processing error
			emit(
				processingResult.generalError(
					location,
					`DataContract processing error: ${
						error instanceof Error ? error.message : String(error)
					}`,
				),
			);
		}

		return Promise.resolve(processedEntity);
	}
}
