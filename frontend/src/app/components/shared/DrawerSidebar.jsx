import { Flex, Drawer, DrawerOverlay, DrawerContent, DrawerBody, Spacer, Image, Text, Stack, Button, Link } from '@chakra-ui/react';
import { PiSignOut } from 'react-icons/pi';
import { Link as RouteLink } from 'react-router-dom';
import SidebarItems from './SidebarItems';
import SidebarItem from './SidebarItem';
import logo from '../../../images/veeva-logo.png';

export default function DrawerSidebar({ isOpen, onClose, currentRoute, logout }) {
    return (
        <Drawer isOpen={isOpen} placement='left' onClose={onClose}>
            <DrawerOverlay />
            <DrawerContent maxWidth='max-content'>
                <DrawerBody paddingY={0} paddingX={'10px'}>
                    <Flex flexDirection='column' height='100%'>
                        {/* Wrap header text in empty Link so it gets Drawer focus onOpen
                            This prevents focus going to 1st sidebar item and triggering toolitp */}
                        <Link as={RouteLink} _hover={{ textDecoration: 'none' }}>
                            <Flex {...DevToolsFlexStyle}>
                                <Image src={logo} {...ToolboxIconStyle} />
                                <Text {...DevToolsTextStyle}>
                                    Developer Tools
                                </Text>
                            </Flex>
                        </Link>
                        <Stack spacing={0} marginTop={0}>
                            {
                                SidebarItems.map((tool) => (
                                    <SidebarItem key={tool.name} item={tool} currentRoute={currentRoute} onClose={onClose}>
                                        <Text marginLeft={4} fontSize='lg'>{tool.name}</Text>
                                    </SidebarItem>
                                ))
                            }
                        </Stack>
                        <Spacer />
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
    color: 'veeva_orange.500'
};

const ToolboxIconStyle = {
    boxSize: '24px',
    alt: 'Vault Developer Toolbox Icon',
    marginX: '5px'
};

const LogoutBtnStyle = {
    leftIcon: <PiSignOut size={24} />,
    align: 'center',
    height: '42px',
    padding: '5px',
    marginX: 0,
    marginBottom: '10px',
    borderRadius: '10px',
    role: 'group',
    cursor: 'pointer',
    _hover: {
        backgroundColor: 'blue.400',
        color: 'white'
    }
};
