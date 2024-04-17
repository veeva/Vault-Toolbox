import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoutes() {
    const { sessionId } = useAuth();

    return sessionId ? <Outlet /> : <Navigate to='/login' />;
}

export default ProtectedRoutes;
