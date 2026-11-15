import yaml from "js-yaml";
import nunjucks from "nunjucks";

// Add type declaration for window
declare global {
	interface Window {
		// biome-ignore lint/suspicious/noExplicitAny: Nunjucks precompiled templates can contain any compiled function
		nunjucksPrecompiled?: Record<string, any>;
	}
}

// Import templates - this will execute the file and set up window.nunjucksPrecompiled
try {
	require("./templates.generated.js");
} catch (error) {
	console.warn("Could not load precompiled templates:", error);
}

/*
 * Rendering with nunjucks using precompiled templates.
 * Requires "npm run precompile" to have the templates available
 */

// Initialize environment with precompiled loader lazily
let env: nunjucks.Environment | null = null;

function getOrCreateEnvironment(): nunjucks.Environment {
	if (env) {
		return env;
	}

	// Check if precompiled templates are available
	const hasPrecompiledTemplates =
		typeof window !== "undefined" &&
		window &&
		window.nunjucksPrecompiled &&
		Object.keys(window.nunjucksPrecompiled).length > 0;

	if (!hasPrecompiledTemplates) {
		throw new Error(
			'Template system not initialized. Run "yarn datacontract:update-templates" to download and precompile templates.',
		);
	}

	env = new nunjucks.Environment(
		// biome-ignore lint/suspicious/noExplicitAny: Nunjucks types don't include PrecompiledLoader
		new (nunjucks as any).PrecompiledLoader(window.nunjucksPrecompiled),
		{ autoescape: false },
	);

	env.addGlobal(
		"render_partial",
		(partialName: string, context: object | undefined) =>
			env?.render(partialName, context) || "",
	);
	// biome-ignore lint/suspicious/noExplicitAny: have no control over the type here
	env.addGlobal("range", (from: number, to: any) =>
		[...Array(to).keys()].map((i) => i + from),
	);

	return env;
}

export function renderDataContract(dataContractYaml: string): string {
	const json = yaml.load(dataContractYaml);
	if (typeof json !== "object" || json === null) {
		throw new Error("Invalid data contract definition format");
	}

	// biome-ignore lint/suspicious/noExplicitAny: template context mapping
	const raw = json as Record<string, any>;
	let templateContext = raw;

	// If ODCS contract, provide compatible structure for nunjucks templates if needed
	if (
		raw.kind === "DataContract" ||
		raw.apiVersion ||
		Array.isArray(raw.schema)
	) {
		// biome-ignore lint/suspicious/noExplicitAny: template structure
		const models: Record<string, any> = {};
		if (Array.isArray(raw.schema)) {
			for (const s of raw.schema) {
				// biome-ignore lint/suspicious/noExplicitAny: template structure
				const fields: Record<string, any> = {};
				if (Array.isArray(s.properties)) {
					for (const p of s.properties) {
						fields[p.name] = {
							type: p.logicalType || p.physicalType || "string",
							description: p.description,
							required: p.required,
							primary: p.primaryKey,
							unique: p.unique,
							example:
								Array.isArray(p.examples) && p.examples.length > 0
									? p.examples[0]
									: undefined,
							classification: p.classification,
						};
					}
				}
				models[s.name] = {
					description: s.description,
					fields,
				};
			}
		}

		templateContext = {
			...raw,
			info: {
				title: raw.name || raw.id,
				version: raw.version,
				description:
					typeof raw.description === "string"
						? raw.description
						: raw.description?.purpose,
			},
			models,
		};
	}

	const environment = getOrCreateEnvironment();
	const local_date = new Date().toLocaleDateString();
	return environment.render("datacontract.html", {
		datacontract: templateContext,
		formatted_date: local_date,
		datacontract_cli_version: "n/a",
	});
}
