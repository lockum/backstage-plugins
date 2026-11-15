import yaml from "js-yaml";
import type {
	OdcsDataContract,
	OdcsProperty,
	OdcsQualityRule,
	OdcsSchemaObject,
	OdcsServer,
	OdcsSlaProperty,
	OdcsSupportChannel,
	OdcsTeamMember,
} from "../types/odcs";

/**
 * Parses and normalizes a YAML string or object into an ODCS v3.2.0 compliant data structure.
 * Supports native ODCS v3.2.0/v3.x contracts as well as legacy dataContractSpecification contracts.
 */
export function parseDataContract(
	rawInput: string | Record<string, unknown>,
): OdcsDataContract {
	if (!rawInput) {
		throw new Error("Data contract definition is empty or undefined");
	}

	let parsed: unknown;
	if (typeof rawInput === "string") {
		try {
			parsed = yaml.load(rawInput);
		} catch (error) {
			throw new Error(
				`Failed to parse YAML definition: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	} else {
		parsed = rawInput;
	}

	if (typeof parsed !== "object" || parsed === null) {
		throw new Error("Invalid data contract definition: expected an object");
	}

	const data = parsed as Record<string, unknown>;

	// Check if this is an ODCS contract
	const isOdcs =
		data.kind === "DataContract" ||
		(typeof data.apiVersion === "string" &&
			/^v?3(\.\d+)*$/i.test(data.apiVersion)) ||
		Array.isArray(data.schema);

	if (isOdcs) {
		return normalizeOdcsContract(data);
	}

	// Check if this is a legacy contract
	const isLegacy =
		Boolean(data.dataContractSpecification) ||
		Boolean(data.models) ||
		Boolean(data.info);

	if (isLegacy) {
		return adaptLegacyContract(data);
	}

	// If neither, try normalizing as a generic/partial ODCS contract
	return normalizeOdcsContract(data);
}

function normalizeOdcsContract(
	data: Record<string, unknown>,
): OdcsDataContract {
	const id = String(data.id || data.name || "unnamed-contract");
	const name = typeof data.name === "string" ? data.name : id;
	const version = String(data.version || "1.0.0");
	const status = typeof data.status === "string" ? data.status : "active";

	const schema: OdcsSchemaObject[] = Array.isArray(data.schema)
		? data.schema.map((item) => normalizeSchemaObject(item))
		: [];

	const servers: OdcsServer[] = Array.isArray(data.servers)
		? data.servers.map((s) => ({
				server: String(s.server || s.name || s.type || "server"),
				...s,
			}))
		: [];

	const team: OdcsTeamMember[] = Array.isArray(data.team)
		? data.team.map((t) => ({ ...t }))
		: [];

	const support: OdcsSupportChannel[] = Array.isArray(data.support)
		? data.support.map((s) => ({ ...s }))
		: [];

	const slaProperties: OdcsSlaProperty[] = Array.isArray(data.slaProperties)
		? data.slaProperties.map((sla) => ({ ...sla }))
		: [];

	const quality: OdcsQualityRule[] = Array.isArray(data.quality)
		? data.quality.map((q) => ({ ...q }))
		: [];

	return {
		apiVersion:
			typeof data.apiVersion === "string" ? data.apiVersion : "v3.2.0",
		kind: typeof data.kind === "string" ? data.kind : "DataContract",
		id,
		name,
		version,
		status,
		domain: typeof data.domain === "string" ? data.domain : undefined,
		dataProduct:
			typeof data.dataProduct === "string" ? data.dataProduct : undefined,
		tenant: typeof data.tenant === "string" ? data.tenant : undefined,
		description: data.description as OdcsDataContract["description"],
		tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
		schema,
		servers,
		team,
		support,
		slaProperties,
		quality,
		roles: Array.isArray(data.roles) ? data.roles : [],
		price:
			typeof data.price === "object" && data.price !== null
				? (data.price as OdcsDataContract["price"])
				: undefined,
		customProperties: Array.isArray(data.customProperties)
			? data.customProperties
			: undefined,
		authoritativeDefinitions: Array.isArray(data.authoritativeDefinitions)
			? data.authoritativeDefinitions
			: undefined,
	};
}

function normalizeSchemaObject(raw: unknown): OdcsSchemaObject {
	if (typeof raw !== "object" || raw === null) {
		return { name: "unnamed-schema" };
	}
	const item = raw as Record<string, unknown>;
	const name = String(item.name || "unnamed-schema");

	const properties: OdcsProperty[] = Array.isArray(item.properties)
		? item.properties.map((p) => normalizeProperty(p))
		: [];

	return {
		name,
		physicalName:
			typeof item.physicalName === "string" ? item.physicalName : undefined,
		logicalType:
			typeof item.logicalType === "string" ? item.logicalType : undefined,
		physicalType:
			typeof item.physicalType === "string" ? item.physicalType : undefined,
		description:
			typeof item.description === "string" ? item.description : undefined,
		businessName:
			typeof item.businessName === "string" ? item.businessName : undefined,
		authoritativeDefinitions: Array.isArray(item.authoritativeDefinitions)
			? item.authoritativeDefinitions
			: undefined,
		tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
		quality: Array.isArray(item.quality) ? item.quality : [],
		relationships: Array.isArray(item.relationships) ? item.relationships : [],
		properties,
	};
}

function normalizeProperty(raw: unknown): OdcsProperty {
	if (typeof raw !== "object" || raw === null) {
		return { name: "unnamed-property" };
	}
	const item = raw as Record<string, unknown>;
	const name = String(item.name || "unnamed-property");

	const prop: OdcsProperty = {
		name,
		businessName:
			typeof item.businessName === "string" ? item.businessName : undefined,
		logicalType:
			typeof item.logicalType === "string" ? item.logicalType : undefined,
		logicalTypeOptions:
			typeof item.logicalTypeOptions === "object" &&
			item.logicalTypeOptions !== null
				? (item.logicalTypeOptions as Record<string, unknown>)
				: undefined,
		physicalType:
			typeof item.physicalType === "string" ? item.physicalType : undefined,
		description:
			typeof item.description === "string" ? item.description : undefined,
		required: Boolean(item.required),
		primaryKey: Boolean(item.primaryKey || item.primary),
		primaryKeyPosition:
			typeof item.primaryKeyPosition === "number"
				? item.primaryKeyPosition
				: undefined,
		unique: Boolean(item.unique),
		examples: Array.isArray(item.examples)
			? item.examples
			: item.example !== undefined
				? [item.example]
				: [],
		classification:
			typeof item.classification === "string" ? item.classification : undefined,
		encryptedName:
			typeof item.encryptedName === "string" ? item.encryptedName : undefined,
		partitioned: Boolean(item.partitioned),
		partitionKeyPosition:
			typeof item.partitionKeyPosition === "number"
				? item.partitionKeyPosition
				: undefined,
		criticalDataElement: Boolean(item.criticalDataElement),
		transformSourceObjects: Array.isArray(item.transformSourceObjects)
			? item.transformSourceObjects.map(String)
			: undefined,
		transformLogic:
			typeof item.transformLogic === "string" ? item.transformLogic : undefined,
		quality: Array.isArray(item.quality) ? item.quality : [],
		relationships: Array.isArray(item.relationships) ? item.relationships : [],
	};

	if (Array.isArray(item.properties)) {
		prop.properties = item.properties.map((p) => normalizeProperty(p));
	}
	if (item.items && typeof item.items === "object") {
		prop.items = normalizeProperty(item.items);
	}

	return prop;
}

function adaptLegacyContract(data: Record<string, unknown>): OdcsDataContract {
	const info =
		typeof data.info === "object" && data.info !== null
			? (data.info as Record<string, unknown>)
			: {};

	const id = String(data.id || info.title || "legacy-contract");
	const name = String(info.title || id);
	const version = String(info.version || "1.0.0");
	const description =
		typeof info.description === "string" ? info.description : undefined;

	// Map models to schema
	const schema: OdcsSchemaObject[] = [];
	if (typeof data.models === "object" && data.models !== null) {
		const models = data.models as Record<string, unknown>;
		for (const [modelName, modelObj] of Object.entries(models)) {
			if (typeof modelObj === "object" && modelObj !== null) {
				const m = modelObj as Record<string, unknown>;
				const properties: OdcsProperty[] = [];
				if (typeof m.fields === "object" && m.fields !== null) {
					const fields = m.fields as Record<string, unknown>;
					for (const [fieldName, fieldObj] of Object.entries(fields)) {
						if (typeof fieldObj === "object" && fieldObj !== null) {
							const f = fieldObj as Record<string, unknown>;
							properties.push({
								name: fieldName,
								logicalType: typeof f.type === "string" ? f.type : undefined,
								physicalType:
									typeof f.physicalType === "string"
										? f.physicalType
										: undefined,
								description:
									typeof f.description === "string" ? f.description : undefined,
								required: Boolean(f.required),
								primaryKey: Boolean(f.primary || f.primaryKey),
								unique: Boolean(f.unique),
								classification:
									typeof f.classification === "string"
										? f.classification
										: undefined,
								examples: Array.isArray(f.examples)
									? f.examples
									: f.example !== undefined
										? [f.example]
										: [],
							});
						}
					}
				}

				schema.push({
					name: modelName,
					physicalName:
						typeof m.namespace === "string" ? m.namespace : modelName,
					description:
						typeof m.description === "string" ? m.description : undefined,
					properties,
				});
			}
		}
	}

	// Map servers
	const servers: OdcsServer[] = [];
	if (typeof data.servers === "object" && data.servers !== null) {
		if (Array.isArray(data.servers)) {
			for (const s of data.servers) {
				if (typeof s === "object" && s !== null) {
					servers.push({
						server: String(s.server || s.name || s.type || "server"),
						...s,
					});
				}
			}
		} else {
			for (const [serverName, serverObj] of Object.entries(
				data.servers as Record<string, unknown>,
			)) {
				if (typeof serverObj === "object" && serverObj !== null) {
					servers.push({
						server: serverName,
						...(serverObj as Record<string, unknown>),
					});
				}
			}
		}
	}

	// Map team
	const team: OdcsTeamMember[] = [];
	if (typeof info.owner === "string" && info.owner.trim()) {
		team.push({ name: info.owner.trim(), role: "Owner" });
	}
	if (typeof info.contact === "object" && info.contact !== null) {
		const contact = info.contact as Record<string, unknown>;
		team.push({
			name: typeof contact.name === "string" ? contact.name : undefined,
			username: typeof contact.email === "string" ? contact.email : undefined,
			role: "Contact",
		});
	}

	// Map support
	const support: OdcsSupportChannel[] = [];
	if (typeof info.contact === "object" && info.contact !== null) {
		const contact = info.contact as Record<string, unknown>;
		if (typeof contact.url === "string") {
			support.push({
				channel: "Support",
				url: contact.url,
				description:
					typeof contact.name === "string" ? contact.name : undefined,
			});
		}
	}

	// Map SLAs
	const slaProperties: OdcsSlaProperty[] = [];
	if (typeof data.servicelevels === "object" && data.servicelevels !== null) {
		const slas = data.servicelevels as Record<string, unknown>;
		for (const [key, val] of Object.entries(slas)) {
			slaProperties.push({
				property: key,
				value: typeof val === "object" ? JSON.stringify(val) : String(val),
			});
		}
	}

	// Map quality
	const quality: OdcsQualityRule[] = [];
	if (Array.isArray(data.quality)) {
		quality.push(...data.quality);
	} else if (typeof data.quality === "object" && data.quality !== null) {
		const q = data.quality as Record<string, unknown>;
		quality.push({
			type: typeof q.type === "string" ? q.type : undefined,
			description:
				typeof q.specification === "object"
					? JSON.stringify(q.specification)
					: typeof q.description === "string"
						? q.description
						: undefined,
		});
	}

	return {
		apiVersion: "v3.2.0 (adapted from legacy)",
		kind: "DataContract",
		id,
		name,
		version,
		status: "active",
		description,
		schema,
		servers,
		team,
		support,
		slaProperties,
		quality,
		roles: [],
		tags: [],
	};
}
