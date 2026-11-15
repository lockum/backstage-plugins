import { CodeSnippet } from "@backstage/core-components";
import { Box, Typography } from "@material-ui/core";
import { Alert, AlertTitle } from "@material-ui/lab";
import { useMemo } from "react";
import type { OdcsDataContract } from "../../types/odcs";
import { parseDataContract } from "../../utils/parser";
import { DataContractView } from "../DataContractView/DataContractView";

export type DataContractDefinitionWidgetProps = {
	definition: string;
};

export const DataContractDefinitionWidget = ({
	definition,
}: DataContractDefinitionWidgetProps): JSX.Element | null => {
	const { contract, error } = useMemo<{
		contract: OdcsDataContract | null;
		error: string | null;
	}>(() => {
		try {
			if (!definition || !definition.trim()) {
				return { contract: null, error: "Empty definition provided" };
			}
			const parsed = parseDataContract(definition);
			return { contract: parsed, error: null };
		} catch (err) {
			return {
				contract: null,
				error: err instanceof Error ? err.message : String(err),
			};
		}
	}, [definition]);

	if (error || !contract) {
		return (
			<Box p={3} width="100%">
				<Alert severity="error">
					<AlertTitle>Data Contract Parsing Error</AlertTitle>
					{error || "Unable to parse data contract definition."}
				</Alert>
				<Box mt={2}>
					<Typography variant="subtitle2" gutterBottom>
						Raw Definition:
					</Typography>
					<CodeSnippet
						language="yaml"
						text={definition || "# No definition content"}
					/>
				</Box>
			</Box>
		);
	}

	return <DataContractView contract={contract} rawDefinition={definition} />;
};
