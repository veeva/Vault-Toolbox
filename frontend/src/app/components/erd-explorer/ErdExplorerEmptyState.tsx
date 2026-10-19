import { Flex, FlexProps, StackProps, Text, TextProps, VStack, useFileUploadContext } from '@chakra-ui/react';

/** Blank-canvas prompt shown before the user has placed any objects. */
export default function ErdExplorerEmptyState() {
    const { openFilePicker, setClipboardFiles } = useFileUploadContext();

    return (
        <Flex {...EmptyStateWrapperStyle}>
            <VStack
                {...DropzoneStyle}
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
                <Text {...DropzoneHeadingStyle}>No objects selected to display.</Text>
                <Text color='gray.500' fontSize='sm' textAlign='center'>
                    Add objects from the side menu, or drag and drop an existing JSON project file here.
                </Text>
            </VStack>
        </Flex>
    );
}

const EmptyStateWrapperStyle: FlexProps = {
    height: '100%',
    width: '100%',
    align: 'center',
    justify: 'center',
};

const DropzoneStyle: StackProps = {
    width: '50%',
    height: '50%',
    border: '2px dashed',
    borderColor: 'gray.300',
    borderRadius: '8px',
    justify: 'center',
    gap: 4,
    pointerEvents: 'auto',
    cursor: 'pointer',
    _hover: { borderColor: 'veeva_orange_color_mode', backgroundColor: 'beige_color_mode' },
    transition: 'all 0.2s',
};

const DropzoneHeadingStyle: TextProps = {
    color: 'veeva_dark_gray_text_color_mode',
    fontSize: 'lg',
    fontWeight: 'bold',
};
