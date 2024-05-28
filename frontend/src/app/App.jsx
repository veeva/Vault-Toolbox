import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import VaultInfoPage from './pages/VaultInfoPage';
import Layout from './components/shared/Layout';
import ProtectedRoutes from './utils/ProtectedRoute';
import ComponentEditorPage from './pages/ComponentEditorPage';
import VaultDataToolsPage from './pages/VaultDataToolsPage';
import VqlEditorPage from './pages/VqlEditorPage';

function App() {
    return (
        <HashRouter>
            <Routes>
                <Route element={<ProtectedRoutes />}>
                    <Route element={<Layout />}>
                        <Route path='/' element={<VaultInfoPage />} />
                        <Route path='component-editor' element={<ComponentEditorPage />} />
                        <Route path='vql-editor' element={<VqlEditorPage />} />
                        <Route path='vault-data-tools' element={<VaultDataToolsPage />} />
                    </Route>
                </Route>
                <Route path='/login' element={<LoginPage />} />
            </Routes>
        </HashRouter>
    );
}

export default App;
