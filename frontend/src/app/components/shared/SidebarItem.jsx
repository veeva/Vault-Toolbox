import { Tooltip, Flex, Link, Icon } from '@chakra-ui/react';
import { Link as RouteLink } from 'react-router-dom';

export default function SidebarItem({ item, currentRoute, children, onClose }) {
    let thisItemsRoute = item.route;
    if (item.route !== '/') {
        thisItemsRoute = `/${item.route}`;
    }

    return (
        <Tooltip label={item.name} placement='right'>
            <Link as={RouteLink} to={item.route} onClick={onClose} _hover={{ textDecoration: 'none' }}>
                <Flex {...SidebarItemStyle} borderColor={thisItemsRoute === currentRoute ? 'veeva_orange.500' : 'transparent'}>
                    {item.icon && (
                        <Icon {...IconStyle} as={item.icon} />
                    )}
                    {children}
                </Flex>
            </Link>
        </Tooltip>
    );
}

const SidebarItemStyle = {
    justifyContent: 'left',
    alignItems: 'center',
    padding: '5px',
    marginY: '10px',
    marginX: 0,
    borderWidth: '3px',
    borderRadius: '10px',
    role: 'group',
    cursor: 'pointer',
    _hover: {
        bg: 'veeva_orange.500',
        color: 'white'
    },
    borderColor: 'veeva_orange.500',
    fontSize: 'md'
};

const IconStyle = {
    boxSize: 8,
    _hover: { color: 'white' }
};
