import {
    Navigate,
    Outlet,
} from "react-router-dom";

export default function ProtectedRoute() {
    const asesor =
        localStorage.getItem("asesorSesion");

    return asesor
        ? <Outlet />
        : <Navigate to="/" replace />;
}