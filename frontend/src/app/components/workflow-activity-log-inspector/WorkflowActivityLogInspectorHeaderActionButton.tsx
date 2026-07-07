import { Button, IconButton, ButtonProps } from '@chakra-ui/react';
import { IconType } from 'react-icons';
import { Tooltip } from '../shared/ui-components/tooltip';

interface WorkflowActivityLogInspectorHeaderActionButtonProps {
    isCompact: boolean;
    label: string;
    icon: IconType;
    onClick: () => void;
    buttonStyle: ButtonProps;
    loading?: boolean;
    disabled?: boolean;
}

/**
 * A header action that renders as a labeled button, and collapses to an icon-only
 * button with a hover tooltip when the header is too narrow for full-width buttons.
 */
export default function WorkflowActivityLogInspectorHeaderActionButton({
    isCompact,
    label,
    icon: ActionIcon,
    onClick,
    buttonStyle,
    loading,
    disabled,
}: WorkflowActivityLogInspectorHeaderActionButtonProps) {
    if (isCompact) {
        return (
            <Tooltip content={label} openDelay={0} positioning={{ placement: 'bottom' }}>
                <IconButton aria-label={label} onClick={onClick} loading={loading} disabled={disabled} {...buttonStyle}>
                    <ActionIcon />
                </IconButton>
            </Tooltip>
        );
    }

    return (
        <Button onClick={onClick} loading={loading} disabled={disabled} {...buttonStyle}>
            <ActionIcon style={{ marginRight: '5px' }} />
            {label}
        </Button>
    );
}
