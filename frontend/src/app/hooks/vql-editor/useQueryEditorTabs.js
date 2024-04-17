import { useState } from 'react';

export default function useQueryEditorTabs({ consoleOutput, setConsoleOutput }) {
    const [queryEditorTabs, setQueryEditorTabs] = useState(['Query']);
    const [queryEditorTabIndex, setQueryEditorTabIndex] = useState(0);

    /**
     * Switches to the VQL query tab at the provided index.
     */
    const handleQueryEditorTabChange = (index) => {
        setQueryEditorTabIndex(index);
    };

    /**
     * Adds a VQL query tab for the provided subquery.
     */
    const addQueryTab = (subqueryObject) => {
        // Add the new tab and set it as the current tab
        setQueryEditorTabs([...queryEditorTabs, 'Subquery']);
        setQueryEditorTabIndex(queryEditorTabs.length);

        setConsoleOutput([...consoleOutput, subqueryObject]);
    };

    /**
     * Removes the provided VQL query tab.
     */
    const removeTab = (index) => {
        setQueryEditorTabs((previousTabs) => previousTabs.filter((_, i) => i !== index));
        setQueryEditorTabIndex(index - 1);
    };

    return { queryEditorTabs, queryEditorTabIndex }
}
