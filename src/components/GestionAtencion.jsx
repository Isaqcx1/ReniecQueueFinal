import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Dashboard.css";
import "./GestionAtencion.css";

import logo from "../img/logor.png";

import {
    obtenerColaPorSede,
    llamarSiguienteTurno,
    actualizarEstadoTurno,
} from "../services/turnoService";

export default function GestionAtencion() {
    const [llamando, setLlamando] = useState(false);
    const [turnoActualizando, setTurnoActualizando] =
        useState(null);
    const navigate = useNavigate();

    const [cola, setCola] = useState([]);
    const [resumen, setResumen] = useState({
        totalActivos: 0,
        enEspera: 0,
        llamados: 0,
        enAtencion: 0,
    });

    const [sede, setSede] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [mensaje, setMensaje] = useState("");

    const sesionGuardada =
        localStorage.getItem("asesorSesion");

    let asesor = null;

    try {
        asesor = sesionGuardada
            ? JSON.parse(sesionGuardada)
            : null;
    } catch {
        localStorage.removeItem("asesorSesion");
    }

    const cargarCola = useCallback(async () => {
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

            const datos =
                await obtenerColaPorSede(
                    asesor.idSede
                );

            setCola(datos.cola || []);

            setResumen(
                datos.resumen || {
                    totalActivos: 0,
                    enEspera: 0,
                    llamados: 0,
                    enAtencion: 0,
                }
            );

            setSede(datos.sede || null);
        } catch (error) {
            console.error(
                "Error al cargar la cola:",
                error
            );

            setMensaje(
                error instanceof Error
                    ? error.message
                    : "No se pudo cargar la cola."
            );
        } finally {
            setCargando(false);
        }
    }, [asesor?.idSede]);

    useEffect(() => {
        cargarCola();
    }, [cargarCola]);

    const manejarLlamarSiguiente = async () => {
        if (!asesor?.idAsesor) {
            alert(
                "No se encontró el identificador del asesor."
            );
            return;
        }

        if (resumen.enEspera === 0) {
            alert(
                "Actualmente no existen ciudadanos esperando."
            );
            return;
        }

        try {
            setLlamando(true);

            const resultado =
                await llamarSiguienteTurno(
                    asesor.idAsesor
                );

            alert(
                `${resultado.mensaje}\n\n` +
                `Ciudadano: ${resultado.turno.ciudadano.nombreCompleto}\n` +
                `DNI: ${resultado.turno.ciudadano.dni}\n` +
                `Ventanilla: ${resultado.turno.asesor.ventanilla}`
            );

            await cargarCola();
        } catch (error) {
            console.error(
                "Error al llamar el turno:",
                error
            );

            alert(
                error instanceof Error
                    ? error.message
                    : "No se pudo llamar al siguiente turno."
            );
        } finally {
            setLlamando(false);
        }
    };

    const manejarCambioEstado = async (
        turno,
        nuevoEstado
    ) => {
        if (!asesor?.idAsesor) {
            alert(
                "No se encontró el identificador del asesor."
            );
            return;
        }

        const mensajesConfirmacion = {
            EN_ATENCION:
                `¿Deseas iniciar la atención del turno ${turno.codigoTurno}?`,

            AUSENTE:
                `¿Deseas marcar como ausente al turno ${turno.codigoTurno}?`,

            FINALIZADO:
                `¿Deseas finalizar la atención del turno ${turno.codigoTurno}?`,
        };

        const confirmado = window.confirm(
            mensajesConfirmacion[nuevoEstado]
        );

        if (!confirmado) {
            return;
        }

        try {
            setTurnoActualizando(turno.idTurno);

            const resultado =
                await actualizarEstadoTurno(
                    turno.idTurno,
                    asesor.idAsesor,
                    nuevoEstado
                );

            alert(resultado.mensaje);

            await cargarCola();
        } catch (error) {
            console.error(
                "Error al actualizar el turno:",
                error
            );

            alert(
                error instanceof Error
                    ? error.message
                    : "No se pudo actualizar el turno."
            );
        } finally {
            setTurnoActualizando(null);
        }
    };

    const cerrarSesion = () => {
        localStorage.removeItem("asesorSesion");

        navigate("/", {
            replace: true,
        });
    };

    const mostrarProximamente = (modulo) => {
        alert(
            `${modulo} será desarrollado posteriormente.`
        );
    };

    const formatearEstado = (estado) => {
        const estados = {
            EN_ESPERA: "En espera",
            LLAMADO: "Llamado",
            EN_ATENCION: "En atención",
            FINALIZADO: "Finalizado",
            AUSENTE: "Ausente",
            CANCELADO: "Cancelado",
        };

        return estados[estado] || estado;
    };

    const obtenerClaseEstado = (estado) => {
        const clases = {
            EN_ESPERA: "status-waiting",
            LLAMADO: "status-called",
            EN_ATENCION: "status-attending",
        };

        return clases[estado] || "";
    };

    const formatearHora = (fecha) => {
        if (!fecha) {
            return "No disponible";
        }

        return new Date(fecha).toLocaleTimeString(
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

                    <button
                        className="menu-option"
                        onClick={() =>
                            navigate("/panel")
                        }
                    >
                        <span className="menu-icon">
                            ⌂
                        </span>

                        <span>Dashboard</span>
                    </button>

                    <button
                        className="menu-option active"
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

            <main className="gestion-content">

                <header className="gestion-header">

                    <div>
                        <p className="gestion-label">
                            Portal de atención
                        </p>

                        <h1>
                            Gestión de atención
                        </h1>

                        <p>
                            Consulte los turnos activos de su
                            sede y el orden actual de atención.
                        </p>
                    </div>

                    <div className="gestion-advisor">

                        <div className="gestion-avatar">
                            {asesor.nombres
                                ?.charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>
                            <strong>
                                {asesor.nombreCompleto}
                            </strong>

                            <span>
                                Ventanilla{" "}
                                {asesor.ventanilla}
                            </span>
                        </div>

                    </div>

                </header>

                <section className="sede-banner">

                    <div>
                        <span>Sede asignada</span>

                        <h2>
                            {sede?.nombre ||
                                asesor.sede}
                        </h2>

                        <p>
                            {sede?.direccion ||
                                asesor.direccionSede}
                        </p>
                    </div>

                    <div className="sede-code">
                        {sede?.codigo ||
                            asesor.codigoSede}
                    </div>

                </section>

                <section className="queue-summary-grid">

                    <article className="queue-summary-card">
                        <div className="queue-summary-icon">
                            ☷
                        </div>

                        <div>
                            <span>
                                Turnos activos
                            </span>

                            <strong>
                                {resumen.totalActivos}
                            </strong>
                        </div>
                    </article>

                    <article className="queue-summary-card">
                        <div className="queue-summary-icon">
                            ◷
                        </div>

                        <div>
                            <span>En espera</span>

                            <strong>
                                {resumen.enEspera}
                            </strong>
                        </div>
                    </article>

                    <article className="queue-summary-card">
                        <div className="queue-summary-icon">
                            🔔
                        </div>

                        <div>
                            <span>Llamados</span>

                            <strong>
                                {resumen.llamados}
                            </strong>
                        </div>
                    </article>

                    <article className="queue-summary-card">
                        <div className="queue-summary-icon">
                            ✓
                        </div>

                        <div>
                            <span>
                                En atención
                            </span>

                            <strong>
                                {resumen.enAtencion}
                            </strong>
                        </div>
                    </article>

                </section>

                <section className="queue-section">

                    <div className="queue-toolbar">

                        <div>
                            <h2>
                                Cola virtual
                            </h2>

                            <p>
                                Los turnos aparecen según su
                                estado y orden de registro.
                            </p>
                        </div>

                        <div className="queue-actions">

                            <button
                                className="refresh-button"
                                onClick={cargarCola}
                                disabled={cargando || llamando}
                            >
                                {cargando
                                    ? "Actualizando..."
                                    : "Actualizar cola"}
                            </button>

                            <button
                                className="call-next-button"
                                onClick={manejarLlamarSiguiente}
                                disabled={
                                    llamando ||
                                    cargando ||
                                    resumen.enEspera === 0
                                }
                            >
                                {llamando
                                    ? "Llamando..."
                                    : "Llamar siguiente turno"}
                            </button>

                        </div>

                    </div>

                    {mensaje && (
                        <div className="queue-error">
                            {mensaje}
                        </div>
                    )}

                    {cargando ? (

                        <div className="queue-loading">
                            <div className="spinner" />

                            <p>
                                Consultando turnos...
                            </p>
                        </div>

                    ) : cola.length === 0 ? (

                        <div className="queue-empty">

                            <div className="empty-icon">
                                ☷
                            </div>

                            <h3>
                                No hay turnos activos
                            </h3>

                            <p>
                                La sede no tiene ciudadanos
                                registrados actualmente en la
                                cola virtual.
                            </p>

                        </div>

                    ) : (

                        <div className="queue-table-container">

                            <table className="queue-table">

                                <thead>
                                    <tr>
                                        <th>Turno</th>
                                        <th>Ciudadano</th>
                                        <th>Trámite</th>
                                        <th>Hora de registro</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {cola.map((turno) => (

                                        <tr key={turno.idTurno}>

                                            <td>
                                                <strong className="turn-code">
                                                    {
                                                        turno.codigoTurno
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                <div className="citizen-data">
                                                    <strong>
                                                        {
                                                            turno
                                                                .ciudadano
                                                                .nombreCompleto
                                                        }
                                                    </strong>

                                                    <span>
                                                        DNI:{" "}
                                                        {
                                                            turno
                                                                .ciudadano
                                                                .dni
                                                        }
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="procedure-data">
                                                    <strong>
                                                        {
                                                            turno
                                                                .tramite
                                                                .nombre
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            turno
                                                                .tramite
                                                                .codigo
                                                        }
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                {formatearHora(
                                                    turno.fechaRegistro
                                                )}
                                            </td>

                                            <td>
                                                <span
                                                    className={`queue-status ${obtenerClaseEstado(
                                                        turno.estado
                                                    )}`}
                                                >
                                                    {formatearEstado(
                                                        turno.estado
                                                    )}
                                                </span>
                                            </td>


                                            <td>
                                                <div className="turn-actions">

                                                    {turno.estado === "LLAMADO" && (
                                                        <>
                                                            <button
                                                                className="action-button start-button"
                                                                disabled={
                                                                    turnoActualizando ===
                                                                    turno.idTurno
                                                                }
                                                                onClick={() =>
                                                                    manejarCambioEstado(
                                                                        turno,
                                                                        "EN_ATENCION"
                                                                    )
                                                                }
                                                            >
                                                                Iniciar atención
                                                            </button>

                                                            <button
                                                                className="action-button absent-button"
                                                                disabled={
                                                                    turnoActualizando ===
                                                                    turno.idTurno
                                                                }
                                                                onClick={() =>
                                                                    manejarCambioEstado(
                                                                        turno,
                                                                        "AUSENTE"
                                                                    )
                                                                }
                                                            >
                                                                Marcar ausente
                                                            </button>
                                                        </>
                                                    )}

                                                    {turno.estado === "EN_ATENCION" && (
                                                        <button
                                                            className="action-button finish-button"
                                                            disabled={
                                                                turnoActualizando ===
                                                                turno.idTurno
                                                            }
                                                            onClick={() =>
                                                                manejarCambioEstado(
                                                                    turno,
                                                                    "FINALIZADO"
                                                                )
                                                            }
                                                        >
                                                            Finalizar atención
                                                        </button>
                                                    )}

                                                    {turno.estado === "EN_ESPERA" && (
                                                        <span className="action-waiting-text">
                                                            Pendiente de llamado
                                                        </span>
                                                    )}

                                                </div>
                                            </td>



                                        </tr>



                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </main>

        </div>
    );
}