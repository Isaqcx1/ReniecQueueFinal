import { useNavigate } from "react-router-dom";

import "../components/Dashboard.css";

import logo from "../img/logor.png";

export default function Dashboard() {
    const navigate = useNavigate();

    const asesorGuardado =
        localStorage.getItem("asesorSesion");

    const asesor = asesorGuardado
        ? JSON.parse(asesorGuardado)
        : null;

    const cerrarSesion = () => {
        localStorage.removeItem("asesorSesion");

        navigate("/", {
            replace: true,
        });
    };

    const mostrarProximamente = (modulo) => {
        alert(
            `${modulo} estará disponible en el siguiente Sprint.`
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

                <div className="sidebar-divider" />

                <nav className="sidebar-menu">
                    <button className="menu-option active">
                        <span className="menu-icon">⌂</span>

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
                        <span className="menu-icon">☷</span>

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
                        <span className="menu-icon">♙</span>

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
                        <span className="menu-icon">▥</span>

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
                        <span className="menu-icon">●</span>

                        <span>Mi perfil</span>

                        <small>Próximamente</small>
                    </button>
                </nav>

                <div className="advisor-sidebar">
                    <div className="advisor-avatar">
                        {asesor.nombres
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div className="advisor-sidebar-data">
                        <strong>
                            {asesor.nombres}
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
                            {asesor.nombres.split(" ")[0]}
                        </h1>

                        <p className="dashboard-description">
                            Aquí podrá gestionar la atención
                            de los ciudadanos y consultar la
                            información de su jornada.
                        </p>
                    </div>

                    <div className="header-profile">
                        <div className="header-avatar">
                            {asesor.nombres
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>
                            <strong>
                                {asesor.nombres}
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
                            Su cuenta se encuentra activa y
                            lista para comenzar la jornada de
                            atención.
                        </p>
                    </div>

                    <div className="banner-status">
                        <span className="status-dot" />

                        Disponible
                    </div>
                </section>

                <section className="section-header">
                    <div>
                        <h2>Información asignada</h2>

                        <p>
                            Datos correspondientes a su
                            jornada de trabajo.
                        </p>
                    </div>
                </section>

                <section className="summary-grid">
                    <article className="summary-card">
                        <div className="card-icon">
                            🏢
                        </div>

                        <div className="card-information">
                            <span>Sede asignada</span>

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
                            <span>Ventanilla</span>

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
                                Turno de trabajo
                            </span>

                            <strong>
                                {asesor.turnoTrabajo}
                            </strong>
                        </div>
                    </article>

                    <article className="summary-card">
                        <div className="card-icon">
                            ✓
                        </div>

                        <div className="card-information">
                            <span>
                                Estado del asesor
                            </span>

                            <strong className="available">
                                Disponible
                            </strong>
                        </div>
                    </article>
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
                            El asesor inició sesión
                            correctamente y puede acceder a
                            su panel personalizado.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}