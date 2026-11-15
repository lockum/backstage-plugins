import { CodeSnippet, InfoCard } from "@backstage/core-components";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Chip,
	Grid,
	makeStyles,
	Paper,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tabs,
	Tooltip,
	Typography,
} from "@material-ui/core";
import {
	Assignment as AssignmentIcon,
	Code as CodeIcon,
	ExpandMore as ExpandMoreIcon,
	Link as LinkIcon,
	People as PeopleIcon,
	Security as SecurityIcon,
	Storage as StorageIcon,
	TableChart as TableChartIcon,
	VerifiedUser as VerifiedIcon,
} from "@material-ui/icons";
import { Alert } from "@material-ui/lab";
import React, { useState } from "react";
import type {
	OdcsDataContract,
	OdcsProperty,
	OdcsStructuredDescription,
} from "../../types/odcs";

const useStyles = makeStyles((theme) => ({
	root: {
		padding: theme.spacing(2),
		width: "100%",
	},
	headerCard: {
		marginBottom: theme.spacing(3),
	},
	chip: {
		marginRight: theme.spacing(1),
		marginBottom: theme.spacing(1),
	},
	badgeActive: {
		backgroundColor: "#4caf50",
		color: "#fff",
	},
	badgeDraft: {
		backgroundColor: "#ff9800",
		color: "#fff",
	},
	badgeDeprecated: {
		backgroundColor: "#f44336",
		color: "#fff",
	},
	sectionTitle: {
		marginTop: theme.spacing(2),
		marginBottom: theme.spacing(1),
		fontWeight: 600,
	},
	tabPanel: {
		paddingTop: theme.spacing(2),
	},
	table: {
		minWidth: 650,
	},
	nestedPropertyRow: {
		backgroundColor:
			theme.palette.type === "dark"
				? "rgba(255, 255, 255, 0.04)"
				: "rgba(0, 0, 0, 0.02)",
	},
	constraintChip: {
		marginRight: 4,
		marginBottom: 4,
		fontSize: "0.75rem",
		height: 22,
	},
	pkChip: {
		backgroundColor: "#e3f2fd",
		color: "#1565c0",
		fontWeight: 600,
	},
	requiredChip: {
		backgroundColor: "#ffebee",
		color: "#c62828",
		fontWeight: 600,
	},
	uniqueChip: {
		backgroundColor: "#f3e5f5",
		color: "#6a1b9a",
	},
	cdeChip: {
		backgroundColor: "#fff3e0",
		color: "#e65100",
		fontWeight: 600,
	},
	partitionChip: {
		backgroundColor: "#e8f5e9",
		color: "#2e7d32",
	},
}));

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;
	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`datacontract-tabpanel-${index}`}
			aria-labelledby={`datacontract-tab-${index}`}
			{...other}
		>
			{value === index && <Box pt={2}>{children}</Box>}
		</div>
	);
}

export interface DataContractViewProps {
	contract: OdcsDataContract;
	rawDefinition: string;
}

