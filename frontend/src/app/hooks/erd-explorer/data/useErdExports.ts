import { useCallback, useEffect, useRef, useState } from 'react';
import { type Edge, type Node, getNodesBounds } from '@xyflow/react';
import { type ReactFlowInstance } from '@xyflow/react';
import { toPng, toSvg } from 'html-to-image';
import { useColorMode } from '../../../components/shared/ui-components/color-mode';
import { toaster } from '../../../components/shared/ui-components/toaster';
import { getVaultDns, getVaultId, getVaultName } from '../../../services/SharedServices';
import { toMermaidErd, toMarkdownDocument } from '../../../utils/erd-explorer/export/ErdExplorerMarkdown';
import { downloadText, downloadDataUrl } from '../../../utils/erd-explorer/export/ErdExplorerExport';
import {
    serializeProject,
    deserializeProject,
    projectDiffersFromSchema,
    projectVaultMismatchMessage,
    type ErdProjectFile,
} from '../../../utils/erd-explorer/export/ErdExplorerProject';
import type { ErdSchemaSnapshot } from '../../../utils/erd-explorer/schema/ErdExplorerSchemaCache';
import { relationshipLineLabel } from '../../../utils/erd-explorer/graph/ErdExplorerEdgeHelpers';
import type { ErdField, ErdObjectSummary } from '../../../utils/erd-explorer/ErdExplorerTypes';
import type { ImportMode, ErdGraphState } from '../erdReducer';
import type { ErdObjectRecord } from '../useErdExplorerData';

/** Padding left around the diagram's bounding box in an exported image. */
const EXPORT_PADDING = 40;
/** Raster ceilings the pixel ratio is scaled down to fit, so a huge diagram still encodes. */
const MAX_RASTER_DIMENSION = 32000;
const MAX_RASTER_AREA = 256_000_000;
/** Inset of the composited legend from the exported image's top-left corner. */
const LEGEND_INSET = 8;

function loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = source;
    });
}

interface UseErdExportsParams {
    placedObjects: string[];
    records: Record<string, ErdObjectRecord>;
    objectList: ErdObjectSummary[];
    schemaRecords: Record<string, ErdObjectRecord>;
    schemaStatus: 'loading' | 'ready' | 'error';
    applyImportedSchema: (imported: ErdSchemaSnapshot) => void;
    resolveVisibleFieldNames: (name: string) => string[];
    edges: Edge[];
    setNodes: (updater: (previous: Node[]) => Node[]) => void;
    setSelectedNodeIds: (ids: string[]) => void;
    reactFlowRef: React.MutableRefObject<ReactFlowInstance<Node, Edge> | null>;
    graphState: ErdGraphState;
    applyProjectToGraph: (project: ErdProjectFile, mode: ImportMode) => void;
    showRelationshipLineLabels: boolean;
}

/**
 * All export and import functions for the ERD: Markdown, PNG, SVG, and project JSON.
 * Split out to keep useErdExplorer focused on canvas + interaction logic.
 */
