import { useState, useRef } from 'react';
import { login } from '../../services/ApiService';

export default function useVaultLoginForm({ setSessionId }) {
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [vaultDNS, setVaultDNS] = useState('');
    const [loginSessionId, setLoginSessionId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState({ hasError: false, errorMessage: '' });

    const passwordRef = useRef(null);
    const usernameRef = useRef(null);
    const sessionIdRef = useRef(null);
    const loginButtonRef = useRef(null);

    /**
     * Determines if current inputs are valid for authentication.
     * Must have VaultDNS and either (username + password) or sessionId.
     * @returns true if inputs are valid, otherwise false
     */
    const canSubmit = () => {
        if (!vaultDNS) {
            return false;
        }
        if (!loginSessionId && (!userName || !password)) {
            return false;
        }
        if (!userName && !password && !loginSessionId) {
            return false;
        }
        return true;
    };

    /**
     * Authenticates with Vault when the login form is submitted.
     */
    const handleSubmit = async () => {
        setError({ hasError: false, errorMessage: '' });
        const cleanVaultDNS = vaultDNS.replace(/^https?:\/\// ,'') // Remove http(s)://
        const params = {
            userName,
            password,
            vaultDNS: cleanVaultDNS,
            sessionId: loginSessionId
        };

        setLoading(true);
        const authResponse = await login(params);

        if (authResponse?.responseStatus === 'SUCCESS') {
            // Basic auth
            if (authResponse?.sessionId) {
                setSessionId(authResponse.sessionId);
                sessionStorage.setItem('vaultId', authResponse?.vaultId);
                sessionStorage.setItem('userId', authResponse?.userId);
            } else { // Session auth
                setSessionId(loginSessionId);
            }
            sessionStorage.setItem('vaultDNS', cleanVaultDNS);
        } else {
            let errMessage = '';
            // Vault errors
            if (authResponse?.errors?.length > 0) {
                errMessage = authResponse?.errors[0]?.type + ' : ' + authResponse?.errors[0]?.message;
            }
            setError({ hasError: true, errorMessage: errMessage });
        }
        setLoading(false);
    };

    /**
     * Handles clearing previuos inputs when user switches auth types
     * @param {Number} tabIndex : 0 = Basic Auth, 1 = Session
     */
    const handleAuthTypeChange = (tabIndex) => {
        // Switched to basic auth : clear session input
        if (tabIndex === 0) {
            setLoginSessionId('');
        } else if (tabIndex === 1) { // Switched to session auth : clear username/password inputs
            setUserName('');
            setPassword('');

            // After slight delay, move the focus to the session input field
            setTimeout(setFocusToSessionInput, 100);
        }

        setError({ hasError: false, errorMessage: '' });
    };

    /**
     * Sets the input focus on the password field.
     */
    const setFocusToPasswordInput = () => {
        if (passwordRef.current) {
            passwordRef.current.focus();
        }
    };

    /**
     * Sets the input focus on the username field.
     */
    const setFocusToUsernameInput = () => {
        if (usernameRef.current) {
            usernameRef.current.focus();
        }
    };

    /**
     * Sets the input focus on the sessionId field.
     */
    const setFocusToSessionInput = () => {
        if (sessionIdRef.current) {
            sessionIdRef.current.focus();
        }
    };

    /**
     * Attempt login if user can submit and presses enter
     * @param {object} event 
     */
    const handleKeyDown = (event) => {
        if (canSubmit && event?.key === 'Enter') {
            event.preventDefault();
            loginButtonRef.current.click();
        }
    };

    return {
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
     }
}