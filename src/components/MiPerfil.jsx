import {
    useNavigate,
} from "react-router-dom";

import "./MiPerfil.css";

import logo from "../img/logor.png";

export default function MiPerfil() {
    const navigate =
        useNavigate();

    const sesionGuardada =
        localStorage.getItem(
            "asesorSesion"
        );

    let asesor = null;

    try {
        asesor =
            sesionGuardada
                ? JSON.parse(
                    sesionGuardada
                )
                : null;
    } catch {
        localStorage.removeItem(
            "asesorSesion"
        );
    }

    const cerrarSesion = () => {
        localStorage.removeItem(
            "asesorSesion"
        );

        navigate("/", {
            replace: true,
        });
    };

    const mostrarProximamente = (
        modulo
    ) => {
        alert(
            `${modulo} será desarrollado posteriormente.`
        );
    };

    const formatearTurnoTrabajo = (
        turno
    ) => {
        const turnos = {
            MANANA: "Mañana",
            TARDE: "Tarde",
            NOCHE: "Noche",
        };

        return (
            turnos[turno] ||
            turno ||
            "No registrado"
        );
    };

    const formatearRol = (
        rol
    ) => {
        const roles = {
            ASESOR: "Asesor",
            SUPERVISOR:
                "Supervisor",
            ADMIN:
                "Administrador",
        };

        return (
            roles[rol] ||
            rol ||
            "Asesor"
        );
    };

    if (!asesor) {
        return null;
    }

    return (
        <div className="dashboard">

            <aside className="sidebar">

                <div className="sidebar-logo-container">
                    <img
                        src={logo}
                        alt="RENIEC Queue"
                        className="sidebar-logo"
                    />
                </div>

                <nav className="sidebar-menu">

                    <button
                        className="menu-option"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >
                        <span className="menu-icon">
                            ⌂
                        </span>

                        <span>
                            Dashboard
                        </span>
                    </button>

                    <button
                        className="menu-option"
                        onClick={() =>
                            navigate(
                                "/gestion-atencion"
                            )
                        }
                    >
                        <span className="menu-icon">
                            ☷
                        </span>

                        <span>
                            Gestión de atención
                        </span>
                    </button>

                    <button
                        className="menu-option"
                        onClick={() =>
                            navigate("/reportes")
                        }
                    >
                        <span className="menu-icon">
                            ▥
                        </span>

                        <span>
                            Reportes
                        </span>
                    </button>

                    <button
                        className="menu-option active"
                    >
                        <span className="menu-icon">
                            ●
                        </span>

                        <span>
                            Mi perfil
                        </span>
                    </button>

                </nav>

                <div className="advisor-sidebar">

                    <div className="advisor-avatar">
                        {asesor.nombres
                            ?.charAt(0)
                            .toUpperCase()}
                    </div>

                    <div className="advisor-sidebar-data">

                        <strong>
                            {
                                asesor.nombreCompleto
                            }
                        </strong>

                        <span>
                            {asesor.usuario}
                        </span>

                    </div>

                </div>

                <button
                    className="logout-button"
                    onClick={
                        cerrarSesion
                    }
                >
                    Cerrar sesión
                </button>

            </aside>

            <main className="perfil-content">

                <header className="perfil-header">

                    <div>

                        <p className="perfil-label">
                            Portal de atención
                        </p>

                        <h1>
                            Mi perfil
                        </h1>

                        <p>
                            Consulte la información
                            asociada a su cuenta de
                            asesor.
                        </p>

                    </div>

                    <div className="perfil-advisor">

                        <div className="perfil-avatar">
                            {asesor.nombres
                                ?.charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>

                            <strong>
                                {
                                    asesor.nombreCompleto
                                }
                            </strong>

                            <span>
                                {formatearRol(
                                    asesor.rol
                                )}
                            </span>

                        </div>

                    </div>

                </header>

                <section className="perfil-banner">

                    <div>

                        <span>
                            Información de la cuenta
                        </span>

                        <h2>
                            {
                                asesor.nombreCompleto
                            }
                        </h2>

                        <p>
                            Cuenta institucional
                            asignada para la atención
                            de ciudadanos en{" "}
                            {asesor.sede}.
                        </p>

                    </div>

                    <div className="perfil-status">
                        <span className="perfil-status-dot" />

                        Disponible
                    </div>

                </section>

                <div className="perfil-section-title">

                    <h2>
                        Información del asesor
                    </h2>

                    <p>
                        Datos registrados en el
                        sistema para su cuenta.
                    </p>

                </div>

                <section className="perfil-summary-grid">

                    <article className="perfil-summary-card">

                        <div className="perfil-summary-icon">
                            🏢
                        </div>

                        <div>

                            <span>
                                Sede asignada
                            </span>

                            <strong>
                                {asesor.sede}
                            </strong>

                        </div>

                    </article>

                    <article className="perfil-summary-card">

                        <div className="perfil-summary-icon">
                            ▣
                        </div>

                        <div>

                            <span>
                                Ventanilla
                            </span>

                            <strong>
                                {asesor.ventanilla}
                            </strong>

                        </div>

                    </article>

                    <article className="perfil-summary-card">

                        <div className="perfil-summary-icon">
                            ◷
                        </div>

                        <div>

                            <span>
                                Turno laboral
                            </span>

                            <strong>
                                {formatearTurnoTrabajo(
                                    asesor.turnoTrabajo
                                )}
                            </strong>

                        </div>

                    </article>

                    <article className="perfil-summary-card">

                        <div className="perfil-summary-icon perfil-active-icon">
                            ✓
                        </div>

                        <div>

                            <span>
                                Estado
                            </span>

                            <strong className="perfil-available">
                                Disponible
                            </strong>

                        </div>

                    </article>

                </section>

                <section className="perfil-details">

                    <div className="perfil-details-header">

                        <h2>
                            Datos de la cuenta
                        </h2>

                        <p>
                            Información complementaria
                            del asesor y de la sede
                            asignada.
                        </p>

                    </div>

                    <div className="perfil-details-grid">

                        <div className="perfil-detail-row">

                            <span>
                                Usuario del asesor
                            </span>

                            <strong>
                                {asesor.usuario}
                            </strong>

                        </div>

                        <div className="perfil-detail-row">

                            <span>
                                Código de sede
                            </span>

                            <strong>
                                {
                                    asesor.codigoSede
                                }
                            </strong>

                        </div>

                        <div className="perfil-detail-row">

                            <span>
                                Correo institucional
                            </span>

                            <strong>
                                {asesor.correo ||
                                    "No registrado"}
                            </strong>

                        </div>

                        <div className="perfil-detail-row">

                            <span>
                                Dirección de sede
                            </span>

                            <strong>
                                {asesor.direccionSede ||
                                    "No registrada"}
                            </strong>

                        </div>

                    </div>

                </section>

            </main>

        </div>
    );
}