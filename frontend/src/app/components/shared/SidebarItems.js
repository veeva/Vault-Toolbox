import { PiInfo, PiCodesandboxLogo, PiMagnifyingGlass, PiDatabase } from 'react-icons/pi';

const SidebarItems = [
    {
        name: 'Vault Information',
        icon: PiInfo,
        route: '/'
    },
    {
        name: 'Component Editor',
        icon: PiCodesandboxLogo,
        route: 'component-editor'
    },
    {
        name: 'VQL Editor',
        icon: PiMagnifyingGlass,
        route: 'vql'
    },
    {
        name: 'Vault Data Tools',
        icon: PiDatabase,
        route: 'vault-data-tools'
    }
];

export default SidebarItems;
