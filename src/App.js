import "./App.css";

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Login from "./components/Login.jsx";
import MiPerfil from "./components/MiPerfil.jsx";
import GestionAtencion from "./components/GestionAtencion.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function LoginRoute() {
    const sesion =
        localStorage.getItem("asesorSesion");

    if (sesion) {
        return (
            <Navigate
                to="/perfil"
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

                <Route
                    path="/"
                    element={<LoginRoute />}
                />

                <Route
                    element={<ProtectedRoute />}
                >

                    <Route
                        path="/perfil"
                        element={<MiPerfil />}
                    />

                    <Route
                        path="/gestion-atencion"
                        element={
                            <GestionAtencion />
                        }
                    />

                    {/*
                    Dashboard real:
                    se desarrollará en REN-19.
                    */}

                    <Route
                        path="/panel"
                        element={
                            <Navigate
                                to="/perfil"
                                replace
                            />
                        }
                    />

                </Route>

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