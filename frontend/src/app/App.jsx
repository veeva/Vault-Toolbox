import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/shared/Layout';
import ProtectedRoutes from './components/shared/ProtectedRoute';
import { SettingsProvider } from './context/SettingsContext';
import ComponentEditorPage from './pages/ComponentEditorPage';
import DataNavigatorPage from './pages/DataNavigatorPage';
import DataToolsPage from './pages/DataToolsPage';
import FileBrowserPage from './pages/FileBrowserPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import VaultInfoPage from './pages/VaultInfoPage';
import VqlEditorPage from './pages/VqlEditorPage';
import WorkflowActivityLogInspectorPage from './pages/WorkflowActivityLogInspectorPage';

function App() {
    return (
        <SettingsProvider>
            <HashRouter>
                <Routes>
                    <Route element={<ProtectedRoutes />}>
                        <Route element={<Layout />}>
                            <Route path='/' element={<VaultInfoPage />} />
                            <Route path='component-editor' element={<ComponentEditorPage />} />
                            <Route path='vql-editor' element={<VqlEditorPage />} />
                            <Route path='data-tools' element={<DataToolsPage />} />
                            <Route path='file-browser' element={<FileBrowserPage />} />
                            <Route path='data-navigator' element={<DataNavigatorPage />} />
                            <Route
                                path='workflow-activity-log-inspector'
                                element={<WorkflowActivityLogInspectorPage />}
                            />
                            <Route path='settings' element={<SettingsPage />} />
                        </Route>
                    </Route>
                    <Route path='/login' element={<LoginPage />} />
                </Routes>
            </HashRouter>
        </SettingsProvider>
    );
}

export default App;
