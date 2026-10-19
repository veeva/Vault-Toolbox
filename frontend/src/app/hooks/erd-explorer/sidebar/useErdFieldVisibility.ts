import { useCallback } from 'react';
import { relationshipsOnlyFieldNames } from '../../../utils/erd-explorer/ErdExplorerHelper';
import type { ErdObjectRecord } from '../../../utils/erd-explorer/ErdExplorerTypes';

interface UseErdFieldVisibilityParams {
    records: Record<string, ErdObjectRecord>;
    visibleFields: Record<string, string[]>;
    setVisibleFields: (name: string, fields: string[]) => void;
}

/**
 * Manages per-object field visibility: resolving which fields are shown, toggling individual fields,
 * setting fields in bulk, and computing the visible-field set for the Field Selector tab.
 */
export function useErdFieldVisibility({ records, visibleFields, setVisibleFields }: UseErdFieldVisibilityParams) {
    const resolveVisibleFieldNames = useCallback(
        (objectName: string): string[] => {
            const record = records[objectName];
            const fields = record?.fields ?? [];
            const override = visibleFields[objectName];
            if (override) {
                const existingFieldNames = new Set(fields.map((field) => field.name));
                return override.filter((fieldName) => existingFieldNames.has(fieldName));
            }
            return relationshipsOnlyFieldNames(fields);
        },
        [records, visibleFields],
    );

    const toggleField = useCallback(
        (objectName: string, fieldName: string) => {
            const currentFields = new Set(resolveVisibleFieldNames(objectName));
            if (currentFields.has(fieldName)) currentFields.delete(fieldName);
            else currentFields.add(fieldName);
            setVisibleFields(objectName, [...currentFields]);
        },
        [resolveVisibleFieldNames, setVisibleFields],
    );

    const setFieldsForObject = useCallback(
        (objectName: string, fieldNames: string[]) => setVisibleFields(objectName, fieldNames),
        [setVisibleFields],
    );

    const visibleFieldSetFor = useCallback(
        (objectName: string) => new Set(resolveVisibleFieldNames(objectName)),
        [resolveVisibleFieldNames],
    );

    return { resolveVisibleFieldNames, toggleField, setFieldsForObject, visibleFieldSetFor };
}
