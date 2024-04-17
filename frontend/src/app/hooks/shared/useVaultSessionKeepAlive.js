import { useEffect } from 'react';
import { sessionKeepAlive } from '../../services/ApiService';

export default function useVaultSessionKeepAlive() {

    const vaultSessionKeepAlive = async () => {
        await sessionKeepAlive();
    }

    /**
     * Call the session keep alive endpoint once very five minutes
     */
    useEffect(() => {
        vaultSessionKeepAlive();
        const runInterval = setInterval(vaultSessionKeepAlive, 5 * 60 * 1000);

        return () => clearInterval(runInterval);
    }, []);
}
