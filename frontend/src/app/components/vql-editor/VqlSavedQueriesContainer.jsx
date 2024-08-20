import { IconButton, useDisclosure, Tooltip } from '@chakra-ui/react';
import { PiFloppyDisk } from 'react-icons/pi';
import useSavedQueries from '../../hooks/vql-editor/useSavedQueries';
import VqlSaveQueryModal from './VqlSaveQueryModal';
import VqlActionsMenu from './VqlActionsMenu';

export default function VqlSavedQueriesContainer ({ code, setCode }) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const {
        selectedQueryName,
        setSelectedQueryName,
        savedQueries,
        savedQueryOptions,
        handleSave,
        handleModalClose,
        insertSavedQuery,
        deleteSavedQuery
    } = useSavedQueries({ onClose, setCode })

    return (
        <>
            <Tooltip placement='left' label={savedQueries?.length < 20 ? 'Save Query' : 'Max saved queries reached (20)'}>
                <IconButton
                    onClick={onOpen}
                    isDisabled={savedQueries?.length >= 20}
                    icon={<PiFloppyDisk size={24} />}
                    {...SaveQueryButtonStyle}
                />
            </Tooltip>
            <VqlActionsMenu
                savedQueryOptions={savedQueryOptions}
                insertSavedQuery={insertSavedQuery}
                deleteSavedQuery={deleteSavedQuery}
                selectedQueryName={selectedQueryName}
                setSelectedQueryName={setSelectedQueryName}
            />
            { isOpen ?
                <VqlSaveQueryModal
                    code={code}
                    isOpen={isOpen}
                    handleModalClose={handleModalClose}
                    handleSave={handleSave}
                    selectedQueryName={selectedQueryName}
                    setSelectedQueryName={setSelectedQueryName}
                    savedQueryOptions={savedQueryOptions}
                    savedQueries={savedQueries}
                />
                : null
            }
        </>
        
    )
}

const SaveQueryButtonStyle = {
    variant: 'ghost',
    size: 'sm',
    colorScheme: 'blue',
    _hover: {
        backgroundColor: 'blue.400',
        color: 'white'
    },
    margin: '10px',
    padding: '5px'
};
