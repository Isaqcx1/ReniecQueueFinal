import {
    Navigate,
    Outlet,
} from "react-router-dom";

export default function ProtectedRoute() {
    const sesionGuardada =
        localStorage.getItem("asesorSesion");

    if (!sesionGuardada) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    try {
        const asesor =
            JSON.parse(sesionGuardada);

        if (!asesor?.idAsesor) {
            localStorage.removeItem(
                "asesorSesion"
            );

            return (
                <Navigate
                    to="/"
                    replace
                />
            );
        }

        return <Outlet />;

    } catch (error) {
        localStorage.removeItem(
            "asesorSesion"
        );

        return (
            <Navigate
                to="/"
                replace
            />
        );
    }
}