import { useEffect, useState } from 'react';
import VqlDefinitions from '../../components/vql-editor/query-builder/VqlDefinitions';
import { retrieveObjectCollection, retrieveObjectMetadata, retrievePicklistValues } from '../../services/ApiService';

export default function useQueryBuilder({ setCode }) {
    const [displayQueryBuilder, setDisplayQueryBuilder] = useState(true);
    const [vaultObjects, setVaultObjects] = useState([]);
    const [vaultObjectsError, setVaultObjectsError] = useState('');
    const [loadingVaultObjects, setLoadingVaultObjects] = useState(false);
    const [selectedObject, setSelectedObject] = useState();
    const [selectedFields, setSelectedFields] = useState();
    const [selectedFilters, setSelectedFilters] = useState([])
    const [fieldOptions, setFieldOptions] = useState();
    const [fieldOptionsError, setFieldOptionsError] = useState('');
    const [loadingObjectMetadata, setLoadingObjectMetadata] = useState(false);
    const [logicalOperator, setLogicalOperator] = useState('AND');
    const [picklistValueOptions, setPicklistValueOptions] = useState([]);

    const { defaultOperators, booleanValues, attachmentsQueryTarget } = VqlDefinitions();

    /**
     * Opens/closes the query builder panel
     */
    const toggleQueryBuilder = () => {
        setDisplayQueryBuilder(!displayQueryBuilder);
    };

    /**
     * Retrieves all Vault objects via the query endpoint and loads them into state
     */
    const fetchVaultObjects = async () => {
        setLoadingVaultObjects(true);
        setVaultObjectsError('');

        const objectResponse = await retrieveObjectCollection();
        if (objectResponse?.responseStatus === 'FAILURE') {
            let error = '';
            if (objectResponse?.errors?.length > 0) {
                error = `${objectResponse.errors[0].type} : ${objectResponse.errors[0].message}`
            }
            setVaultObjectsError(error);
            setLoadingVaultObjects(false);
            return;
        }

        const vaultObjectArray = [];
        objectResponse?.objects?.forEach((object) => {
            vaultObjectArray.push({
                label: `${object?.label} (${object?.name})`,
                value: object?.name,
            })
        })

        setVaultObjects(vaultObjectArray.sort((a, b) => a?.label.localeCompare(b?.label)));

        setLoadingVaultObjects(false);
    };

    /**
     * Retrieves object metadata for the selected object. Creates selectable field/relationship options and loads them
     * into state.
     */
    const fetchObjectMetadata = async () => {
        setLoadingObjectMetadata(true);
        setFieldOptionsError('');

        const { response } = await retrieveObjectMetadata(selectedObject?.value);

        if (response?.responseStatus === 'SUCCESS') {
            const objectFields = response?.object?.fields?.map(field => ({
                value: field.name,
                label: field.label,
                fieldType: field.type,
                picklist: field?.picklist
            }));

            const objectRelationships = response?.object?.relationships;
            const allowsAttachments = response?.object?.allow_attachments;

            let relationshipFieldOptions = [];
            if (objectRelationships) {
                const outboundRelationshipOptions = createRelationshipOptions(objectRelationships, 'reference_outbound', false);
                const parentRelationshipOptions = createRelationshipOptions(objectRelationships, 'parent', false);
                const inboundRelationshipOptions = createRelationshipOptions(objectRelationships, 'reference_inbound', true);
                const childRelationshipOptions = createRelationshipOptions(objectRelationships, 'child', true);
                const objectAttachmentOptions = allowsAttachments ?
                    createQueryFieldOptions(attachmentsQueryTarget.queryTarget, attachmentsQueryTarget.objectAttachmentFields, true, 'Attachments')
                    : [];

                relationshipFieldOptions = [
                    {
                        label: 'Outbound Relationships',
                        options: outboundRelationshipOptions,
                    },
                    {
                        label: 'Inbound Relationships',
                        options: inboundRelationshipOptions,
                    },
                    {
                        label: 'Child Relationships',
                        options: childRelationshipOptions,
                    },
                    {
                        label: 'Parent Relationships',
                        options: parentRelationshipOptions,
                    },
                    {
                        label: 'Attachments',
                        options: objectAttachmentOptions,
                    }
                ]
            }

            const allFieldOptions = [
                {
                    label: 'Fields',
                    options: objectFields
                },
                ...relationshipFieldOptions
            ]

            setFieldOptions(allFieldOptions);
        } else if (response?.responseStatus === 'FAILURE') {
            let error = '';
            if (response?.errors?.length > 0) {
                error = `${response.errors[0].type} : ${response.errors[0].message}`
            }
            setFieldOptionsError(error);
        }

        setLoadingObjectMetadata(false);
    };

    /**
     * Retrieves picklist values for the selected picklist name. Creates selectable options and loads them into state.
     * @param picklistName
     */
    const fetchPicklistValues = async (picklistName) => {
        let { response } = await retrievePicklistValues(picklistName);

        if (response?.responseStatus === 'SUCCESS') {
            const picklistOptions = response?.picklistValues?.map((picklistValue) => (
                { value: picklistValue.name, label: picklistValue.label }
            ));

            setPicklistValueOptions(picklistOptions);
        } else {
            setPicklistValueOptions([]);
        }
    }

    /**
     * Helper function that creates array of the default selectable options for an object relationship.
     * @param relationships - array of relationship objects (from Retrieve Object Metadata response)
     * @param relationshipType - type of relationship (child, parent, inbound, outbound, etc.)
     * @param includeSubqueryTarget - if a relationship type will be a subquery, includes subquery target in the options
     * @returns {Array} default selection fields for given relationship type
     */
    const createRelationshipOptions = (relationships, relationshipType, includeSubqueryTarget = false) => {
        return relationships
            .filter(relationship => relationship?.relationship_type === relationshipType)
            .flatMap(relationship => {
                const idFields = [ includeSubqueryTarget ?
                    {
                        label: `${relationship?.relationship_label}: ID`,
                        value: `${relationship?.relationship_name}.id`,
                        fieldType: 'ID'
                    } :
                    {
                        label: `${relationship?.relationship_label}: ID`,
                        value: `${relationship?.field}`,
                        fieldType: 'ID'
                    }];

                const commonFields = [
                    {
                        label: `${relationship?.relationship_label}: Name`,
                        value: `${relationship?.relationship_name}.name__v`,
                        fieldType: 'String'
                    },
                    {
                        label: `${relationship?.relationship_label}: Created By`,
                        value: `${relationship?.relationship_name}.created_by__v`,
                        fieldType: 'Object'
                    }
                ]

                const objectFields = [
                    {
                        label: `${relationship?.relationship_label}: Created Date`,
                        value: `${relationship?.relationship_name}.created_date__v`,
                        fieldType: 'DateTime'
                    },
                    {
                        label: `${relationship?.relationship_label}: Status`,
                        value: `${relationship?.relationship_name}.status__v`,
                        fieldType: 'Picklist',
                        picklist: 'default_status__v'
                    },
                    {
                        label: `${relationship?.relationship_label}: Last Modified By`,
                        value: `${relationship?.relationship_name}.modified_by__v`,
                        fieldType: 'Object'
                    },
                    {
                        label: `${relationship?.relationship_label}: Last Modified Date`,
                        value: `${relationship?.relationship_name}.modified_date__v`,
                        fieldType: 'DateTime'
                    }
                ];

                const documentFields = [
                    {
                        label: `${relationship?.relationship_label}: Created Date`,
                        value: `${relationship?.relationship_name}.document_creation_date__v`,
                        fieldType: 'DateTime'
                    },
                    {
                        label: `${relationship?.relationship_label}: Status`,
                        value: `${relationship?.relationship_name}.status__v`,
                        fieldType: 'String'
                    },
                    {
                        label: `${relationship?.relationship_label}: Last Modified By`,
                        value: `${relationship?.relationship_name}.last_modified_by__v`,
                        fieldType: 'Object'
                    },
                    {
                        label: `${relationship?.relationship_label}: Last Modified Date`,
                        value: `${relationship?.relationship_name}.version_modified_date__v`,
                        fieldType: 'DateTime'
                    }
                ];

                const fields = [
                    ...idFields,
                    ...commonFields,
                    ...(relationship?.object?.name === 'documents' ? documentFields : objectFields)
                ];

                return fields.map(fieldOption => ({
                    ...fieldOption,
                    ...(includeSubqueryTarget && { subqueryTarget: relationship?.relationship_name })
                }))
            }
        )
    }

    /**
     * Helper function that creates array of selectable options for a given query target and fields.
     * @param queryTarget - query target
     * @param fields - array of fields (api name, label, field type)
     * @param isSubquery - if this query target will be used in a subquery
     * @param labelPrefix - the label to display before the actual field label (e.g. Attachments)
     * @returns {Array} selectable field options for the given query target & fields
     */
    const createQueryFieldOptions = (queryTarget, fields, isSubquery = false, labelPrefix = '') => {
        // Subqueries (e.g. attachments) need the react-select options to have the subquery target and field type
        if (isSubquery) {
            return fields.map(field => ({
                label: `${labelPrefix}: ${field.label}`,
                value: `${queryTarget}.${field.field}`,
                subqueryTarget: queryTarget,
                fieldType: field.fieldType,
            }))
        }
    }

    /**
     * Builds a VQL query based on the users current selections
     */
    const buildQuery = () => {

        const primaryFields = selectedFields?.filter(field => !field?.subqueryTarget);
        const subqueryFields = selectedFields?.filter(field => field?.subqueryTarget);

        const dataGroupedBySubquery = subqueryFields.reduce((groupedBySubqueryTarget, field) => {
            const subqueryTarget = field.subqueryTarget;
            if (!groupedBySubqueryTarget[subqueryTarget]) {
                groupedBySubqueryTarget[subqueryTarget] = [];
            }
            groupedBySubqueryTarget[subqueryTarget].push(field.value);
            return groupedBySubqueryTarget;
        }, {});

        // Transform the grouped subquery data into a consistent structure
        const subqueryData = Object.entries(dataGroupedBySubquery).map(([key, values]) => ({
            subqueryTarget: key,
            values: values
        }));

        // Gather primary fields in comma-delimited string
        let fieldsString = '';
        if (primaryFields.length > 0) {
            fieldsString += primaryFields?.map(field => field?.value)?.join(', ');
        }

        // Append subqueries to the primary fields string
        if (subqueryData.length > 0) {
            subqueryData.forEach(subqueryObject => {
                const subqueryValues = subqueryObject?.values?.map(value => value?.substring(value?.indexOf('.') + 1))
                fieldsString += `, \n\t(SELECT ${subqueryValues.join(', ')} FROM ${subqueryObject.subqueryTarget})`
            })
        }

        // Create where clause string
        let whereClause = '';
        if (selectedFilters?.length > 0) {
            whereClause = '\nWHERE ';
            selectedFilters.forEach((filter, index) => {
                if (!filter?.field) { return } // Don't build empty filters without a field specified
                if (index !== 0) { whereClause += ` ${logicalOperator} `;}

                if (filter?.operator.value === 'CONTAINS') {
                    let filterValue = '';
                    if (Array.isArray(filter?.value)) {
                        // Multi-select picklists are in an array and should be comma-delimited & wrapped in a string
                        filterValue = `${filter.value.map(value => `'${value.value}'`).join(', ')}`;
                    } else if (filter?.value?.includes(',')) {
                        // Values with a comma are the user passing multiple values so comma-delimit & wrap each in a string
                        filterValue = filter.value?.split(',').map((value) => `'${value.trim()}'`).join(',');
                    } else {
                        // All other values are simply wrapped in a string
                        filterValue = `'${filter.value}'`
                    }

                    whereClause += `(${filter?.field?.value} ${filter.operator.value} (${filterValue}))`
                } else {
                    if (filter?.field.fieldType === 'String' || filter?.field.fieldType === 'Date' || filter?.field.fieldType === 'DateTime') {
                        // Wrap all String/Date/DateTime values in a string
                        whereClause += `(${filter?.field?.value} ${filter.operator.value} '${filter.value}')`
                    } else if (filter?.field.fieldType === 'Picklist') {
                        // Wrap all Picklists values in their own string
                        whereClause += `(${filter?.field?.value} ${filter.operator.value} '${filter.value.value}')`
                    } else {
                        // Everything else gets the raw value
                        whereClause += `(${filter?.field?.value} ${filter.operator.value} ${filter.value})`
                    }
                }
            })
        }

        const queryString = `SELECT ${fieldsString} \nFROM ${selectedObject?.value} ${whereClause}`;

        setCode(queryString);
    };

    /**
     * Returns true if the current query can be built, otherwise false (e.g. if there are empty filters)
     */
    const canBuildQuery = () => {
        /*
            Cannot build a query if:
                No selected object
                No selected fields
                Empty field/operator/value rows in the where clause
         */
        let canBuild = true;

        if (!selectedObject?.value || selectedFields.length === 0) {
            canBuild = false;
        }

        if (selectedFilters?.length > 0) {
            selectedFilters.forEach((filter, index) => {
                if (!filter?.field || !filter?.operator || !filter?.value) { canBuild = false; }
            })
        }

        return canBuild;
    }

    /**
     * Converts an array of values to an array of options in the format supported by React-Select components.
     * E.g. ['='] becomes [{ value: '=', label: '=' }]
     * @param array - array of values
     * @returns {Array}
     */
    const convertArrayToSelectOptions = (array) => {
        return array.map(item => ({
            value: item,
            label: item,
        }))
    }

    const operatorOptions = convertArrayToSelectOptions(defaultOperators);
    const booleanValueOptions = convertArrayToSelectOptions(booleanValues);

    /**
     * Creates an empty, new query filter row.
     */
    const addNewFilterRow = () => {
        const newFilterRow = {
            field: '',
            operator: '',
            value: ''
        };

        setSelectedFilters((prevFilters) => [...prevFilters, newFilterRow]);
    };

    /**
     * Removes a row from the selected filters.
     * @param {Number} rowToRemove - index of the row to remove
     */
    const removeFilterRow = (rowToRemove) => {
        const updatedSelectedFilters = selectedFilters.filter((_, filterRowIndex) => {
            return filterRowIndex !== rowToRemove;
        });

        setSelectedFilters(updatedSelectedFilters);
    };

    /**
     * Handles updates to the selected query filters.
     * @param {String} newValue - new value of the field being updated
     * @param {Number} rowIndex - index of the updated row
     * @param {String} field - field being updated
     */
    const handleSelectedFilterEdits = (newValue, rowIndex, field) => {
        const rowIndexAsNumber = Number(rowIndex);
        const previousFilterRow = selectedFilters[rowIndexAsNumber];

        const updatedSelectedFilters = [...selectedFilters];
        updatedSelectedFilters[rowIndexAsNumber] = {...updatedSelectedFilters[rowIndexAsNumber], [field]: newValue};

        // If the field has been updated to a Picklist, load the picklist options
        if (field === 'field' && newValue?.fieldType === 'Picklist' && newValue?.picklist) {
            fetchPicklistValues(newValue.picklist)
        }

        /*
             Clear existing values if:
             - The field was a Picklist and operator changed from CONTAINS to anything else (or vice versa)
             - The field type changed (e.g. String to Picklist)
             - The field was changed to a different Picklist
         */
        if ((previousFilterRow?.field?.fieldType === 'Picklist' &&
               (previousFilterRow?.operator?.value === 'CONTAINS' && updatedSelectedFilters[rowIndexAsNumber]?.operator?.value !== 'CONTAINS')
            || (previousFilterRow?.operator?.value !== 'CONTAINS' && updatedSelectedFilters[rowIndexAsNumber]?.operator?.value === 'CONTAINS'))
            || (updatedSelectedFilters[rowIndexAsNumber]?.field?.fieldType !== previousFilterRow?.field?.fieldType)
            || (field === 'field' && newValue?.picklist && newValue?.picklist !== previousFilterRow?.field?.picklist)
        ) {
            updatedSelectedFilters[rowIndexAsNumber] = {...updatedSelectedFilters[rowIndexAsNumber], 'value': ''};
        }

        setSelectedFilters(updatedSelectedFilters);
    };

    /**
     * When the selected object changes, clear the fields and re-load them for the new object.
     */
    useEffect(() => {
        setFieldOptions([]);
        setSelectedFields([]);
        setSelectedFilters([]);

        if (selectedObject?.value) {
            fetchObjectMetadata();
        }
    }, [selectedObject]);

    /**
     * Retrieve all Vault objects on page load
     */
    useEffect(() => {
        fetchVaultObjects();
    }, []);

    return {
        vaultObjects,
        vaultObjectsError,
        loadingVaultObjects,
        selectedObject,
        setSelectedObject,
        fieldOptions,
        fieldOptionsError,
        loadingObjectMetadata,
        selectedFields,
        setSelectedFields,
        selectedFilters,
        displayQueryBuilder,
        logicalOperator,
        setLogicalOperator,
        operatorOptions,
        booleanValueOptions,
        picklistValueOptions,
        handleSelectedFilterEdits,
        addNewFilterRow,
        removeFilterRow,
        toggleQueryBuilder,
        buildQuery,
        canBuildQuery,
    }
}