import { IconType } from 'react-icons';
import {
    PiInfo,
    PiCodesandboxLogo,
    PiMagnifyingGlass,
    PiDatabase,
    PiFolder,
    PiCompass,
    PiTreeStructure,
} from 'react-icons/pi';

export interface SidebarItem {
    name: string;
    icon: IconType;
    route: string;
    pageId?: string;
    alwaysShow?: boolean;
}

const SidebarItems: SidebarItem[] = [
    {
        name: 'Vault Information',
        icon: PiInfo,
        route: '/',
        alwaysShow: true, // Home page is always shown, regardless of settings
    },
    {
        name: 'Component Editor',
        icon: PiCodesandboxLogo,
        route: 'component-editor',
        pageId: 'componentEditor',
    },
    {
        name: 'VQL Editor',
        icon: PiMagnifyingGlass,
        route: 'vql-editor',
        pageId: 'vqlEditor',
    },
    {
        name: 'Data Tools',
        icon: PiDatabase,
        route: 'data-tools',
        pageId: 'dataTools',
    },
    {
        name: 'File Browser',
        icon: PiFolder,
        route: 'file-browser',
        pageId: 'fileBrowser',
    },
    {
        name: 'Data Navigator',
        icon: PiCompass,
        route: 'data-navigator',
        pageId: 'dataNavigator',
    },
    {
        name: 'Workflow Activity Log Inspector',
        icon: PiTreeStructure,
        route: 'workflow-activity-log-inspector',
        pageId: 'workflowActivityLogInspector',
    },
];

export default SidebarItems;
