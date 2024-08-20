import { Button, Divider, Drawer, DrawerBody, DrawerContent, DrawerOverlay, Flex, Image, Link, Spacer, Stack, Text, Tooltip, useColorMode } from '@chakra-ui/react';
import { PiMoon, PiSignOut, PiSun } from 'react-icons/pi';
import { Link as RouteLink } from 'react-router-dom';
import logo from '../../../images/veeva-logo.png';
import SidebarItem from './SidebarItem';
import SidebarItems from './SidebarItems';

export default function DrawerSidebar({isOpen, onClose, currentRoute, logout}) {
    const {colorMode, toggleColorMode} = useColorMode();
    return (
        <Drawer isOpen={isOpen} placement='left' onClose={onClose}>
            <DrawerOverlay/>
            <DrawerContent maxWidth='max-content' backgroundColor={'white.color_mode'}>
                <DrawerBody paddingY={0} paddingX={'10px'}>
                    <Flex flexDirection='column' height='100%'>
                        {/* Wrap header text in empty Link so it gets Drawer focus onOpen
                            This prevents focus going to 1st sidebar item and triggering toolitp */}
                        <Link as={RouteLink} _hover={{textDecoration: 'none'}}>
                            <Flex {...DevToolsFlexStyle}>
                                <Image src={logo} {...ToolboxIconStyle} />
                                <Text {...DevToolsTextStyle}>
                                    Vault Tools
                                </Text>
                            </Flex>
                        </Link>
                        <Stack spacing={0} marginTop={0}>
                            {
                                SidebarItems.map((tool) => (
                                    <SidebarItem key={tool.name} item={tool} currentRoute={currentRoute}
                                                 onClose={onClose}>
                                        <Text marginLeft={4} fontSize='lg'>{tool.name}</Text>
                                    </SidebarItem>
                                ))
                            }
                        </Stack>
                        <Spacer/>
                        <Tooltip placement='right' label={colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}>
                            <Button
                                {...ColorModeButtonStyle}
                                onClick={toggleColorMode}
                                leftIcon={colorMode === 'light' ? <PiMoon size={24}/> : <PiSun size={24}/>}
                            >
                                {colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}
                            </Button>
                        </Tooltip>
                        <Divider/>
                        <Button {...LogoutBtnStyle} onClick={logout}>
                            Logout
                        </Button>
                    </Flex>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    );
}

/**
 * Height set to match corresponding icon on the collapsed sidebar
 */
const DevToolsFlexStyle = {
    height: '58px',
    alignItems: 'center',
    justifyContent: 'center'
};

const DevToolsTextStyle = {
    fontSize: '2xl',
    fontWeight: 'bold',
    color: 'veeva_orange.color_mode'
};

const ToolboxIconStyle = {
    boxSize: '24px',
    alt: 'Vault Toolbox Icon',
    marginX: '5px'
};

const ColorModeButtonStyle = {
    backgroundColor: 'transparent',
    align: 'center',
    height: '42px',
    padding: '5px',
    marginX: 0,
    marginBottom: '10px',
    borderRadius: '10px',
}

const LogoutBtnStyle = {
    leftIcon: <PiSignOut size={24}/>,
    align: 'center',
    height: '42px',
    padding: '5px',
    marginX: 0,
    marginY: '10px',
    borderRadius: '10px',
    role: 'group',
    cursor: 'pointer',
    _hover: {
        backgroundColor: 'blue.400',
        color: 'white'
    }
};
