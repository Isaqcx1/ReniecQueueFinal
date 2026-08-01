import "./App.css";

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Login from "./components/Login.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function LoginRoute() {
    const sesion = localStorage.getItem(
        "asesorSesion"
    );

    if (sesion) {
        return (
            <Navigate
                to="/panel"
                replace
            />
        );
    }

    return <Login />;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Ruta pública */}
                <Route
                    path="/"
                    element={<LoginRoute />}
                />

                {/* Rutas protegidas */}
                <Route element={<ProtectedRoute />}>

                    <Route
                        path="/panel"
                        element={<Dashboard />}
                    />

                </Route>

                {/* Ruta inexistente */}
                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}