export function useErdExports({
    placedObjects,
    records,
    objectList,
    schemaRecords,
    schemaStatus,
    applyImportedSchema,
    resolveVisibleFieldNames,
    edges,
    setNodes,
    setSelectedNodeIds,
    reactFlowRef,
    graphState,
    applyProjectToGraph,
    showRelationshipLineLabels,
}: UseErdExportsParams) {
    const [pendingImportProject, setPendingImportProject] = useState<ErdProjectFile | null>(null);

    const { colorMode } = useColorMode();

    // Records from the last import, kept until the schema lands so the two can be compared once.
    const importedRecordsAwaitingSchemaRef = useRef<Record<string, ErdObjectRecord> | null>(null);

    const exportProject = useCallback(
        () => {
            if (graphState.placedObjects.length === 0) {
                toaster.create({ type: 'info', title: 'Nothing to export', description: 'Add objects to the canvas first.' });
                return;
            }
            const vaultId = getVaultId();
            if (!vaultId) {
                toaster.create({ type: 'error', title: 'Cannot export', description: 'The connected Vault could not be identified.' });
                return;
            }
            const project = serializeProject({
                state: graphState,
                records,
                objectList,
                vault: { vaultId, vaultName: getVaultName() ?? undefined, vaultDNS: getVaultDns() ?? undefined },
            });
            downloadText('erd-explorer-project.json', JSON.stringify(project, null, 2), 'application/json');
        },
        [graphState, records, objectList],
    );

    /** Say so when the live schema has corrected what an imported file described. */
    const noticeSchemaCorrections = useCallback((importedRecords: Record<string, ErdObjectRecord>) => {
        if (!projectDiffersFromSchema(importedRecords, schemaRecords)) return;
        toaster.create({ type: 'info', title: 'Diagram updated to match current Vault configuration' });
    }, [schemaRecords]);

    /**
     * Put the file's objects on the canvas and hand its metadata to the data layer, so the diagram draws
     * without a single Vault call. If the schema is already in, the comparison against live config
     * happens now; otherwise it waits for the load to finish.
     */
    const applyProject = useCallback(
        (project: ErdProjectFile, mode: ImportMode) => {
            applyImportedSchema({ records: project.records, objectList: project.objectList });
            applyProjectToGraph(project, mode);
            if (schemaStatus === 'ready') noticeSchemaCorrections(project.records);
            else importedRecordsAwaitingSchemaRef.current = project.records;
        },
        [applyProjectToGraph, applyImportedSchema, schemaStatus, noticeSchemaCorrections],
    );

    // Respect the showRelationshipLineLabels setting — pass an empty label when labels are off.
    const exportMarkdown = useCallback(
        () => {
            const names = placedObjects;
            if (names.length === 0) {
                toaster.create({ type: 'info', title: 'Nothing to export', description: 'Add objects to the canvas first.' });
                return;
            }
            const nameSet = new Set(names);
            const mermaidObjects = names.map((name) => {
                const record = records[name];
                const visibleSet = new Set(resolveVisibleFieldNames(name));
                return {
                    name,
                    fields: (record?.fields ?? [])
                        .filter((field) => visibleSet.has(field.name))
                        .map((field) => ({ name: field.name, type: field.type })),
                };
            });
            const mermaidEdges = edges
                .filter((edge) => nameSet.has(edge.source) && nameSet.has(edge.target))
                .map((edge) => {
                    const edgeData = edge.data as { relationshipName?: string; relationshipType?: string; owningField?: ErdField } | undefined;
                    return {
                        source: edge.source,
                        target: edge.target,
                        label: showRelationshipLineLabels
                            ? relationshipLineLabel(
                                  edgeData?.relationshipName,
                                  edgeData?.relationshipType ?? 'reference',
                                  edgeData?.owningField?.inboundName,
                              )
                            : '',
                    };
                });
            downloadText('erd-explorer.md', toMarkdownDocument(toMermaidErd(mermaidObjects, mermaidEdges)));
        },
        [placedObjects, records, resolveVisibleFieldNames, edges, showRelationshipLineLabels],
    );

    // Capture .react-flow (includes the legend panel) and apply the viewport transform via onclone.
    const exportImage = useCallback(
        async (imageFormat: 'png' | 'svg') => {
            const instance = reactFlowRef.current;
            if (!instance) return;
            const objectNodes = instance.getNodes().filter((node) => !!node.measured?.width);
            if (objectNodes.length === 0) {
                toaster.create({ type: 'info', title: 'Nothing to export', description: 'Add objects to the canvas first.' });
                return;
            }

            setNodes((previous) => previous.map((node) => (node.selected ? { ...node, selected: false } : node)));
            setSelectedNodeIds([]);

            await new Promise<void>((resolve) => {
                requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            });

            try {
                const bounds = getNodesBounds(objectNodes);
                const width = Math.ceil(bounds.width + EXPORT_PADDING * 2);
                const height = Math.ceil(bounds.height + EXPORT_PADDING * 2);
                const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement | null;
                if (!viewportElement) return;

                const pixelRatio = Math.max(
                    0.1,
                    Math.min(
                        2,
                        MAX_RASTER_DIMENSION / Math.max(width, height),
                        Math.sqrt(MAX_RASTER_AREA / (width * height)),
                    ),
                );
                const backgroundColor = colorMode === 'dark' ? '#1a1a1a' : '#ffffff';
                const translateX = -bounds.x + EXPORT_PADDING;
                const translateY = -bounds.y + EXPORT_PADDING;

                const viewportOptions = {
                    backgroundColor,
                    width,
                    height,
                    pixelRatio,
                    style: {
                        width: `${width}px`,
                        height: `${height}px`,
                        transform: `translate(${translateX}px, ${translateY}px) scale(1)`,
                    },
                };

                // Capture the legend separately in its natural DOM context, then composite.
                const legendElement = document.querySelector('.react-flow__panel-top.react-flow__panel-left') as HTMLElement | null;
                const legendPng = legendElement ? await toPng(legendElement, { pixelRatio }) : null;
                const legendWidth = legendElement ? legendElement.offsetWidth : 0;
                const legendHeight = legendElement ? legendElement.offsetHeight : 0;

                if (imageFormat === 'png') {
                    const mainPng = await toPng(viewportElement, viewportOptions);
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(width * pixelRatio);
                    canvas.height = Math.round(height * pixelRatio);
                    const canvasContext = canvas.getContext('2d')!;
                    canvasContext.drawImage(await loadImage(mainPng), 0, 0);
                    if (legendPng) {
                        const legendOffset = Math.round(LEGEND_INSET * pixelRatio);
                        canvasContext.drawImage(await loadImage(legendPng), legendOffset, legendOffset);
                    }
                    downloadDataUrl('erd-explorer.png', canvas.toDataURL('image/png'));
                } else {
                    const prefix = 'data:image/svg+xml;charset=utf-8,';
                    const rawSvg = await toSvg(viewportElement, viewportOptions);
                    let svgText = decodeURIComponent(rawSvg.slice(prefix.length));
                    const backgroundRect = `<rect width="${width}" height="${height}" fill="${backgroundColor}"/>`;
                    svgText = svgText.replace(/<svg([^>]*)>/, `<svg$1>${backgroundRect}`);
                    if (legendPng) {
                        svgText = svgText.replace(
                            '</svg>',
                            `<image href="${legendPng}" x="${LEGEND_INSET}" y="${LEGEND_INSET}" width="${legendWidth}" height="${legendHeight}"/></svg>`,
                        );
                    }
                    downloadDataUrl('erd-explorer.svg', prefix + encodeURIComponent(svgText));
                }
            } catch (error) {
                toaster.create({
                    type: 'error',
                    title: `${imageFormat.toUpperCase()} export failed`,
                    description: error instanceof Error ? error.message : String(error),
                });
            }
        },
        [colorMode, setNodes, setSelectedNodeIds, reactFlowRef],
    );

    const exportPng = useCallback(() => exportImage('png'), [exportImage]);
    const exportSvg = useCallback(() => exportImage('svg'), [exportImage]);

    const handleProjectImport = useCallback(
        async (file: File) => {
            let project: ErdProjectFile | null = null;
            try {
                project = deserializeProject(JSON.parse(await file.text()));
            } catch {
                project = null;
            }
            if (!project) {
                toaster.create({ type: 'error', title: 'Invalid project file', description: 'Not a valid ERD Explorer project.' });
                return;
            }
            const mismatch = projectVaultMismatchMessage(project, getVaultId());
            if (mismatch) {
                toaster.create({ type: 'error', title: 'Wrong Vault', description: mismatch });
                return;
            }
            if (placedObjects.length === 0) {
                applyProject(project, 'replace');
                toaster.create({ type: 'success', title: 'Diagram loaded', description: `Loaded ${project.objects.length} object${project.objects.length === 1 ? '' : 's'}.` });
            } else {
                setPendingImportProject(project);
            }
        },
        [placedObjects, applyProject],
    );

    const confirmImport = useCallback(
        (mode: ImportMode) => {
            if (!pendingImportProject) return;
            applyProject(pendingImportProject, mode);
            toaster.create({
                type: 'success',
                title: mode === 'replace' ? 'Diagram replaced' : 'Objects merged',
                description: `Loaded ${pendingImportProject.objects.length} object${pendingImportProject.objects.length === 1 ? '' : 's'}.`,
            });
            setPendingImportProject(null);
        },
        [pendingImportProject, applyProject],
    );

    const cancelImport = useCallback(() => setPendingImportProject(null), []);

    // For an import that landed while the schema was still loading: compare once the load finishes.
    useEffect(() => {
        if (schemaStatus !== 'ready') return;
        const importedRecords = importedRecordsAwaitingSchemaRef.current;
        if (!importedRecords) return;
        importedRecordsAwaitingSchemaRef.current = null;
        noticeSchemaCorrections(importedRecords);
    }, [schemaStatus, noticeSchemaCorrections]);

    return {
        exportProject,
        applyProject,
        exportMarkdown,
        exportPng,
        exportSvg,
        pendingImportProject,
        handleProjectImport,
        confirmImport,
        cancelImport,
    };
}
