import { useNavigate } from "react-router-dom";

import "../components/Dashboard.css";
import logo from "../img/logor.png";

export default function Dashboard() {
    const navigate = useNavigate();

    const sesionGuardada = localStorage.getItem(
        "asesorSesion"
    );

    const asesor = sesionGuardada
        ? JSON.parse(sesionGuardada)
        : null;

    const cerrarSesion = () => {
        localStorage.removeItem("asesorSesion");

        navigate("/", {
            replace: true,
        });
    };

    const mostrarProximamente = (modulo) => {
        alert(
            `${modulo} será desarrollado durante el Sprint 3.`
        );
    };

    const formatearTurnoTrabajo = (turno) => {
        const turnos = {
            MANANA: "Mañana",
            TARDE: "Tarde",
            NOCHE: "Noche",
        };

        return turnos[turno] || turno;
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

                <div className="sidebar-divider" />

                <nav className="sidebar-menu">
                    <button className="menu-option active">
                        <span className="menu-icon">
                            ⌂
                        </span>

                        <span>Dashboard</span>
                    </button>

                    <button
                        className="menu-option"
                        onClick={() =>
                            mostrarProximamente(
                                "Gestión de atención"
                            )
                        }
                    >
                        <span className="menu-icon">
                            ☷
                        </span>

                        <span>
                            Gestión de atención
                        </span>

                        <small>Próximamente</small>
                    </button>

                    <button
                        className="menu-option"
                        onClick={() =>
                            mostrarProximamente(
                                "Usuarios"
                            )
                        }
                    >
                        <span className="menu-icon">
                            ♙
                        </span>

                        <span>Usuarios</span>

                        <small>Próximamente</small>
                    </button>

                    <button
                        className="menu-option"
                        onClick={() =>
                            mostrarProximamente(
                                "Reportes"
                            )
                        }
                    >
                        <span className="menu-icon">
                            ▥
                        </span>

                        <span>Reportes</span>

                        <small>Próximamente</small>
                    </button>

                    <button
                        className="menu-option"
                        onClick={() =>
                            mostrarProximamente(
                                "Mi perfil"
                            )
                        }
                    >
                        <span className="menu-icon">
                            ●
                        </span>

                        <span>Mi perfil</span>

                        <small>Próximamente</small>
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
                            {asesor.nombreCompleto}
                        </strong>

                        <span>
                            {asesor.usuario}
                        </span>
                    </div>
                </div>

                <button
                    className="logout-button"
                    onClick={cerrarSesion}
                >
                    Cerrar sesión
                </button>
            </aside>

            <main className="dashboard-content">
                <header className="dashboard-header">
                    <div>
                        <p className="dashboard-label">
                            Portal de atención
                        </p>

                        <h1>
                            Bienvenido,{" "}
                            {asesor.nombres}
                        </h1>

                        <p className="dashboard-description">
                            Su sesión fue validada
                            correctamente mediante el backend
                            y la base de datos PostgreSQL.
                        </p>
                    </div>

                    <div className="header-profile">
                        <div className="header-avatar">
                            {asesor.nombres
                                ?.charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>
                            <strong>
                                {asesor.nombreCompleto}
                            </strong>

                            <span>
                                {asesor.rol}
                            </span>
                        </div>
                    </div>
                </header>

                <section className="welcome-banner">
                    <div className="banner-information">
                        <span className="banner-label">
                            Sesión iniciada correctamente
                        </span>

                        <h2>
                            Panel del asesor
                        </h2>

                        <p>
                            La cuenta se encuentra activa y
                            asignada a una sede y ventanilla
                            de atención.
                        </p>
                    </div>

                    <div className="banner-status">
                        <span className="status-dot" />

                        Disponible
                    </div>
                </section>

                <section className="section-header">
                    <div>
                        <h2>
                            Información del asesor
                        </h2>

                        <p>
                            Datos obtenidos desde PostgreSQL.
                        </p>
                    </div>
                </section>

                <section className="summary-grid">
                    <article className="summary-card">
                        <div className="card-icon">
                            🏢
                        </div>

                        <div className="card-information">
                            <span>
                                Sede asignada
                            </span>

                            <strong>
                                {asesor.sede}
                            </strong>
                        </div>
                    </article>

                    <article className="summary-card">
                        <div className="card-icon">
                            ▣
                        </div>

                        <div className="card-information">
                            <span>
                                Ventanilla
                            </span>

                            <strong>
                                {asesor.ventanilla}
                            </strong>
                        </div>
                    </article>

                    <article className="summary-card">
                        <div className="card-icon">
                            ◷
                        </div>

                        <div className="card-information">
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

                    <article className="summary-card">
                        <div className="card-icon">
                            ✓
                        </div>

                        <div className="card-information">
                            <span>
                                Estado
                            </span>

                            <strong className="available">
                                Disponible
                            </strong>
                        </div>
                    </article>
                </section>

                <section className="advisor-details">
                    <div className="detail-row">
                        <span>
                            Código del asesor
                        </span>

                        <strong>
                            {asesor.usuario}
                        </strong>
                    </div>

                    <div className="detail-row">
                        <span>
                            Código de sede
                        </span>

                        <strong>
                            {asesor.codigoSede}
                        </strong>
                    </div>

                    <div className="detail-row">
                        <span>
                            Correo institucional
                        </span>

                        <strong>
                            {asesor.correo ||
                                "No registrado"}
                        </strong>
                    </div>

                    <div className="detail-row">
                        <span>
                            Dirección de sede
                        </span>

                        <strong>
                            {asesor.direccionSede}
                        </strong>
                    </div>
                </section>

                <section className="sprint-information">
                    <div className="sprint-icon">
                        ✓
                    </div>

                    <div>
                        <h3>
                            Acceso al sistema completado
                        </h3>

                        <p>
                            El asesor inició sesión con una
                            cuenta registrada en PostgreSQL,
                            ingresó a una ruta protegida y
                            puede cerrar su sesión.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}