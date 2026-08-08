import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar,
} from "recharts";

import "./Reportes.css";

import logo from "../img/logor.png";

import {
    obtenerReporte,
} from "../services/reporteService";

import {
    generarReportePDF,
} from "../services/reportePdfService";

import "./MiPerfil.css";
import "./Reportes.css";

export default function Reportes() {
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

    const hoy =
        new Date()
            .toISOString()
            .split("T")[0];

    const mesActual =
        hoy.substring(
            0,
            7
        );

    const [tipoPeriodo, setTipoPeriodo] =
        useState("DIA");

    const [fechaDia, setFechaDia] =
        useState(hoy);

    const [mes, setMes] =
        useState(mesActual);

    const [desde, setDesde] =
        useState(hoy);

    const [hasta, setHasta] =
        useState(hoy);

    const [estado, setEstado] =
        useState("TODOS");

    const [reporte, setReporte] =
        useState(null);

    const [cargando, setCargando] =
        useState(false);

    const [mensaje, setMensaje] =
        useState("");

            const obtenerUltimoDiaMes = (
        valorMes
    ) => {
        const [
            anio,
            numeroMes,
        ] = valorMes
            .split("-")
            .map(Number);

        const ultimoDia =
            new Date(
                anio,
                numeroMes,
                0
            ).getDate();

        return `${valorMes}-${String(
            ultimoDia
        ).padStart(2, "0")}`;
    };

    const prepararFiltros = () => {
        if (
            tipoPeriodo ===
            "DIA"
        ) {
            return {
                desde:
                    fechaDia,
                hasta:
                    fechaDia,
                estado,
                agrupacion:
                    "HORA",
            };
        }

        if (
            tipoPeriodo ===
            "MES"
        ) {
            return {
                desde:
                    `${mes}-01`,

                hasta:
                    obtenerUltimoDiaMes(
                        mes
                    ),

                estado,
                agrupacion:
                    "DIA",
            };
        }

        return {
            desde,
            hasta,
            estado,
            agrupacion:
                "DIA",
        };
    };

    const consultarReporte =
        async () => {
            if (
                !asesor?.idSede
            ) {
                setMensaje(
                    "No se encontró la sede asignada al asesor."
                );

                return;
            }

            const filtros =
                prepararFiltros();

            if (
                filtros.desde >
                filtros.hasta
            ) {
                setMensaje(
                    "La fecha inicial no puede ser mayor que la fecha final."
                );

                return;
            }

            try {
                setCargando(
                    true
                );

                setMensaje(
                    ""
                );

                const datos =
                    await obtenerReporte(
                        asesor.idSede,
                        filtros
                    );

                setReporte(
                    datos
                );
            } catch (error) {
                console.error(
                    "Error al consultar reporte:",
                    error
                );

                setMensaje(
                    error instanceof Error
                        ? error.message
                        : "No se pudo generar el reporte."
                );
            } finally {
                setCargando(
                    false
                );
            }
        };

    useEffect(() => {
        consultarReporte();
    }, []);

    const cerrarSesion = () => {
        localStorage.removeItem(
            "asesorSesion"
        );

        navigate("/", {
            replace: true,
        });
    };
        const formatearEstado = (
        valor
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
            estados[valor] ||
            valor
        );
    };

    const formatearPeriodo = (
        valor
    ) => {
        const fecha =
            new Date(valor);

        if (
            tipoPeriodo ===
            "DIA"
        ) {
            return fecha
                .toLocaleTimeString(
                    "es-PE",
                    {
                        hour:
                            "2-digit",
                        minute:
                            "2-digit",
                    }
                );
        }

        return fecha
            .toLocaleDateString(
                "es-PE",
                {
                    day:
                        "2-digit",
                    month:
                        "short",
                }
            );
    };

    const formatearFechaHora = (
        valor
    ) => {
        if (!valor) {
            return "-";
        }

        return new Date(
            valor
        ).toLocaleString(
            "es-PE",
            {
                day:
                    "2-digit",
                month:
                    "2-digit",
                year:
                    "numeric",
                hour:
                    "2-digit",
                minute:
                    "2-digit",
            }
        );
    };

    const obtenerClaseEstado = (
        valor
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
            clases[valor] ||
            ""
        );
    };

    const tendencia =
        reporte?.tendencia?.map(
            (item) => ({
                periodo:
                    formatearPeriodo(
                        item.periodo
                    ),

                cantidad:
                    item.cantidad,
            })
        ) || [];

    const distribucionEstados =
        reporte
            ?.distribucionEstados
            ?.map(
                (item) => ({
                    estado:
                        formatearEstado(
                            item.estado
                        ),

                    cantidad:
                        item.cantidad,
                })
            ) || [];

    const tramites =
        reporte?.tramites ||
        [];

    if (!asesor) {
        return null;
    }
        const resumen =
        reporte?.resumen || {
            totalTurnos: 0,
            finalizados: 0,
            ausentes: 0,
            cancelados: 0,
            porcentajeFinalizacion: 0,
        };

    const tramiteMasSolicitado =
        reporte?.estadisticas
            ?.tramiteMasSolicitado;

    const COLORES_ESTADOS = [
        "#25a55f",
        "#e67e22",
        "#c62828",
        "#1976d2",
        "#54b7fe",
        "#b36b00",
    ];

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
                            navigate(
                                "/dashboard"
                            )
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
                        className="menu-option active"
                    >
                        <span className="menu-icon">
                            ▥
                        </span>

                        <span>
                            Reportes
                        </span>
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

            <main className="reportes-content">

                <header className="reportes-header">

                    <div>
                        <p className="reportes-label">
                            Portal de atención
                        </p>

                        <h1>
                            Reportes
                        </h1>

                        <p>
                            Consulte estadísticas e
                            información histórica de
                            los turnos registrados en
                            su sede.
                        </p>
                    </div>

                    <div className="reportes-advisor">

                        <div className="reportes-avatar">
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

                <section className="reportes-sede-banner">

                    <div>
                        <span>
                            Sede asignada
                        </span>

                        <h2>
                            {reporte?.sede
                                ?.nombre ||
                                asesor.sede}
                        </h2>

                        <p>
                            Consulte y analice la
                            información de atención
                            registrada en esta sede.
                        </p>
                    </div>

                    <div className="reportes-sede-code">
                        {reporte?.sede
                            ?.codigo ||
                            asesor.codigoSede}
                    </div>

                </section>

                <section className="reportes-filter-section">

                    <div className="reportes-section-title">
                        <div>
                            <h2>
                                Consultar reporte
                            </h2>

                            <p>
                                Seleccione el periodo
                                y los criterios que
                                desea analizar.
                            </p>
                        </div>
                    </div>

                    <div className="period-selector">

                        <button
                            className={
                                tipoPeriodo ===
                                "DIA"
                                    ? "period-button active"
                                    : "period-button"
                            }
                            onClick={() =>
                                setTipoPeriodo(
                                    "DIA"
                                )
                            }
                        >
                            Por día
                        </button>

                        <button
                            className={
                                tipoPeriodo ===
                                "MES"
                                    ? "period-button active"
                                    : "period-button"
                            }
                            onClick={() =>
                                setTipoPeriodo(
                                    "MES"
                                )
                            }
                        >
                            Por mes
                        </button>

                        <button
                            className={
                                tipoPeriodo ===
                                "RANGO"
                                    ? "period-button active"
                                    : "period-button"
                            }
                            onClick={() =>
                                setTipoPeriodo(
                                    "RANGO"
                                )
                            }
                        >
                            Rango personalizado
                        </button>

                    </div>

                    <div className="reportes-filters">

                        {tipoPeriodo ===
                            "DIA" && (
                            <div className="filter-field">

                                <label>
                                    Fecha
                                </label>

                                <input
                                    type="date"
                                    value={
                                        fechaDia
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setFechaDia(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                />

                            </div>
                        )}

                        {tipoPeriodo ===
                            "MES" && (
                            <div className="filter-field">

                                <label>
                                    Mes
                                </label>

                                <input
                                    type="month"
                                    value={
                                        mes
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setMes(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                />

                            </div>
                        )}

                        {tipoPeriodo ===
                            "RANGO" && (
                            <>
                                <div className="filter-field">

                                    <label>
                                        Desde
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            desde
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setDesde(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    />

                                </div>

                                <div className="filter-field">

                                    <label>
                                        Hasta
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            hasta
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setHasta(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    />

                                </div>
                            </>
                        )}

                        <div className="filter-field">

                            <label>
                                Estado
                            </label>

                            <select
                                value={
                                    estado
                                }
                                onChange={(
                                    event
                                ) =>
                                    setEstado(
                                        event
                                            .target
                                            .value
                                    )
                                }
                            >
                                <option value="TODOS">
                                    Todos
                                </option>

                                <option value="FINALIZADO">
                                    Finalizados
                                </option>

                                <option value="AUSENTE">
                                    Ausentes
                                </option>

                                <option value="CANCELADO">
                                    Cancelados
                                </option>

                                <option value="EN_ESPERA">
                                    En espera
                                </option>

                                <option value="LLAMADO">
                                    Llamados
                                </option>

                                <option value="EN_ATENCION">
                                    En atención
                                </option>
                            </select>

                        </div>

                        <button
                            className="generate-report-button"
                            onClick={
                                consultarReporte
                            }
                            disabled={
                                cargando
                            }
                        >
                            {cargando
                                ? "Consultando..."
                                : "Generar reporte"}
                        </button>

                    </div>

                    {mensaje && (
                        <div className="reportes-error">
                            {mensaje}
                        </div>
                    )}

                </section>

                {cargando &&
                !reporte ? (

                    <section className="reportes-loading">

                        <div className="reportes-spinner" />

                        <p>
                            Procesando información...
                        </p>

                    </section>

                ) : reporte ? (
                    <>

                        <div className="reportes-results-header">

                            <div>
                                <h2>
                                    Resumen del periodo
                                </h2>

                                <p>
                                    Resultado obtenido
                                    según los filtros
                                    seleccionados.
                                </p>
                            </div>

                            <button
                                className="download-report-button"
                                onClick={() =>
                                    generarReportePDF(
                                        reporte
                                    )
                                }
                                disabled={
                                    reporte
                                        .detalle
                                        .length ===
                                    0
                                }
                            >
                                Descargar PDF
                            </button>

                        </div>

                        <section className="reportes-summary-grid">

                            <article className="reportes-summary-card">

                                <div className="reportes-summary-icon total">
                                    ☷
                                </div>

                                <div>
                                    <span>
                                        Total de turnos
                                    </span>

                                    <strong>
                                        {
                                            resumen.totalTurnos
                                        }
                                    </strong>
                                </div>

                            </article>

                            <article className="reportes-summary-card">

                                <div className="reportes-summary-icon finished">
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

                            <article className="reportes-summary-card">

                                <div className="reportes-summary-icon absent">
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

                            <article className="reportes-summary-card">

                                <div className="reportes-summary-icon cancelled">
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

                            <article className="reportes-summary-card">

                                <div className="reportes-summary-icon percentage">
                                    %
                                </div>

                                <div>
                                    <span>
                                        Tasa de finalización
                                    </span>

                                    <strong>
                                        {
                                            resumen.porcentajeFinalizacion
                                        }
                                        %
                                    </strong>
                                </div>

                            </article>

                            <article className="reportes-summary-card">

                                <div className="reportes-summary-icon procedure">
                                    ▣
                                </div>

                                <div>
                                    <span>
                                        Trámite más solicitado
                                    </span>

                                    <strong className="reportes-long-value">
                                        {tramiteMasSolicitado
                                            ?.nombre ||
                                            "Sin información"}
                                    </strong>

                                    {tramiteMasSolicitado && (
                                        <small>
                                            {
                                                tramiteMasSolicitado.cantidad
                                            }{" "}
                                            turnos
                                        </small>
                                    )}
                                </div>

                            </article>

                        </section>

                        <section className="reportes-charts-grid">

                            <article className="report-chart-card report-chart-wide">

                                <div className="report-chart-header">

                                    <h3>
                                        Evolución de turnos
                                    </h3>

                                    <p>
                                        Cantidad de turnos
                                        registrados durante
                                        el periodo.
                                    </p>

                                </div>

                                {tendencia.length >
                                0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={290}
                                    >
                                        <LineChart
                                            data={
                                                tendencia
                                            }
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#e4edf5"
                                            />

                                            <XAxis
                                                dataKey="periodo"
                                                tick={{
                                                    fontSize: 12,
                                                }}
                                            />

                                            <YAxis
                                                allowDecimals={
                                                    false
                                                }
                                                tick={{
                                                    fontSize: 12,
                                                }}
                                            />

                                            <Tooltip />

                                            <Line
                                                type="monotone"
                                                dataKey="cantidad"
                                                name="Turnos"
                                                stroke="#1976d2"
                                                strokeWidth={
                                                    3
                                                }
                                                activeDot={{
                                                    r: 6,
                                                }}
                                            />

                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="report-chart-empty">
                                        No existen datos para
                                        mostrar.
                                    </div>
                                )}

                            </article>

                            <article className="report-chart-card">

                                <div className="report-chart-header">

                                    <h3>
                                        Distribución por estado
                                    </h3>

                                    <p>
                                        Participación de cada
                                        estado en el periodo.
                                    </p>

                                </div>

                                {distribucionEstados.length >
                                0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={290}
                                    >
                                        <PieChart>

                                            <Pie
                                                data={
                                                    distribucionEstados
                                                }
                                                dataKey="cantidad"
                                                nameKey="estado"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={
                                                    90
                                                }
                                                label
                                            >
                                                {distribucionEstados.map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (
                                                        <Cell
                                                            key={
                                                                item.estado
                                                            }
                                                            fill={
                                                                COLORES_ESTADOS[
                                                                    index %
                                                                        COLORES_ESTADOS.length
                                                                ]
                                                            }
                                                        />
                                                    )
                                                )}
                                            </Pie>

                                            <Tooltip />

                                            <Legend />

                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="report-chart-empty">
                                        No existen datos para
                                        mostrar.
                                    </div>
                                )}

                            </article>

                            <article className="report-chart-card report-chart-full">

                                <div className="report-chart-header">

                                    <h3>
                                        Trámites más solicitados
                                    </h3>

                                    <p>
                                        Comparación de la
                                        cantidad de turnos por
                                        tipo de trámite.
                                    </p>

                                </div>

                                {tramites.length >
                                0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={300}
                                    >
                                        <BarChart
                                            data={
                                                tramites
                                            }
                                            layout="vertical"
                                            margin={{
                                                left: 20,
                                                right: 25,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#e4edf5"
                                            />

                                            <XAxis
                                                type="number"
                                                allowDecimals={
                                                    false
                                                }
                                            />

                                            <YAxis
                                                type="category"
                                                dataKey="tramite"
                                                width={170}
                                                tick={{
                                                    fontSize: 12,
                                                }}
                                            />

                                            <Tooltip />

                                            <Bar
                                                dataKey="cantidad"
                                                name="Turnos"
                                                fill="#1976d2"
                                                radius={[
                                                    0,
                                                    8,
                                                    8,
                                                    0,
                                                ]}
                                            />

                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="report-chart-empty">
                                        No existen datos para
                                        mostrar.
                                    </div>
                                )}

                            </article>

                        </section>

                        <section className="reportes-table-section">

                            <div className="reportes-table-header">

                                <div>
                                    <h2>
                                        Detalle del reporte
                                    </h2>

                                    <p>
                                        Turnos incluidos en
                                        la consulta realizada.
                                    </p>
                                </div>

                                <span>
                                    {
                                        reporte.detalle
                                            .length
                                    }{" "}
                                    registros
                                </span>

                            </div>

                            {reporte.detalle
                                .length ===
                            0 ? (

                                <div className="reportes-empty">

                                    <div className="reportes-empty-icon">
                                        ▥
                                    </div>

                                    <h3>
                                        Sin resultados
                                    </h3>

                                    <p>
                                        No existen turnos que
                                        coincidan con los
                                        filtros seleccionados.
                                    </p>

                                </div>

                            ) : (

                                <div className="reportes-table-container">

                                    <table className="reportes-table">

                                        <thead>
                                            <tr>
                                                <th>
                                                    Turno
                                                </th>

                                                <th>
                                                    Fecha y hora
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
                                            </tr>
                                        </thead>

                                        <tbody>

                                            {reporte.detalle.map(
                                                (
                                                    turno
                                                ) => (

                                                    <tr
                                                        key={
                                                            turno.idTurno
                                                        }
                                                    >

                                                        <td>
                                                            <strong className="reportes-turn-code">
                                                                {
                                                                    turno.codigoTurno
                                                                }
                                                            </strong>
                                                        </td>

                                                        <td>
                                                            {formatearFechaHora(
                                                                turno.fechaRegistro
                                                            )}
                                                        </td>

                                                        <td>
                                                            <strong className="reportes-procedure">
                                                                {
                                                                    turno.tramite
                                                                }
                                                            </strong>
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`reportes-status ${obtenerClaseEstado(
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

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            )}

                        </section>

                    </>
                ) : (
                    <section className="reportes-empty initial">

                        <div className="reportes-empty-icon">
                            ▥
                        </div>

                        <h3>
                            Consulte un reporte
                        </h3>

                        <p>
                            Seleccione un periodo para
                            consultar la información
                            histórica de su sede.
                        </p>

                    </section>
                )}

            </main>

        </div>
    );
}