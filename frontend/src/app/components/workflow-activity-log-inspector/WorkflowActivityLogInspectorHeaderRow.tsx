import { Flex, Heading, Spacer, ButtonProps, FlexProps, HeadingProps } from '@chakra-ui/react';
import { PiDownloadSimple, PiTrash, PiUploadSimple } from 'react-icons/pi';
import DownloadWorkflowActivityLogModal from './DownloadWorkflowActivityLogModal';
import WorkflowActivityLogInspectorHeaderActionButton from './WorkflowActivityLogInspectorHeaderActionButton';
import useWorkflowActivityLogInspectorHeaderRow from '../../hooks/workflow-activity-log-inspector/useWorkflowActivityLogInspectorHeaderRow';

interface WorkflowActivityLogInspectorHeaderRowProps {
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    fetchLogData: (date: string) => void;
    clearLogData: () => void;
    isLoading: boolean;
    isUploading: boolean;
    hasLogData: boolean;
}

export default function WorkflowActivityLogInspectorHeaderRow({
    selectedDate,
    setSelectedDate,
    fetchLogData,
    clearLogData,
    isLoading,
    isUploading,
    hasLogData,
}: WorkflowActivityLogInspectorHeaderRowProps) {
    const {
        headerContainerRef,
        isCompact,
        isDownloadModalOpen,
        openDownloadModal,
        closeDownloadModal,
        openFilePicker,
    } = useWorkflowActivityLogInspectorHeaderRow();

    return (
        <Flex ref={headerContainerRef} {...HeaderRowFlexStyle}>
            <Heading {...HeaderTitleStyle}>Workflow Activity Log Inspector</Heading>
            <Spacer />
            <Flex {...ActionButtonGroupStyle}>
                <WorkflowActivityLogInspectorHeaderActionButton
                    isCompact={isCompact}
                    label='Retrieve Log Data'
                    icon={PiDownloadSimple}
                    onClick={openDownloadModal}
                    loading={isLoading}
                    disabled={isLoading || isUploading}
                    buttonStyle={PrimaryActionButtonStyle}
                />
                <WorkflowActivityLogInspectorHeaderActionButton
                    isCompact={isCompact}
                    label='Upload Log Data'
                    icon={PiUploadSimple}
                    onClick={openFilePicker}
                    loading={isUploading}
                    disabled={isLoading || isUploading}
                    buttonStyle={PrimaryActionButtonStyle}
                />

                <WorkflowActivityLogInspectorHeaderActionButton
                    isCompact={isCompact}
                    label='Clear Data'
                    icon={PiTrash}
                    onClick={clearLogData}
                    disabled={isLoading || isUploading || !hasLogData}
                    buttonStyle={ClearActionButtonStyle}
                />
            </Flex>
            <DownloadWorkflowActivityLogModal
                open={isDownloadModalOpen}
                onClose={closeDownloadModal}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                onDownload={fetchLogData}
                isLoading={isLoading}
            />
        </Flex>
    );
}

const HeaderRowFlexStyle: FlexProps = {
    width: '100%',
    padding: '10px',
    alignItems: 'center',
    gap: 4,
};

const HeaderTitleStyle: HeadingProps = {
    fontSize: '2rem',
    color: 'veeva_orange_color_mode',
    marginLeft: '15px',
    marginRight: '5px',
    minWidth: 'max-content',
};

const ActionButtonGroupStyle: FlexProps = {
    align: 'center',
    gap: 3,
    flexShrink: 0,
};

const PrimaryActionButtonStyle: ButtonProps = {
    fontSize: 'lg',
    backgroundColor: 'veeva_twilight_blue.500',
    color: 'white',
    borderRadius: '8px',
    boxShadow: '0 0 5px rgba(0,0,0,0.25)',
    _hover: {
        backgroundColor: 'veeva_twilight_blue.fifty_percent_opacity',
    },
};

const ClearActionButtonStyle: ButtonProps = {
    fontSize: 'lg',
    variant: 'outline',
    color: 'veeva_sunset_red_color_mode',
    borderColor: 'veeva_sunset_red_color_mode',
    borderRadius: '8px',
    _hover: {
        backgroundColor: 'veeva_sunset_red.eighty_percent_opacity',
        color: 'white',
    },
};
