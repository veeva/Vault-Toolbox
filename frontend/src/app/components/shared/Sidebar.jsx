import { useDisclosure } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import DrawerSidebar from './DrawerSidebar';
import CollapsedSidebar from './CollapsedSidebar';
import useLogout from '../../hooks/shared/useLogout';

export default function Sidebar() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const logout = useLogout();

    const location = useLocation();
    const currentRoute = location.pathname;

    return (
        <>
            { isOpen
                && <DrawerSidebar isOpen={isOpen} onClose={onClose} currentRoute={currentRoute} logout={logout} />}
            <CollapsedSidebar onOpen={onOpen} onClose={onClose} currentRoute={currentRoute} logout={logout} />
        </>
    );
}
