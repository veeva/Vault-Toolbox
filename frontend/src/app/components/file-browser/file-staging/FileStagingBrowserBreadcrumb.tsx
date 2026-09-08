import { FileUploadHiddenInput, FileUploadRootProvider, Flex, IconButton, type IconButtonProps, Input } from '@chakra-ui/react';
import { PiArrowClockwise, PiUpload, PiFolderSimplePlusLight, PiFolderPlus } from 'react-icons/pi';
import useFileStagingUpload, { MAX_FOLDER_UPLOAD_FILES } from '../../../hooks/file-browser/file-staging/useFileStagingUpload';
import { FileStagingItem, FileStagingTree } from '../../../utils/file-browser/FileBrowserHelper';
import { BreadcrumbLink, type BreadcrumbLinkProps, BreadcrumbRoot, type BreadcrumbRootProps } from '../../shared/ui-components/breadcrumb';
import { FileUploadTrigger } from '../../shared/ui-components/file-upload';
import { Toaster } from '../../shared/ui-components/toaster';
import { Tooltip } from '../../shared/ui-components/tooltip';
import FileStagingFileExistsDialog from './FileStagingFileExistsDialog';
import FileStagingFolderTooLargeDialog from './FileStagingFolderTooLargeDialog';
import FileStagingOverwriteUploadDialog from './FileStagingOverwriteUploadDialog';
import FolderUploadProgressModal from './FolderUploadProgressModal';

interface FileStagingBrowserBreadcrumbProps {
    fileStagingTree: FileStagingTree;
    handleFileStagingFolderClick: (folder: FileStagingItem | undefined) => void;
    selectedFileStagingFolder: FileStagingItem | null;
    handleReloadFileStagingTreeFolder: (path?: string) => void;
}

