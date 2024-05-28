import { Divider, Flex, IconButton, Spacer, Tooltip, useColorMode } from '@chakra-ui/react';
import { PiListBold, PiMoon, PiSignOut, PiSun } from 'react-icons/pi';
import SidebarItems from './SidebarItems';
import SidebarItem from './SidebarItem'

export default function CollapsedSidebar({ onOpen, onClose, currentRoute, logout }) {
    const { colorMode, toggleColorMode } = useColorMode()
    return (
        <Flex {...CollapsedSidebarFlexStyle}>
            <IconButton onClick={onOpen} icon={<PiListBold size={38} style={{ margin: '10px' }} />} {...ExpandSidebarButtonStyle} />
            {
                SidebarItems.map((tool) => (
                    <SidebarItem key={tool.name} item={tool} currentRoute={currentRoute} onClose={onClose} />
                ))
            }
            <Spacer />
            <Tooltip placement='right' label={colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}>
                <IconButton
                    onClick={toggleColorMode}
                    icon={colorMode === 'light' ? <PiMoon size={24}/> : <PiSun size={24}/>}
                    {...ColorModeButtonStyle}
                />
            </Tooltip>
            <Divider />
            <Tooltip placement='right' label='Logout'>
                <IconButton onClick={logout} icon={<PiSignOut size={24} />} {...LogoutIconButtonStyle} />
            </Tooltip> 
        </Flex> 
    );
}

const CollapsedSidebarFlexStyle = {
    flexDirection: 'column',
    height: '100%',
    width: 'auto',
    alignItems: 'center'
};

const ExpandSidebarButtonStyle = {
    width: '100%',
    height: 'auto',
    backgroundColor: 'transparent',
    borderRadius: 0
};

const ColorModeButtonStyle = {
    backgroundColor: 'transparent',
    height: '42px',
    width: '42px',
    padding: '5px',
    margin: '10px',
    borderRadius: '10px'
}

const LogoutIconButtonStyle = {
    backgroundColor: 'white.color_mode',
    _hover: {
        backgroundColor: 'blue.400',
        color: 'white'
    },
    height: '42px',
    width: '42px',
    padding: '5px',
    margin: '10px',
    borderRadius: '10px'
};