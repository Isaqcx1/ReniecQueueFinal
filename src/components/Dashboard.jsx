import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import "./Dashboard.css";

import logo from "../img/logor.png";

import {
    obtenerDashboard,
} from "../services/dashboardService";

export default function Dashboard() {
    const navigate =
        useNavigate();

    const [datos, setDatos] =
        useState(null);

    const [cargando, setCargando] =
        useState(true);

    const [mensaje, setMensaje] =
        useState("");

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

    const cargarDashboard =
        useCallback(async () => {
            if (!asesor?.idSede) {
                setMensaje(
                    "No se encontró la sede asignada al asesor."
                );

                setCargando(false);
                return;
            }

            try {
                setCargando(true);
                setMensaje("");

                const resultado =
                    await obtenerDashboard(
                        asesor.idSede
                    );

                setDatos(resultado);
            } catch (error) {
                console.error(
                    "Error al cargar dashboard:",
                    error
                );

                setMensaje(
                    error instanceof Error
                        ? error.message
                        : "No se pudo cargar el dashboard."
                );
            } finally {
                setCargando(false);
            }
        }, [asesor?.idSede]);

    useEffect(() => {
        cargarDashboard();
    }, [cargarDashboard]);

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

    const formatearEstado = (
        estado
    ) => {
        const estados = {
            EN_ESPERA:
                "En espera",

            LLAMADO:
                "Llamado",

            EN_ATENCION:
                "En atención",

            FINALIZADO:
                "Finalizado",

            AUSENTE:
                "Ausente",

            CANCELADO:
                "Cancelado",
        };

        return (
            estados[estado] ||
            estado
        );
    };

    const obtenerClaseEstado = (
        estado
    ) => {
        const clases = {
            EN_ESPERA:
                "status-waiting",

            LLAMADO:
                "status-called",

            EN_ATENCION:
                "status-attending",

            FINALIZADO:
                "status-finished",

            AUSENTE:
                "status-absent",

            CANCELADO:
                "status-cancelled",
        };

        return (
            clases[estado] || ""
        );
    };

    const formatearHora = (
        fecha
    ) => {
        if (!fecha) {
            return "-";
        }

        return new Date(
            fecha
        ).toLocaleTimeString(
            "es-PE",
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    if (!asesor) {
        return null;
    }

    const resumen =
        datos?.resumen || {
            totalHoy: 0,
            finalizados: 0,
            ausentes: 0,
            cancelados: 0,
        };

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
                        className="menu-option active"
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
                            mostrarProximamente(
                                "Reportes"
                            )
                        }
                    >
                        <span className="menu-icon">
                            ▥
                        </span>

                        <span>
                            Reportes
                        </span>

                        <small>
                            Próximamente
                        </small>
                    </button>

                    <button
                        className="menu-option"
                        onClick={() =>
                            navigate(
                                "/perfil"
                            )
                        }
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

            <main className="dashboard-content">

                <header className="dashboard-header">

                    <div>

                        <p className="dashboard-label">
                            Portal de atención
                        </p>

                        <h1>
                            Dashboard
                        </h1>

                        <p>
                            Consulte el resumen general
                            de los turnos atendidos en su
                            sede durante el día.
                        </p>

                    </div>

                    <div className="dashboard-advisor">

                        <div className="dashboard-avatar">
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
                                Ventanilla{" "}
                                {
                                    asesor.ventanilla
                                }
                            </span>

                        </div>

                    </div>

                </header>

                <section className="dashboard-sede-banner">

                    <div>

                        <span>
                            Sede asignada
                        </span>

                        <h2>
                            {datos?.sede
                                ?.nombre ||
                                asesor.sede}
                        </h2>

                        <p>
                            Resumen de los turnos
                            registrados durante la
                            jornada actual.
                        </p>

                    </div>

                    <div className="dashboard-sede-code">
                        {datos?.sede
                            ?.codigo ||
                            asesor.codigoSede}
                    </div>

                </section>

                <section className="dashboard-summary-grid">

                    <article className="dashboard-summary-card">

                        <div className="dashboard-summary-icon">
                            ☷
                        </div>

                        <div>

                            <span>
                                Turnos de hoy
                            </span>

                            <strong>
                                {
                                    resumen.totalHoy
                                }
                            </strong>

                        </div>

                    </article>

                    <article className="dashboard-summary-card">

                        <div className="dashboard-summary-icon finished-icon">
                            ✓
                        </div>

                        <div>

                            <span>
                                Finalizados
                            </span>

                            <strong>
                                {
                                    resumen.finalizados
                                }
                            </strong>

                        </div>

                    </article>

                    <article className="dashboard-summary-card">

                        <div className="dashboard-summary-icon absent-icon">
                            !
                        </div>

                        <div>

                            <span>
                                Ausentes
                            </span>

                            <strong>
                                {
                                    resumen.ausentes
                                }
                            </strong>

                        </div>

                    </article>

                    <article className="dashboard-summary-card">

                        <div className="dashboard-summary-icon cancelled-icon">
                            ×
                        </div>

                        <div>

                            <span>
                                Cancelados
                            </span>

                            <strong>
                                {
                                    resumen.cancelados
                                }
                            </strong>

                        </div>

                    </article>

                </section>

                <section className="dashboard-section">

                    <div className="dashboard-toolbar">

                        <div>

                            <h2>
                                Actividad reciente
                            </h2>

                            <p>
                                Consulte los últimos
                                turnos registrados en
                                la sede durante el día.
                            </p>

                        </div>

                        <button
                            className="dashboard-refresh-button"
                            onClick={
                                cargarDashboard
                            }
                            disabled={
                                cargando
                            }
                        >
                            {cargando
                                ? "Actualizando..."
                                : "Actualizar"}
                        </button>

                    </div>

                    {mensaje && (
                        <div className="dashboard-error">
                            {mensaje}
                        </div>
                    )}

                    {cargando &&
                    !datos ? (

                        <div className="dashboard-loading">

                            <div className="dashboard-spinner" />

                            <p>
                                Consultando información...
                            </p>

                        </div>

                    ) : datos
                          ?.actividadReciente
                          ?.length >
                      0 ? (

                        <div className="dashboard-table-container">

                            <table className="dashboard-table">

                                <thead>

                                    <tr>
                                        <th>
                                            Turno
                                        </th>

                                        <th>
                                            Trámite
                                        </th>

                                        <th>
                                            Estado
                                        </th>

                                        <th>
                                            Ventanilla
                                        </th>

                                        <th>
                                            Hora
                                        </th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {datos.actividadReciente.map(
                                        (
                                            turno
                                        ) => (

                                            <tr
                                                key={
                                                    turno.idTurno
                                                }
                                            >

                                                <td>
                                                    <strong className="dashboard-turn-code">
                                                        {
                                                            turno.codigoTurno
                                                        }
                                                    </strong>
                                                </td>

                                                <td>

                                                    <div className="dashboard-procedure-data">

                                                        <strong>
                                                            {
                                                                turno.tramite
                                                            }
                                                        </strong>

                                                    </div>

                                                </td>

                                                <td>

                                                    <span
                                                        className={`dashboard-status ${obtenerClaseEstado(
                                                            turno.estado
                                                        )}`}
                                                    >
                                                        {formatearEstado(
                                                            turno.estado
                                                        )}
                                                    </span>

                                                </td>

                                                <td>
                                                    {turno.ventanilla ||
                                                        "-"}
                                                </td>

                                                <td>
                                                    {formatearHora(
                                                        turno.fechaRegistro
                                                    )}
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    ) : (

                        <div className="dashboard-empty">

                            <div className="dashboard-empty-icon">
                                ☷
                            </div>

                            <h3>
                                Sin actividad registrada
                            </h3>

                            <p>
                                Todavía no existen
                                turnos registrados
                                durante el día.
                            </p>

                        </div>

                    )}

                </section>

            </main>

        </div>
    );
}