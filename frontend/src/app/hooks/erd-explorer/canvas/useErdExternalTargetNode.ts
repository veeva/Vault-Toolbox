import type { IconType } from 'react-icons';
import { PiFileText, PiUsers, PiUsersThree } from 'react-icons/pi';
import {
    DOCUMENTS_TARGET,
    EXTERNAL_TARGET_LABELS,
    USERS_TARGET,
    type ErdHighlightDirection,
} from '../../../utils/erd-explorer/ErdExplorerTypes';
import { useErdNodeBorder } from './useErdNodeBorder';

const EXTERNAL_TARGET_ICONS: Record<string, IconType> = {
    [DOCUMENTS_TARGET]: PiFileText,
    [USERS_TARGET]: PiUsers,
};

interface UseErdExternalTargetNodeArgs {
    target: string;
    selected?: boolean;
    highlight?: ErdHighlightDirection;
}

/** Derives ExternalTargetNode's icon, label, and border styling so the component stays presentation-only. */
export function useErdExternalTargetNode({ target, selected, highlight }: UseErdExternalTargetNodeArgs) {
    const { borderColor, borderWidth } = useErdNodeBorder({
        selected,
        highlight,
        restingBorderColor: 'veeva_twilight_blue.500',
    });

    return {
        Icon: EXTERNAL_TARGET_ICONS[target] ?? PiUsersThree,
        label: EXTERNAL_TARGET_LABELS[target] ?? target,
        borderColor,
        borderWidth,
    };
}
