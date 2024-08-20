import { useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function useLogout() {
    const { setSessionId } = useAuth();

    return useCallback(() => {
        setSessionId('');
        sessionStorage.clear();
        document.title = 'Vault Toolbox';
    }, [setSessionId])
}