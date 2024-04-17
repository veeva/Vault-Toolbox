import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

/**
 * Initializes and provides AuthContext.
 * @returns AuthContext
 */
export function useAuth() {
    return useContext(AuthContext);
}

/**
 * Retrieves sessionId from sessionStorage.
 * @returns sessionId, or null if one doesn't exist
 */
function getInitialSessionId() {
    const sessionStorageId = sessionStorage.getItem('sessionId');
    if (sessionStorageId) {
        return sessionStorageId;
    }
    return null;
}

/**
 * Reads sessionId into state and provides it to the Application.
 * @param {Object} props 
 * @returns 
 */
export function AuthProvider(props) {
    const [sessionId, setSessionId] = useState(getInitialSessionId);

    useEffect(() => {
        if (sessionId) {
            sessionStorage.setItem('sessionId', sessionId);
        }
    }, [sessionId]);

    const authInfo = {
        sessionId,
        setSessionId
    };

    return (
        <AuthContext.Provider value={authInfo}>
            {props.children}
        </AuthContext.Provider>
    );
}
