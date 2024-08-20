/* eslint-disable no-undef */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex, Box, FormControl, FormLabel, Input, Stack, Button, Tabs, Tab, TabList, TabPanels, TabPanel, FormErrorMessage, ButtonGroup, useColorMode } from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';
import SavedVaultsPopover from './SavedVaultsPopover';
import useVaultLoginForm from '../../hooks/login/useVaultLoginForm';
import useSavedVaultData from '../../hooks/login/useSavedVaultData';

export default function LoginCard() {
    const { sessionId, setSessionId } = useAuth();
    const navigate = useNavigate();
    const { colorMode } = useColorMode();

    const {
        loading,
        error,
        userName,
        setUserName,
        password,
        setPassword,
        loginSessionId,
        setLoginSessionId,
        vaultDNS,
        setVaultDNS,
        canSubmit,
        handleSubmit,
        handleAuthTypeChange,
        setFocusToPasswordInput,
        setFocusToUsernameInput,
        passwordRef,
        usernameRef,
        sessionIdRef,
        loginButtonRef,
        handleKeyDown
    } = useVaultLoginForm({ setSessionId });

    const { savedVaultData, setSavedVaultData } = useSavedVaultData({ setUserName, setVaultDNS, setFocusToPasswordInput, setFocusToUsernameInput })

    /**
     * If sessionId is populated, re-route to home page, since auth was successful.
     */
    useEffect(() => {
        if (sessionId) {
            navigate('/');
        }
    }, [sessionId]);

    return (
        <Box {...LoginCardBoxStyle}>
            <Stack spacing={4}>
                <FormControl id='dns' isRequired>
                    <FormLabel>Vault DNS</FormLabel>
                    <Flex>
                        <ButtonGroup isAttached colorScheme='gray' width='100%'>
                            <Input type='dns' value={vaultDNS} onChange={(event) => setVaultDNS(event.currentTarget.value.trim())} />
                            <SavedVaultsPopover
                                setVaultDNS={setVaultDNS}
                                setUsername={setUserName}
                                setFocusToPasswordInput={setFocusToPasswordInput}
                                savedVaultData={savedVaultData}
                                setSavedVaultData={setSavedVaultData}
                            />
                        </ButtonGroup>
                    </Flex>
                </FormControl>
                <Tabs isFitted variant='enclosed' onChange={(index) => handleAuthTypeChange(index)}>
                    <TabList>
                        <Tab {...TabStyle}>
                            Basic
                        </Tab>
                        <Tab {...TabStyle}>
                            Session
                        </Tab>
                    </TabList>
                    <Flex minH='14vh'>
                        <TabPanels>
                            <TabPanel>
                                <FormControl id='username' isRequired isInvalid={error.hasError}>
                                    <FormLabel>User Name</FormLabel>
                                    <Input 
                                        type='email' 
                                        value={userName} 
                                        onChange={(event) => setUserName(event.currentTarget.value.trim())} 
                                        ref={usernameRef} 
                                        onKeyDown={handleKeyDown}
                                    />
                                </FormControl>
                                <FormControl id='password' isRequired isInvalid={error.hasError} marginTop='8px'>
                                    <FormLabel>Password</FormLabel>
                                    <Input
                                        type='password'
                                        value={password} 
                                        onChange={(event) => setPassword(event.currentTarget.value)} 
                                        ref={passwordRef} 
                                        onKeyDown={handleKeyDown}
                                    />
                                    <FormErrorMessage>{error.errorMessage}</FormErrorMessage>
                                </FormControl>
                            </TabPanel>
                            <TabPanel>
                                <FormControl id='session' isRequired isInvalid={error.hasError}>
                                    <FormLabel>Session Id</FormLabel>
                                    <Input 
                                        type='session' 
                                        value={loginSessionId} 
                                        onChange={(event) => setLoginSessionId(event.currentTarget.value)} 
                                        ref={sessionIdRef}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <FormErrorMessage>{error.errorMessage}</FormErrorMessage>
                                </FormControl>
                            </TabPanel>
                        </TabPanels>
                    </Flex>
                </Tabs>
                <Stack spacing={10}>
                    <Button
                        {...ButtonStyle}
                        isDisabled={!canSubmit()}
                        isLoading={loading}
                        onClick={handleSubmit}
                        ref={loginButtonRef}
                    >
                        Log In
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}

const TabStyle = {
    _selected: {
        backgroundColor: 'gray.background.color_mode',
        fontWeight: 'bold'
    },
}

const LoginCardBoxStyle = {
    minWidth: '500px',
    borderRadius: '8px',
    backgroundColor: 'white.color_mode',
    boxShadow: '0 0 5px rgba(0,0,0,0.2)',
    padding: 8
};

const ButtonStyle = {
    backgroundColor: 'blue.400',
    color: 'white',
    _hover: { bg: 'blue.500' },
    loadingText: 'Authenticating'
};
