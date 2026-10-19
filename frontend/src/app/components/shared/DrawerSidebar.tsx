import {
    Box,
    Button,
    Input,
    InputProps,
    Separator,
    Flex,
    Image,
    Link,
    Spacer,
    Stack,
    Text,
    FlexProps,
    TextProps,
    ImageProps,
    ButtonProps,
} from '@chakra-ui/react';
import { PiSignOut, PiGear } from 'react-icons/pi';
import { Link as RouteLink } from 'react-router-dom';
import logo from '../../../images/veeva-logo.png';
import useToolSearch from '../../hooks/shared/useToolSearch';
import useFavoriteTools from '../../hooks/shared/useFavoriteTools';
import DrawerSidebarItem from './DrawerSidebarItem';
import { DrawerBackdrop, DrawerBody, DrawerContent, DrawerRoot } from './ui-components/drawer';
import { Tooltip } from './ui-components/tooltip';

interface DrawerSidebarProps {
    open: boolean;
    onClose: () => void;
    currentRoute: string;
    logout: () => void;
}

export default function DrawerSidebar({ open, onClose, currentRoute, logout }: DrawerSidebarProps) {
    const { alwaysShownTools, favoriteTools, remainingTools } = useFavoriteTools();
    const { userSearchInput, setUserSearchInput, filterTools } = useToolSearch();

    const visibleAlwaysShownTools = filterTools(alwaysShownTools);
    const visibleFavoriteTools = filterTools(favoriteTools);
    const visibleRemainingTools = filterTools(remainingTools);

    return (
        <DrawerRoot open={open} placement='start' onOpenChange={onClose}>
            <DrawerBackdrop />
            <DrawerContent maxWidth='max-content' backgroundColor='white_color_mode'>
                <DrawerBody paddingY={0} paddingX='10px'>
                    <Flex flexDirection='column' height='100%'>
                        <Flex {...DevToolsFlexStyle}>
                            <Image src={logo} {...ToolboxIconStyle} />
                            <Text {...DevToolsTextStyle}>Vault Tools</Text>
                        </Flex>
                        <Input
                            flexShrink={0}
                            {...SearchInputStyle}
                            value={userSearchInput}
                            onChange={(event) => setUserSearchInput(event.target.value)}
                            placeholder='Search tools...'
                        />
                        <Box minHeight='0' overflowY='auto'>
                            {visibleAlwaysShownTools.length > 0 && (
                                <Stack gap={0} marginTop={0}>
                                    {visibleAlwaysShownTools.map((tool) => (
                                        <DrawerSidebarItem
                                            key={tool.name}
                                            tool={tool}
                                            currentRoute={currentRoute}
                                            onClose={onClose}
                                        />
                                    ))}
                                </Stack>
                            )}
                            {visibleFavoriteTools.length > 0 && (
                                <Stack gap={0} marginTop={4}>
                                    <Text {...SectionHeaderStyle}>Favorites</Text>
                                    {visibleFavoriteTools.map((tool) => (
                                        <DrawerSidebarItem
                                            key={tool.name}
                                            tool={tool}
                                            currentRoute={currentRoute}
                                            onClose={onClose}
                                        />
                                    ))}
                                </Stack>
                            )}
                            {visibleRemainingTools.length > 0 && (
                                <Stack gap={0} marginTop={4}>
                                    <Text {...SectionHeaderStyle}>All Tools</Text>
                                    {visibleRemainingTools.map((tool) => (
                                        <DrawerSidebarItem
                                            key={tool.name}
                                            tool={tool}
                                            currentRoute={currentRoute}
                                            onClose={onClose}
                                        />
                                    ))}
                                </Stack>
                            )}
                        </Box>
                        <Spacer />
                        <Link
                            asChild
                            flexShrink={0}
                            onClick={onClose}
                            _hover={{ textDecoration: 'none' }}
                            focusRing='none'
                        >
                            <RouteLink to='/settings'>
                                <Tooltip content='Settings' openDelay={0} positioning={{ placement: 'right' }}>
                                    <Flex
                                        {...SettingsButtonStyle}
                                        borderColor={
                                            currentRoute === '/settings' ? 'veeva_orange_color_mode' : 'transparent'
                                        }
                                    >
                                        <PiGear style={{ width: 24, height: 24, transform: 'rotate(20deg)' }} />
                                        <Text marginLeft={4} fontSize='lg'>
                                            Settings
                                        </Text>
                                    </Flex>
                                </Tooltip>
                            </RouteLink>
                        </Link>
                        <Flex width='100%' paddingX='5px' flexShrink={0}>
                            <Separator
                                css={{
                                    width: '100%',
                                    borderColor: 'gray_background_color_mode',
                                    borderWidth: '0 0 1px 0',
                                }}
                            />
                        </Flex>
                        <Button {...LogoutBtnStyle} onClick={logout}>
                            <PiSignOut style={{ width: 24, height: 24 }} />
                            Logout
                        </Button>
                    </Flex>
                </DrawerBody>
            </DrawerContent>
        </DrawerRoot>
    );
}

/**
 * Height set to match corresponding icon on the collapsed sidebar
 */
const DevToolsFlexStyle: FlexProps = {
    width: '100%',
    height: '58px',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
};

const DevToolsTextStyle: TextProps = {
    fontSize: '2xl',
    fontWeight: 'bold',
    color: 'veeva_orange_color_mode',
};

const SearchInputStyle: InputProps = {
    size: 'sm',
    marginY: '5px',
    borderRadius: '8px',
    borderColor: 'light_gray_color_mode',
};

const SectionHeaderStyle: TextProps = {
    fontSize: 'sm',
    fontWeight: 'bold',
    color: 'gray.500',
    textTransform: 'uppercase',
    paddingX: '5px',
    paddingY: '5px',
};

const ToolboxIconStyle: ImageProps = {
    boxSize: '24px',
    alt: 'Vault Toolbox Icon',
    marginX: '5px',
};

const LogoutBtnStyle: ButtonProps = {
    fontSize: 'md',
    variant: 'subtle',
    height: '42px',
    flexShrink: 0,
    padding: '5px',
    marginX: 0,
    marginY: '10px',
    borderRadius: '10px',
    role: 'group',
    cursor: 'pointer',
    _hover: {
        backgroundColor: 'blue.400',
        color: 'white',
    },
};

const SettingsButtonStyle = {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '5px',
    marginY: '10px',
    marginX: 0,
    borderWidth: '3px',
    borderRadius: '10px',
    role: 'group',
    cursor: 'pointer',
    _hover: {
        bg: 'veeva_orange_color_mode',
        color: 'white',
    },
    borderColor: 'veeva_orange_color_mode',
    fontSize: 'md',
};
