import { useEffect, useState } from 'react';

export default function useSavedQueries({ onClose, setCode }) {
    const [selectedQueryName, setSelectedQueryName] = useState('');
    const [savedQueries, setSavedQueries] = useState([]);
    const [savedQueryOptions, setSavedQueryOptions] = useState([]);

    /**
     * Handles closing the save query modal.
     */
    const handleModalClose = () => {
        setSelectedQueryName('');
        onClose();
    }

    /**
     * Handles saving the current query.
     */
    const handleSave = async (code) => {
        const currentSavedQueries = JSON.parse(localStorage.getItem('savedQueries')) || [];

        const selectedQueryIndex = currentSavedQueries.findIndex(savedQuery => savedQuery.name === selectedQueryName?.label);
        if (selectedQueryIndex === -1) {
            currentSavedQueries.push({
                name: selectedQueryName?.label,
                queryString: code
            })
        } else {
            currentSavedQueries[selectedQueryIndex] = {
                name: selectedQueryName?.label,
                queryString: code
            }
        }

        await localStorage.setItem('savedQueries', JSON.stringify(currentSavedQueries));
        setSavedQueries(currentSavedQueries);
        handleModalClose();
    }

    const deleteSavedQuery = async () => {
        const currentSavedQueries = JSON.parse(localStorage.getItem('savedQueries')) || [];
        const updatedSavedQueries = currentSavedQueries.filter(savedQuery => savedQuery?.name !== selectedQueryName);

        await localStorage.setItem('savedQueries', JSON.stringify(updatedSavedQueries));
        setSavedQueries(updatedSavedQueries);
    }

    /**
     * Helper function to keep the selectable options when saving a query in-sync with the currently saved queries.
     */
    const updateSavedQueryOptions = () => {
        const currentSavedQueryOptions = [];
        savedQueries?.forEach((savedQuery) => {
            currentSavedQueryOptions.push(createSavedQueryOption(savedQuery));
        })
        setSavedQueryOptions(currentSavedQueryOptions);
    }

    /**
     * Helper function to generate selectable options for react-select
     * @param savedQuery
     * @returns {{label: String, value: String}}
     */
    const createSavedQueryOption = (savedQuery) => {
        return {
            value: savedQuery?.name,
            label: savedQuery?.name,
        }
    }

    /**
     * Loads a saved query into the query editor
     * @param savedQuery - name of the saved query to load
     */
    const insertSavedQuery = (savedQuery) => {
        savedQueries.map((query) => {
            if (query.name === savedQuery) {
                setCode(query?.queryString);
            }
        })
    }

    /**
     * Read in the saved queries from local storage on page load
     */
    useEffect(() => {
        const currentSavedQueries = JSON.parse(localStorage.getItem('savedQueries')) || [];
        setSavedQueries(currentSavedQueries);
    }, []);

    /**
     * Whenever the saved queries update, also update the selectable query options for the drop-down
     */
    useEffect(() => {
        updateSavedQueryOptions();
    }, [savedQueries]);

    return {
        selectedQueryName,
        setSelectedQueryName,
        savedQueries,
        savedQueryOptions,
        handleSave,
        handleModalClose,
        insertSavedQuery,
        deleteSavedQuery,
    }
}