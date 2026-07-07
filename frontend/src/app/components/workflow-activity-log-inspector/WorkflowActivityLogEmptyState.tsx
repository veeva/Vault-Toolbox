import { Flex, FlexProps, StackProps, Text, TextProps, VStack, useFileUploadContext } from '@chakra-ui/react';

/**
 * Empty-state prompt shown in either tab when no log data is loaded; opens the file picker
 * on click and accepts dropped CSV/ZIP files via the shared FileUpload context.
 */
export default function WorkflowActivityLogEmptyState() {
    const { openFilePicker, setClipboardFiles } = useFileUploadContext();

    return (
        <Flex {...EmptyStateWrapperStyle}>
            <VStack
                {...DropzonePromptStyle}
                onClick={openFilePicker}
                onDragOver={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                }}
                onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setClipboardFiles(event.dataTransfer);
                }}
            >
                <Text {...DropzonePromptHeadingStyle}>No logs to display. Please add log data.</Text>
                <Text color='gray.500' fontSize='sm'>
                    Drag and drop CSV files here, or click to browse.
                </Text>
            </VStack>
        </Flex>
    );
}

const EmptyStateWrapperStyle: FlexProps = {
    height: '100%',
    align: 'center',
    justify: 'center',
};

const DropzonePromptStyle: StackProps = {
    width: '50%',
    height: '50%',
    border: '2px dashed',
    borderColor: 'gray.300',
    borderRadius: '8px',
    justify: 'center',
    gap: 4,
    _hover: { borderColor: 'veeva_orange_color_mode', backgroundColor: 'beige_color_mode' },
    transition: 'all 0.2s',
    cursor: 'pointer',
};

const DropzonePromptHeadingStyle: TextProps = {
    color: 'veeva_dark_gray_text_color_mode',
    fontSize: 'lg',
    fontWeight: 'bold',
};