export const DataContractView: React.FC<DataContractViewProps> = ({
	contract,
	rawDefinition,
}) => {
	const classes = useStyles();
	const [activeTab, setActiveTab] = useState(0);

	const getStatusChipClass = (status?: string) => {
		const s = (status || "").toLowerCase();
		if (s === "active" || s === "production") return classes.badgeActive;
		if (s === "draft" || s === "proposed" || s === "in development")
			return classes.badgeDraft;
		if (s === "deprecated" || s === "retired") return classes.badgeDeprecated;
		return undefined;
	};

	const renderDescription = () => {
		if (!contract.description) return null;

		if (typeof contract.description === "string") {
			return (
				<Box mt={2}>
					<Typography variant="body1">{contract.description}</Typography>
				</Box>
			);
		}

		const desc = contract.description as OdcsStructuredDescription;
		return (
			<Box mt={2}>
				<Grid container spacing={2}>
					{desc.purpose && (
						<Grid item xs={12} md={4}>
							<Typography variant="subtitle2" color="textSecondary">
								Purpose
							</Typography>
							<Typography variant="body2">{desc.purpose}</Typography>
						</Grid>
					)}
					{desc.limitations && (
						<Grid item xs={12} md={4}>
							<Typography variant="subtitle2" color="textSecondary">
								Limitations
							</Typography>
							<Typography variant="body2">{desc.limitations}</Typography>
						</Grid>
					)}
					{desc.usage && (
						<Grid item xs={12} md={4}>
							<Typography variant="subtitle2" color="textSecondary">
								Usage
							</Typography>
							<Typography variant="body2">{desc.usage}</Typography>
						</Grid>
					)}
				</Grid>
			</Box>
		);
	};

	const renderPropertyRows = (
		properties: OdcsProperty[],
		depth = 0,
	): React.ReactNode => {
		return properties.map((prop) => (
			<React.Fragment key={`${depth}-${prop.name}`}>
				<TableRow className={depth > 0 ? classes.nestedPropertyRow : undefined}>
					<TableCell style={{ paddingLeft: 16 + depth * 24 }}>
						<Box display="flex" alignItems="center">
							<Typography variant="body2" style={{ fontWeight: 600 }}>
								{prop.name}
							</Typography>
							{prop.businessName && (
								<Tooltip title="Business Name">
									<Typography
										variant="caption"
										color="textSecondary"
										style={{ marginLeft: 6 }}
									>
										({prop.businessName})
									</Typography>
								</Tooltip>
							)}
						</Box>
					</TableCell>
					<TableCell>
						<Typography variant="body2" component="span">
							{prop.logicalType || prop.physicalType || "unknown"}
						</Typography>
						{prop.logicalType && prop.physicalType && (
							<Typography
								variant="caption"
								color="textSecondary"
								display="block"
							>
								physical: {prop.physicalType}
							</Typography>
						)}
					</TableCell>
					<TableCell>
						{prop.primaryKey && (
							<Chip
								size="small"
								label="PK"
								className={`${classes.constraintChip} ${classes.pkChip}`}
							/>
						)}
						{prop.required && (
							<Chip
								size="small"
								label="Required"
								className={`${classes.constraintChip} ${classes.requiredChip}`}
							/>
						)}
						{prop.unique && (
							<Chip
								size="small"
								label="Unique"
								className={`${classes.constraintChip} ${classes.uniqueChip}`}
							/>
						)}
						{prop.partitioned && (
							<Chip
								size="small"
								label="Partitioned"
								className={`${classes.constraintChip} ${classes.partitionChip}`}
							/>
						)}
						{prop.criticalDataElement && (
							<Chip
								size="small"
								label="CDE"
								className={`${classes.constraintChip} ${classes.cdeChip}`}
							/>
						)}
						{!prop.primaryKey &&
							!prop.required &&
							!prop.unique &&
							!prop.partitioned &&
							!prop.criticalDataElement && (
								<Typography variant="caption" color="textSecondary">
									-
								</Typography>
							)}
					</TableCell>
					<TableCell>
						{prop.classification ? (
							<Chip size="small" label={prop.classification} />
						) : (
							"-"
						)}
					</TableCell>
					<TableCell>
						<Typography variant="body2">{prop.description || "-"}</Typography>
						{prop.relationships && prop.relationships.length > 0 && (
							<Box mt={0.5}>
								{prop.relationships.map((rel, idx) => (
									<Tooltip
										key={`${prop.name}-${rel.to || rel.from || idx}`}
										title={`Relationship: ${rel.type || "reference"}`}
									>
										<Chip
											size="small"
											icon={<LinkIcon />}
											label={`-> ${rel.to || "target"}`}
											variant="outlined"
											style={{ marginRight: 4, height: 20 }}
										/>
									</Tooltip>
								))}
							</Box>
						)}
					</TableCell>
					<TableCell>
						{prop.examples && prop.examples.length > 0 ? (
							<code>{prop.examples.join(", ")}</code>
						) : (
							"-"
						)}
					</TableCell>
				</TableRow>
				{prop.properties &&
					prop.properties.length > 0 &&
					renderPropertyRows(prop.properties, depth + 1)}
				{prop.items && renderPropertyRows([prop.items], depth + 1)}
			</React.Fragment>
		));
	};

	const schemaList = contract.schema || [];
	const serversList = contract.servers || [];
	const slaList = contract.slaProperties || [];
	const qualityList = contract.quality || [];
	const teamList = contract.team || [];
	const supportList = contract.support || [];
	const rolesList = contract.roles || [];

	return (
		<div className={classes.root}>
			{/* Header / Overview */}
			<InfoCard
				title={contract.name || contract.id}
				subheader={`ID: ${contract.id}`}
				className={classes.headerCard}
			>
				<Box display="flex" flexWrap="wrap" alignItems="center">
					<Chip
						label={`Version: ${contract.version}`}
						className={classes.chip}
						color="primary"
						size="small"
					/>
					{contract.status && (
						<Chip
							label={contract.status.toUpperCase()}
							className={`${classes.chip} ${getStatusChipClass(
								contract.status,
							)}`}
							size="small"
						/>
					)}
					{contract.domain && (
						<Chip
							label={`Domain: ${contract.domain}`}
							className={classes.chip}
							variant="outlined"
							size="small"
						/>
					)}
					{contract.dataProduct && (
						<Chip
							label={`Data Product: ${contract.dataProduct}`}
							className={classes.chip}
							variant="outlined"
							size="small"
						/>
					)}
					{contract.tenant && (
						<Chip
							label={`Tenant: ${contract.tenant}`}
							className={classes.chip}
							variant="outlined"
							size="small"
						/>
					)}
					{contract.apiVersion && (
						<Chip
							label={`ODCS: ${contract.apiVersion}`}
							className={classes.chip}
							variant="outlined"
							size="small"
						/>
					)}
				</Box>

				{contract.tags && contract.tags.length > 0 && (
					<Box mt={1} display="flex" flexWrap="wrap">
						{contract.tags.map((tag) => (
							<Chip
								key={tag}
								label={`#${tag}`}
								size="small"
								className={classes.chip}
							/>
						))}
					</Box>
				)}

				{renderDescription()}
			</InfoCard>

			{/* Tabs Header */}
			<Paper square>
				<Tabs
					value={activeTab}
					onChange={(_e, newValue) => setActiveTab(newValue)}
					indicatorColor="primary"
					textColor="primary"
					variant="scrollable"
					scrollButtons="auto"
				>
					<Tab
						label={`Schema (${schemaList.length})`}
						icon={<TableChartIcon />}
					/>
					<Tab
						label={`Servers (${serversList.length})`}
						icon={<StorageIcon />}
					/>
					<Tab label={`SLAs (${slaList.length})`} icon={<AssignmentIcon />} />
					<Tab
						label={`Quality (${qualityList.length})`}
						icon={<VerifiedIcon />}
					/>
					<Tab
						label={`Team & Support (${teamList.length + supportList.length})`}
						icon={<PeopleIcon />}
					/>
					<Tab label={`Roles (${rolesList.length})`} icon={<SecurityIcon />} />
					<Tab label="Raw YAML" icon={<CodeIcon />} />
				</Tabs>
			</Paper>

			{/* Tab 1: Schema & Properties Explorer */}
			<TabPanel value={activeTab} index={0}>
				{schemaList.length === 0 ? (
					<Alert severity="info">
						No schema objects defined in this data contract.
					</Alert>
				) : (
					schemaList.map((schemaObj) => (
						<Box mb={3} key={schemaObj.name}>
							<Accordion defaultExpanded>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Box display="flex" alignItems="center" flexWrap="wrap">
										<Typography variant="h6" style={{ fontWeight: 600 }}>
											{schemaObj.name}
										</Typography>
										{schemaObj.physicalName &&
											schemaObj.physicalName !== schemaObj.name && (
												<Typography
													variant="body2"
													color="textSecondary"
													style={{ marginLeft: 8 }}
												>
													({schemaObj.physicalName})
												</Typography>
											)}
										{schemaObj.logicalType && (
											<Chip
												label={schemaObj.logicalType}
												size="small"
												style={{ marginLeft: 12 }}
											/>
										)}
									</Box>
								</AccordionSummary>
								<AccordionDetails>
									<Box width="100%">
										{schemaObj.description && (
											<Typography
												variant="body2"
												color="textSecondary"
												paragraph
											>
												{schemaObj.description}
											</Typography>
										)}

										{schemaObj.relationships &&
											schemaObj.relationships.length > 0 && (
												<Box mb={2}>
													<Typography variant="subtitle2">
														Schema Relationships:
													</Typography>
													{schemaObj.relationships.map((rel, idx) => (
														<Chip
															key={`${rel.type || "rel"}-${rel.from || schemaObj.name}-${rel.to || idx}`}
															icon={<LinkIcon />}
															label={`${rel.type || "ref"}: ${rel.from || schemaObj.name} -> ${rel.to}`}
															variant="outlined"
															size="small"
															style={{ marginRight: 8, marginTop: 4 }}
														/>
													))}
												</Box>
											)}

										<TableContainer component={Paper} variant="outlined">
											<Table size="small" className={classes.table}>
												<TableHead>
													<TableRow>
														<TableCell>Property</TableCell>
														<TableCell>Type</TableCell>
														<TableCell>Constraints</TableCell>
														<TableCell>Classification</TableCell>
														<TableCell>Description</TableCell>
														<TableCell>Examples</TableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													{schemaObj.properties &&
													schemaObj.properties.length > 0 ? (
														renderPropertyRows(schemaObj.properties)
													) : (
														<TableRow>
															<TableCell colSpan={6} align="center">
																No properties defined
															</TableCell>
														</TableRow>
													)}
												</TableBody>
											</Table>
										</TableContainer>
									</Box>
								</AccordionDetails>
							</Accordion>
						</Box>
					))
				)}
			</TabPanel>

			{/* Tab 2: Servers */}
			<TabPanel value={activeTab} index={1}>
				{serversList.length === 0 ? (
					<Alert severity="info">
						No servers configured for this contract.
					</Alert>
				) : (
					<TableContainer component={Paper} variant="outlined">
						<Table size="small" className={classes.table}>
							<TableHead>
								<TableRow>
									<TableCell>Server</TableCell>
									<TableCell>Type</TableCell>
									<TableCell>Environment</TableCell>
									<TableCell>Location / Host</TableCell>
									<TableCell>Database / Schema</TableCell>
									<TableCell>Format</TableCell>
									<TableCell>Description</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{serversList.map((s, idx) => (
									<TableRow key={`${s.server}-${s.environment || idx}`}>
										<TableCell>
											<strong>{s.server}</strong>
										</TableCell>
										<TableCell>{s.type || "-"}</TableCell>
										<TableCell>
											{s.environment ? (
												<Chip size="small" label={s.environment} />
											) : (
												"-"
											)}
										</TableCell>
										<TableCell>
											{s.location || s.host || "-"}
											{s.port ? `:${s.port}` : ""}
										</TableCell>
										<TableCell>
											{s.database || s.schema
												? `${s.database || ""}${s.database && s.schema ? "/" : ""}${s.schema || ""}`
												: "-"}
										</TableCell>
										<TableCell>{s.format || "-"}</TableCell>
										<TableCell>{s.description || "-"}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</TabPanel>

			{/* Tab 3: SLAs */}
			<TabPanel value={activeTab} index={2}>
				{slaList.length === 0 ? (
					<Alert severity="info">No SLA properties defined.</Alert>
				) : (
					<TableContainer component={Paper} variant="outlined">
						<Table size="small" className={classes.table}>
							<TableHead>
								<TableRow>
									<TableCell>Property</TableCell>
									<TableCell>Value</TableCell>
									<TableCell>Unit</TableCell>
									<TableCell>Element</TableCell>
									<TableCell>Driver</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{slaList.map((sla, idx) => (
									<TableRow key={`${sla.property}-${sla.element || idx}`}>
										<TableCell>
											<strong>{sla.property}</strong>
										</TableCell>
										<TableCell>{String(sla.value ?? "-")}</TableCell>
										<TableCell>{sla.unit || "-"}</TableCell>
										<TableCell>{sla.element || "-"}</TableCell>
										<TableCell>{sla.driver || "-"}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</TabPanel>

			{/* Tab 4: Quality */}
			<TabPanel value={activeTab} index={3}>
				{qualityList.length === 0 ? (
					<Alert severity="info">No data quality rules configured.</Alert>
				) : (
					<TableContainer component={Paper} variant="outlined">
						<Table size="small" className={classes.table}>
							<TableHead>
								<TableRow>
									<TableCell>Type</TableCell>
									<TableCell>Dimension</TableCell>
									<TableCell>Rule</TableCell>
									<TableCell>Severity</TableCell>
									<TableCell>Engine / Schedule</TableCell>
									<TableCell>Description / Implementation</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{qualityList.map((q, idx) => (
									<TableRow
										key={`${q.type || "quality"}-${q.rule || q.dimension || idx}`}
									>
										<TableCell>
											<strong>{q.type || "rule"}</strong>
										</TableCell>
										<TableCell>{q.dimension || "-"}</TableCell>
										<TableCell>{q.rule || "-"}</TableCell>
										<TableCell>
											{q.severity ? (
												<Chip size="small" label={q.severity} />
											) : (
												"-"
											)}
										</TableCell>
										<TableCell>
											{q.engine || q.schedule
												? `${q.engine || ""}${q.engine && q.schedule ? " / " : ""}${q.schedule || ""}`
												: "-"}
										</TableCell>
										<TableCell>
											{q.description || q.implementation || "-"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</TabPanel>

			{/* Tab 5: Team & Support */}
			<TabPanel value={activeTab} index={4}>
				<Grid container spacing={3}>
					<Grid item xs={12} md={6}>
						<Typography variant="h6" className={classes.sectionTitle}>
							Team Members ({teamList.length})
						</Typography>
						{teamList.length === 0 ? (
							<Typography variant="body2" color="textSecondary">
								No team members specified.
							</Typography>
						) : (
							<TableContainer component={Paper} variant="outlined">
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell>Name</TableCell>
											<TableCell>Role</TableCell>
											<TableCell>Username</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{teamList.map((m, idx) => (
											<TableRow
												key={`${m.username || m.name || "member"}-${idx}`}
											>
												<TableCell>
													<strong>{m.name || m.username || "Member"}</strong>
												</TableCell>
												<TableCell>{m.role || "-"}</TableCell>
												<TableCell>{m.username || "-"}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						)}
					</Grid>

					<Grid item xs={12} md={6}>
						<Typography variant="h6" className={classes.sectionTitle}>
							Support Channels ({supportList.length})
						</Typography>
						{supportList.length === 0 ? (
							<Typography variant="body2" color="textSecondary">
								No support channels specified.
							</Typography>
						) : (
							<TableContainer component={Paper} variant="outlined">
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell>Channel</TableCell>
											<TableCell>Tool / Scope</TableCell>
											<TableCell>URL</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{supportList.map((sup, idx) => (
											<TableRow
												key={`${sup.channel || sup.url || "support"}-${idx}`}
											>
												<TableCell>
													<strong>{sup.channel || "Support"}</strong>
												</TableCell>
												<TableCell>
													{sup.tool || sup.scope
														? `${sup.tool || ""}${sup.tool && sup.scope ? " / " : ""}${sup.scope || ""}`
														: "-"}
												</TableCell>
												<TableCell>
													{sup.url ? (
														<a
															href={sup.url}
															target="_blank"
															rel="noopener noreferrer"
														>
															{sup.url}
														</a>
													) : (
														"-"
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						)}
					</Grid>
				</Grid>
			</TabPanel>

			{/* Tab 6: Roles & Security */}
			<TabPanel value={activeTab} index={5}>
				<Typography variant="h6" className={classes.sectionTitle}>
					Access Roles ({rolesList.length})
				</Typography>
				{rolesList.length === 0 ? (
					<Typography variant="body2" color="textSecondary" paragraph>
						No specific roles configured.
					</Typography>
				) : (
					<TableContainer component={Paper} variant="outlined">
						<Table size="small" className={classes.table}>
							<TableHead>
								<TableRow>
									<TableCell>Role</TableCell>
									<TableCell>Description</TableCell>
									<TableCell>Access Level</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{rolesList.map((r, idx) => (
									<TableRow key={`${r.role}-${idx}`}>
										<TableCell>
											<strong>{r.role}</strong>
										</TableCell>
										<TableCell>{r.description || "-"}</TableCell>
										<TableCell>
											{r.access ? <Chip size="small" label={r.access} /> : "-"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}

				{contract.price && (
					<Box mt={3}>
						<Typography variant="h6" className={classes.sectionTitle}>
							Pricing
						</Typography>
						<Typography variant="body2">
							{contract.price.amount !== undefined
								? `${contract.price.amount} ${contract.price.currency || ""}${contract.price.unit ? ` / ${contract.price.unit}` : ""}`
								: "Price not configured"}
						</Typography>
					</Box>
				)}
			</TabPanel>

			{/* Tab 7: Raw Definition */}
			<TabPanel value={activeTab} index={6}>
				<CodeSnippet language="yaml" text={rawDefinition} />
			</TabPanel>
		</div>
	);
};
