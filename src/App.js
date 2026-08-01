
import './App.css';
import Login from "./components/Login.jsx";
import Dashboard from './components/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import {
    BrowserRouter,
    Routes,
    Route,
} from "react-router-dom";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Login />}
                />

                <Route element={<ProtectedRoute />}>
                    <Route
                        path="/panel"
                        element={<Dashboard />}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}