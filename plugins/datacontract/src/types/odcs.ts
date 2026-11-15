/**
 * Open Data Contract Standard (ODCS) v3.2.0 TypeScript Definitions
 * Supporting v3.2.0, other v3.x versions, and legacy Data Contract compatibility.
 */

export interface OdcsRelationship {
	type?: string;
	from?: string;
	to?: string;
	customProperties?:
		| Record<string, unknown>
		| Array<{ property: string; value: unknown }>;
}

export interface OdcsQualityRule {
	type?: string;
	description?: string;
	dimension?: string;
	rule?: string;
	severity?: string;
	engine?: string;
	implementation?: string;
	schedule?: string;
	scheduler?: string;
	mustBe?: unknown;
	mustBeBetween?: unknown;
	[key: string]: unknown;
}

export interface OdcsProperty {
	name: string;
	businessName?: string;
	logicalType?: string;
	logicalTypeOptions?: Record<string, unknown>;
	physicalType?: string;
	description?: string;
	required?: boolean;
	primaryKey?: boolean;
	primaryKeyPosition?: number;
	unique?: boolean;
	examples?: unknown[];
	classification?: string;
	encryptedName?: string;
	partitioned?: boolean;
	partitionKeyPosition?: number;
	criticalDataElement?: boolean;
	transformSourceObjects?: string[];
	transformLogic?: string;
	quality?: OdcsQualityRule[];
	relationships?: OdcsRelationship[];
	items?: OdcsProperty;
	properties?: OdcsProperty[];
}

export interface OdcsSchemaObject {
	name: string;
	physicalName?: string;
	logicalType?: string;
	physicalType?: string;
	description?: string;
	businessName?: string;
	authoritativeDefinitions?: Array<{ url: string; type?: string }>;
	tags?: string[];
	quality?: OdcsQualityRule[];
	relationships?: OdcsRelationship[];
	properties?: OdcsProperty[];
}

export interface OdcsServer {
	server: string;
	type?: string;
	description?: string;
	environment?: string;
	host?: string;
	port?: number;
	database?: string;
	schema?: string;
	location?: string;
	format?: string;
	[key: string]: unknown;
}

export interface OdcsSlaProperty {
	property: string;
	value?: unknown;
	valueExt?: unknown;
	unit?: string;
	element?: string;
	driver?: string;
}

export interface OdcsTeamMember {
	username?: string;
	name?: string;
	role?: string;
	dateIn?: string;
	dateOut?: string;
	replacedByUsername?: string;
}

export interface OdcsSupportChannel {
	channel?: string;
	url?: string;
	description?: string;
	tool?: string;
	scope?: string;
}

export interface OdcsRole {
	role: string;
	description?: string;
	access?: string;
	firstLevelApprovers?: unknown;
	secondLevelApprovers?: unknown;
}

export interface OdcsPrice {
	amount?: number;
	currency?: string;
	unit?: string;
}

export interface OdcsStructuredDescription {
	purpose?: string;
	limitations?: string;
	usage?: string;
	[key: string]: unknown;
}

export interface OdcsDataContract {
	apiVersion?: string;
	kind?: string;
	id: string;
	name?: string;
	version: string;
	status?: string;
	domain?: string;
	dataProduct?: string;
	tenant?: string;
	description?: string | OdcsStructuredDescription;
	tags?: string[];
	team?: OdcsTeamMember[];
	support?: OdcsSupportChannel[];
	roles?: OdcsRole[];
	price?: OdcsPrice;
	servers?: OdcsServer[];
	slaProperties?: OdcsSlaProperty[];
	quality?: OdcsQualityRule[];
	schema?: OdcsSchemaObject[];
	customProperties?: Array<{ property: string; value: unknown }>;
	authoritativeDefinitions?: Array<{ url: string; type?: string }>;
}
