import { Flex, Heading, InputGroup, InputLeftElement, Input, Button, ButtonGroup, Menu, MenuButton, MenuList, MenuItem, IconButton, Tooltip } from '@chakra-ui/react';
import { useState } from 'react';
import { PiMagnifyingGlass, PiCaretDownBold } from 'react-icons/pi';
import { isProductionVault } from '../../services/SharedServices';

export default function ComponentEditorHeaderRow({ setSelectedComponent, executeMdl, executeMdlAsync, retrieveMdlAsyncResults, asyncJobId, isExecutingMdl }) {
    const [userInputComponent, setUserInputComponent] = useState('');

    return (
        <Flex width='100%' margin='10px' alignItems='center'>
            <Heading {...HeadingStyle}>Component Editor</Heading>
            <InputGroup {...InputGroupStyle}>
                <InputLeftElement backgroundColor='transparent'>
                    <PiMagnifyingGlass size={24} />
                </InputLeftElement>
                <Input
                    boxShadow='0 0 5px rgba(0,0,0,0.25)'
                    backgroundColor='white.color_mode'
                    color='text.color_mode'
                    value={userInputComponent}
                    onChange={(event) => setUserInputComponent(event.currentTarget.value)}
                    placeholder='Componenttype.component_name__c'
                />
            </InputGroup>
            <Button
                isDisabled={!userInputComponent}
                onClick={() => { setSelectedComponent(userInputComponent); }}
                {...GetComponentButtonStyle}
            >
                Get
            </Button>
            <Tooltip placement='bottom-end' label={isProductionVault() ? 'Read-only in Production' : null}>
                <ButtonGroup isAttached isDisabled={isProductionVault()} {...ButtonGroupStyle}>
                    <Button onClick={executeMdl} isLoading={isExecutingMdl} {...ExecuteMdlButtonStyle}>
                        Send
                    </Button>
                    <Menu>
                        <MenuButton
                            as={IconButton}
                            icon={<PiCaretDownBold />}
                            {...ExecuteMdlMenuButtonStyle}
                        />
                        <MenuList>
                            <MenuItem 
                                {...AsyncMdlButtonStyle} 
                                onClick={executeMdlAsync}
                            >
                                Send MDL Script Asynchronously
                            </MenuItem>
                            <MenuItem 
                                {...AsyncMdlButtonStyle} 
                                onClick={retrieveMdlAsyncResults} 
                                isDisabled={!asyncJobId}
                            >
                                Retrieve Asynchronous MDL Script Results
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </ButtonGroup>
            </Tooltip>
        </Flex>
    );
}

const HeadingStyle = {
    color: 'veeva_orange.color_mode',
    minWidth: 'max-content',
    marginLeft: '25px',
    marginRight: '5px',
    fontSize: '2rem'
};

const InputGroupStyle = {
    borderColor: 'transparent',
    backgroundColor: 'veeva_light_gray.color_mode',
    marginX: '5px'
};

const GetComponentButtonStyle = {
    backgroundColor: 'veeva_twilight_blue.500',
    color: 'white',
    _hover: {
        backgroundColor: 'veeva_twilight_blue.fifty_percent_opacity'
    },
    marginRight: '5px',
    minWidth: '120px',
    boxShadow: '0 0 5px rgba(0,0,0,0.25)'
};

const ButtonGroupStyle = {
    colorScheme: 'veeva_sunset_red',
    borderRadius: '8px',
    marginRight: '10px',
    minWidth: '120px',
    boxShadow: '0 0 5px rgba(0,0,0,0.25)'
};

const ExecuteMdlButtonStyle = {
    backgroundColor: 'veeva_sunset_red.color_mode',
    color: 'white',
    _hover: {
        backgroundColor: 'veeva_sunset_red.fifty_percent_opacity'
    },
	_active: {
		backgroundColor: 'veeva_sunset_red.eighty_percent_opacity'
	},
    borderRightColor: 'white',
    borderRight: 'solid',
    borderRightWidth: 'thin',
    flex: 1
};

const ExecuteMdlMenuButtonStyle = {
    backgroundColor: 'veeva_sunset_red.color_mode',
    color: 'white',
    _hover: {
        backgroundColor: 'veeva_sunset_red.fifty_percent_opacity'
    },
    _active: {
        backgroundColor: 'veeva_sunset_red.eighty_percent_opacity'
    },
    minWidth: 8
}

const AsyncMdlButtonStyle = {
    fontSize: 'medium',
    _hover: {
        backgroundColor: 'veeva_sunset_red.color_mode',
        color: 'white'
    }
};