export default function FileStagingBrowserBreadcrumb({
    fileStagingTree,
    handleFileStagingFolderClick,
    selectedFileStagingFolder,
    handleReloadFileStagingTreeFolder,
}: FileStagingBrowserBreadcrumbProps) {
    const {
        createFileStagingFolderInputRef,
        creatingFileStagingFolder,
        setCreatingFileStagingFolder,
        newFileStagingFolderName,
        setNewFileStagingFolderName,
        fileUploadRootProviderAttributes,
        nativeFolderInputRef,
        handleNativeFolderInputChange,
        handleCreateFileStagingFolderInputKeyDown,
        isOverwritePromptOpen,
        pendingFolderFiles,
        confirmFolderUpload,
        closeOverwritePrompt,
        isFileExistsDialogOpen,
        pendingSingleFileUpload,
        confirmSingleFileOverwrite,
        closeFileExistsDialog,
        isFolderTooLargeDialogOpen,
        oversizedFolderFileCount,
        closeFolderTooLargeDialog,
        handleFolderInputCapture,
        folderUploadPhase,
        folderUploadProgress,
        folderUploadFailures,
        closeFolderUploadModal,
        cancelFolderUpload,
    } = useFileStagingUpload({
        handleReloadFileStagingTreeFolder,
        selectedFileStagingFolder,
        fileStagingTree,
    });

    return (
        <Flex width='100%' alignItems='center' justifyContent='space-between'>
            <BreadcrumbRoot {...BreadcrumbRootStyle}>
                <BreadcrumbLink
                    onClick={() => handleFileStagingFolderClick(fileStagingTree['/'])}
                    {...BreadcrumbLinkStyle}
                >
                    /
                </BreadcrumbLink>
                {renderBreadcrumbItems({ fileStagingTree, handleFileStagingFolderClick, selectedFileStagingFolder })}
                {creatingFileStagingFolder ? (
                    <Input
                        ref={createFileStagingFolderInputRef}
                        value={newFileStagingFolderName}
                        onChange={(e) => setNewFileStagingFolderName(e.target.value)}
                        onKeyDown={handleCreateFileStagingFolderInputKeyDown}
                        onBlur={() => setCreatingFileStagingFolder(false)} // Hide on blur
                        placeholder='Enter new folder name here'
                        size='sm'
                        width='200px'
                        marginLeft='10px'
                        borderColor='veeva_orange_color_mode'
                        boxShadow='none'
                    />
                ) : null}
            </BreadcrumbRoot>
            <Toaster />
            <Flex alignItems='center' marginRight='16px'>
                <Tooltip content='Create folder at current location' openDelay={0} positioning={{ placement: 'top' }}>
                    <IconButton {...IconButtonStyle} onClick={() => setCreatingFileStagingFolder(true)}>
                        <PiFolderSimplePlusLight size={20} style={{ margin: '4px' }} />
                    </IconButton>
                </Tooltip>
                <Tooltip content='Reload current directory' openDelay={0} positioning={{ placement: 'top' }}>
                    <IconButton
                        {...IconButtonStyle}
                        onClick={() => {
                            handleReloadFileStagingTreeFolder(selectedFileStagingFolder?.data?.path?.slice(1));
                        }}
                    >
                        <PiArrowClockwise size={20} style={{ margin: '4px' }} />
                    </IconButton>
                </Tooltip>
                <FileUploadRootProvider value={fileUploadRootProviderAttributes}>
                    <FileUploadHiddenInput />
                    <Tooltip
                        content='Upload file to current directory'
                        openDelay={0}
                        positioning={{ placement: 'top' }}
                    >
                        <FileUploadTrigger asChild>
                            <IconButton {...IconButtonStyle}>
                                <PiUpload size={20} style={{ margin: '4px' }} />
                            </IconButton>
                        </FileUploadTrigger>
                    </Tooltip>
                </FileUploadRootProvider>
                {/* Native input preserves webkitRelativePath so same-named files in different
                    subdirectories aren't de-duped, fixing the false FILE_EXISTS race on repeat uploads. */}
                <input
                    ref={nativeFolderInputRef}
                    type='file'
                    multiple
                    style={{ display: 'none' }}
                    onChangeCapture={handleFolderInputCapture}
                    onChange={handleNativeFolderInputChange}
                    {...({ webkitdirectory: '' } as Record<string, unknown>)}
                />
                <Tooltip
                    content={`Upload folder to current directory (up to ${MAX_FOLDER_UPLOAD_FILES.toLocaleString()} files)`}
                    openDelay={0}
                    positioning={{ placement: 'top' }}
                >
                    <IconButton {...IconButtonStyle} onClick={() => nativeFolderInputRef.current?.click()}>
                        <PiFolderPlus size={20} style={{ margin: '4px' }} />
                    </IconButton>
                </Tooltip>
            </Flex>
            <FileStagingOverwriteUploadDialog
                isOverwritePromptOpen={isOverwritePromptOpen}
                closeOverwritePrompt={closeOverwritePrompt}
                confirmFolderUpload={confirmFolderUpload}
                pendingFolderFileCount={pendingFolderFiles.length}
            />
            <FileStagingFileExistsDialog
                isFileExistsDialogOpen={isFileExistsDialogOpen}
                closeFileExistsDialog={closeFileExistsDialog}
                confirmSingleFileOverwrite={confirmSingleFileOverwrite}
                fileName={pendingSingleFileUpload?.fileName}
                existing={pendingSingleFileUpload?.existing}
                file={pendingSingleFileUpload?.file}
            />
            <FileStagingFolderTooLargeDialog
                isFolderTooLargeDialogOpen={isFolderTooLargeDialogOpen}
                closeFolderTooLargeDialog={closeFolderTooLargeDialog}
                oversizedFolderFileCount={oversizedFolderFileCount}
            />
            <FolderUploadProgressModal
                folderUploadPhase={folderUploadPhase}
                folderUploadProgress={folderUploadProgress}
                folderUploadFailures={folderUploadFailures}
                closeFolderUploadModal={closeFolderUploadModal}
                cancelFolderUpload={cancelFolderUpload}
            />
        </Flex>
    );
}

const renderBreadcrumbItems = ({
    fileStagingTree,
    handleFileStagingFolderClick,
    selectedFileStagingFolder,
}: {
    fileStagingTree: FileStagingTree;
    handleFileStagingFolderClick: (folder: FileStagingItem | undefined) => void;
    selectedFileStagingFolder: FileStagingItem | null;
}) => {
    const path = selectedFileStagingFolder?.data?.path;

    if (!path) {
        return null;
    }

    return path
        .split('/')
        .filter(Boolean)
        .map((folder, index, arr) => {
            const folderPath = `/${arr.slice(0, index + 1).join('/')}`;
            const folderData = fileStagingTree[folderPath];

            return (
                <BreadcrumbLink
                    key={folderPath}
                    onClick={() => handleFileStagingFolderClick(folderData)}
                    {...BreadcrumbLinkStyle}
                >
                    {folderData ? folderData.data?.name : folder}
                </BreadcrumbLink>
            );
        });
};

const IconButtonStyle: IconButtonProps = {
    variant: 'subtle',
    colorPalette: 'gray',
    borderRadius: '6px',
    margin: '5px',
    height: 'auto',
    minWidth: 'auto',
    px: '0',
};

const BreadcrumbRootStyle: BreadcrumbRootProps = {
    separator: '>',
    padding: '10px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
};

const BreadcrumbLinkStyle: BreadcrumbLinkProps = {
    fontWeight: 'bold',
    fontSize: 'lg',
    _hover: {
        color: 'yellow.300',
        textDecoration: 'underline',
        cursor: 'pointer',
    },
};
