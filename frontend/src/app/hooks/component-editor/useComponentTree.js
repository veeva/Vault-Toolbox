import { useState, useEffect } from 'react';
import { query, queryByPage, retrieveAllComponentMetadata } from '../../services/ApiService';

export default function useComponentTree() {
    const [componentTree, setComponentTree] = useState([]);
    const [componentTreeError, setComponentTreeError] = useState('');
    const [loadingComponentTree, setLoadingComponentTree] = useState(false);

    /**
     * Calls the Vault REST API to build the component tree
     */
    const retrieveComponentTree = async () => {
        setLoadingComponentTree(true);
        setComponentTreeError('');

        const tmpComponentTree = {
            root: {
                index: 'root',
                data: 'root',
                isFolder: true,
                children: new Array()
            }
        };

        const allComponentMetadata = await retrieveAllComponentMetadata();
        if (allComponentMetadata?.responseStatus === 'FAILURE') {
            let error = '';
            if (allComponentMetadata?.errors?.length > 0) {
                error = `${allComponentMetadata.errors[0].type} : ${allComponentMetadata.errors[0].message}`
            }
            setComponentTreeError(error);
            return;
        }

        const queryString = 'SELECT label__v,component_name__v, component_type__v, status__v FROM vault_component__v';
        let queryResponse = await query(queryString);
        if (queryResponse?.responseStatus === 'FAILURE') {
            let error = '';
            if (queryResponse?.errors?.length > 0) {
                error = `${queryResponse.errors[0].type} : ${queryResponse.errors[0].message}`
            }
            setComponentTreeError(error);
            return;
        }

        // If we have response data, use it to build the component tree. This includes paginating through the results.
        if (queryResponse.data) {
            buildComponentTree(queryResponse, tmpComponentTree, allComponentMetadata);

            let next_page = queryResponse?.responseDetails?.next_page;
            while (next_page) {
                queryResponse = await queryByPage(next_page);
                if (queryResponse?.responseStatus === 'FAILURE') {
                    let error = '';
                    if (queryResponse?.errors?.length > 0) {
                        error = `${queryResponse.errors[0].type} : ${queryResponse.errors[0].message}`
                    }
                    setComponentTreeError(error);
                }

                if (queryResponse.data) {
                    buildComponentTree(queryResponse, tmpComponentTree, allComponentMetadata);
                }
                next_page = queryResponse?.responseDetails?.next_page;
            }
        }

        setLoadingComponentTree(false);

        // Sort Component Type and Component Record alphabetically
        Object.values(tmpComponentTree).forEach((object) => {
            object?.children.sort((a, b) => {
                const titleA = tmpComponentTree[a].title.toUpperCase();
                const titleB = tmpComponentTree[b].title.toUpperCase();
                if (titleA < titleB) {
                    return -1;
                }
                if (titleA > titleB) {
                    return 1;
                }
                return 0;
            });
        });

        sessionStorage.setItem('componentTree', JSON.stringify(tmpComponentTree));
        setComponentTree([JSON.parse(sessionStorage.getItem('componentTree'))]);
    };

    /**
     * Helper for building the component tree
     * @param {Object} queryResponse 
     * @param {Object} tmpComponentTree 
     * @param {Object} allComponentMetadata 
     */
    const buildComponentTree = (queryResponse, tmpComponentTree, allComponentMetadata) => {
        queryResponse.data.map((dataRow) => {
            const componentType = dataRow?.component_type__v;
            const componentTypeStatus = dataRow?.status__v?.length > 0 && dataRow.status__v[0];

            // Exclude legacy workflows (their MDL can't be retrieved)
            if (componentType === 'Workflow') { return null }

            if (componentTypeStatus !== 'inactive__v') {
                // If this component type isn't already in the tree, add it
                const componentTypeIsInTree = tmpComponentTree.hasOwnProperty(componentType);
                let isCode = false;
                if (!componentTypeIsInTree) {
                    let componentTypeLabel = componentType;
                    if (allComponentMetadata && allComponentMetadata.data) {
                        allComponentMetadata.data.map((componentTypeObject) => {
                            if ((componentTypeObject?.name === componentType) && componentTypeObject.label) {
                                componentTypeLabel = `${componentTypeObject?.label} (${componentTypeObject?.name})`;

                                if (componentTypeObject?.class === 'code') { isCode = true; }
                            }
                        });
                    }

                    // Exclude code components for 24R1
                    if (isCode) { return null }

                    const newComponentType = {
                        index: componentType,
                        title: componentTypeLabel,
                        data: componentTypeLabel,
                        isFolder: true,
                        isCode,
                        children: new Array()
                    };

                    tmpComponentTree[componentType] = newComponentType;
                    tmpComponentTree.root.children.push(componentType);
                }

                // Add this component to its component type
                const componentRecordName = `${dataRow?.component_name__v}`;
                const componentLabel = dataRow?.label__v ? `${dataRow?.label__v} (${componentRecordName})` : componentRecordName;
                const componentKey = `${componentType}.${componentRecordName}`;

                const newComponentRecord = {
                    index: componentKey,
                    title: componentLabel,
                    data: componentLabel,
                    isFolder: false,
                    children: new Array()
                };

                tmpComponentTree[componentType].children.push(newComponentRecord.index);
                tmpComponentTree[newComponentRecord.index] = newComponentRecord;
            }
        });
    };

    /**
     * Load the component tree, either from session storage or call the API to build it
     */
    useEffect(() => {
        if (componentTree.length === 0) {
            if (sessionStorage.getItem('componentTree') === null || sessionStorage.getItem('componentTree') === 'undefined') {
                retrieveComponentTree();
            } else {
                setComponentTree([JSON.parse(sessionStorage.getItem('componentTree'))]);
            }
        }
    }, [componentTree]);

    return {
        componentTree,
        componentTreeError,
        retrieveComponentTree,
        loadingComponentTree
    }
}