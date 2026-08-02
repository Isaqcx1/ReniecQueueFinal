import pool from "../config/database.js";

export async function asignarTurno(req, res) {
    try {
        const {
            dni,
            codigoSede,
            codigoTramite,
        } = req.body;

        if (
            !dni ||
            !codigoSede ||
            !codigoTramite
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "Debe enviar el DNI, la sede y el trámite.",
            });
        }

        const dniLimpio = String(dni).trim();
        const sedeLimpia = String(
            codigoSede
        )
            .trim()
            .toUpperCase();

        const tramiteLimpio = String(
            codigoTramite
        )
            .trim()
            .toUpperCase();

        if (!/^\d{8}$/.test(dniLimpio)) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El DNI debe contener exactamente 8 dígitos.",
            });
        }

        /*
        Buscar al usuario registrado en la aplicación.
        */
        const resultadoUsuario =
            await pool.query(
                `
                SELECT
                    u.id_usuario,
                    u.dni,
                    u.estado
                FROM usuarios AS u
                WHERE u.dni = $1
                LIMIT 1
                `,
                [dniLimpio]
            );

        if (
            resultadoUsuario.rows.length === 0
        ) {
            return res.status(404).json({
                ok: false,
                mensaje:
                    "El ciudadano no tiene una cuenta registrada.",
            });
        }

        const usuario =
            resultadoUsuario.rows[0];

        if (!usuario.estado) {
            return res.status(403).json({
                ok: false,
                mensaje:
                    "La cuenta del ciudadano se encuentra inactiva.",
            });
        }

        /*
        Buscar la sede.
        */
        const resultadoSede =
            await pool.query(
                `
                SELECT
                    s.id_sede,
                    s.codigo,
                    s.nombre,
                    s.estado
                FROM sedes AS s
                WHERE UPPER(s.codigo) = $1
                LIMIT 1
                `,
                [sedeLimpia]
            );

        if (
            resultadoSede.rows.length === 0
        ) {
            return res.status(404).json({
                ok: false,
                mensaje:
                    "La sede seleccionada no existe.",
            });
        }

        const sede = resultadoSede.rows[0];

        if (!sede.estado) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "La sede seleccionada no se encuentra disponible.",
            });
        }

        /*
        Buscar el trámite.
        */
        const resultadoTramite =
            await pool.query(
                `
                SELECT
                    t.id_tramite,
                    t.codigo,
                    t.nombre,
                    t.estado
                FROM tramites AS t
                WHERE UPPER(t.codigo) = $1
                LIMIT 1
                `,
                [tramiteLimpio]
            );

        if (
            resultadoTramite.rows.length ===
            0
        ) {
            return res.status(404).json({
                ok: false,
                mensaje:
                    "El trámite seleccionado no existe.",
            });
        }

        const tramite =
            resultadoTramite.rows[0];

        if (!tramite.estado) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El trámite seleccionado no se encuentra disponible.",
            });
        }

        /*
        Ejecutar la función de PostgreSQL que:
        - crea la cola diaria si no existe;
        - valida que no tenga otro turno activo;
        - genera el siguiente número;
        - guarda el turno;
        - registra el historial.
        */
        const resultadoTurno =
            await pool.query(
                `
                SELECT *
                FROM registrar_turno(
                    $1,
                    $2,
                    $3
                )
                `,
                [
                    usuario.id_usuario,
                    sede.id_sede,
                    tramite.id_tramite,
                ]
            );

        if (
            resultadoTurno.rows.length === 0
        ) {
            return res.status(500).json({
                ok: false,
                mensaje:
                    "No se pudo generar el turno.",
            });
        }

        const turno =
            resultadoTurno.rows[0];

        return res.status(201).json({
            ok: true,
            mensaje:
                "Turno asignado correctamente.",

            turno: {
                idTurno: turno.id_turno,
                codigoTurno:
                    turno.codigo_turno,
                numeroTurno:
                    turno.numero_turno,
                estado: turno.estado,
                personasDelante:
                    Number(
                        turno.personas_delante
                    ),
                tiempoEstimadoMinutos:
                    Number(
                        turno.tiempo_estimado_minutos
                    ),

                sede: {
                    idSede: sede.id_sede,
                    codigo: sede.codigo,
                    nombre: sede.nombre,
                },

                tramite: {
                    idTramite:
                        tramite.id_tramite,
                    codigo: tramite.codigo,
                    nombre: tramite.nombre,
                },
            },
        });
    } catch (error) {
        console.error(
            "Error al asignar el turno:",
            error
        );

        /*
        Error generado por la validación de
        turno activo dentro de PostgreSQL.
        */
        if (
            error.message?.includes(
                "ya tiene un turno activo"
            )
        ) {
            return res.status(409).json({
                ok: false,
                mensaje:
                    "Ya estás registrado en una cola virtual y tienes un turno activo.",
            });
        }

        if (
            error.message?.includes(
                "no está disponible en la sede"
            )
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El trámite no está disponible en la sede seleccionada.",
            });
        }

        if (
            error.message?.includes(
                "no se encuentra abierta"
            )
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "La cola seleccionada no se encuentra abierta.",
            });
        }

        return res.status(500).json({
            ok: false,
            mensaje:
                "Ocurrió un error al asignar el turno.",
            error:
                process.env.NODE_ENV ===
                    "development"
                    ? error.message
                    : undefined,
        });
    }
}
export async function obtenerColaPorSede(req, res) {
    try {
        const { idSede } = req.params;

        const idSedeNumero = Number(idSede);

        if (
            !Number.isInteger(idSedeNumero) ||
            idSedeNumero <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El identificador de la sede no es válido.",
            });
        }

        /*
        Primero comprobamos que la sede exista.
        */
        const resultadoSede = await pool.query(
            `
            SELECT
                s.id_sede,
                s.codigo,
                s.nombre,
                s.direccion,
                s.estado
            FROM sedes AS s
            WHERE s.id_sede = $1
            LIMIT 1
            `,
            [idSedeNumero]
        );

        if (resultadoSede.rows.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje:
                    "La sede solicitada no existe.",
            });
        }

        const sede = resultadoSede.rows[0];

        if (!sede.estado) {
            return res.status(403).json({
                ok: false,
                mensaje:
                    "La sede se encuentra inactiva.",
            });
        }

        /*
        Obtener los turnos activos de la sede.
        */
        const resultadoCola = await pool.query(
            `
            SELECT
                vd.id_turno,
                vd.codigo_turno,
                vd.numero_turno,
                vd.dni,
                vd.nombre_completo,
                vd.codigo_tramite,
                vd.nombre_tramite,
                vd.estado,
                vd.personas_delante,
                vd.tiempo_estimado_minutos,
                vd.ventanilla_atencion,
                vd.fecha_registro,
                vd.fecha_llamado,
                vd.fecha_inicio_atencion
            FROM vw_turnos_detalle AS vd
            WHERE vd.id_sede = $1
              AND vd.estado IN (
                  'EN_ESPERA',
                  'LLAMADO',
                  'EN_ATENCION'
              )
            ORDER BY
                CASE vd.estado
                    WHEN 'EN_ATENCION' THEN 1
                    WHEN 'LLAMADO' THEN 2
                    WHEN 'EN_ESPERA' THEN 3
                    ELSE 4
                END,
                vd.fecha_registro ASC
            `,
            [idSedeNumero]
        );

        const cola = resultadoCola.rows.map(
            (turno) => ({
                idTurno: turno.id_turno,
                codigoTurno:
                    turno.codigo_turno,
                numeroTurno:
                    turno.numero_turno,

                ciudadano: {
                    dni: turno.dni,
                    nombreCompleto:
                        turno.nombre_completo,
                },

                tramite: {
                    codigo:
                        turno.codigo_tramite,
                    nombre:
                        turno.nombre_tramite,
                },

                estado: turno.estado,

                personasDelante: Number(
                    turno.personas_delante
                ),

                tiempoEstimadoMinutos: Number(
                    turno.tiempo_estimado_minutos
                ),

                ventanilla:
                    turno.ventanilla_atencion,

                fechaRegistro:
                    turno.fecha_registro,

                fechaLlamado:
                    turno.fecha_llamado,

                fechaInicioAtencion:
                    turno.fecha_inicio_atencion,
            })
        );

        const resumen = {
            totalActivos: cola.length,

            enEspera: cola.filter(
                (turno) =>
                    turno.estado === "EN_ESPERA"
            ).length,

            llamados: cola.filter(
                (turno) =>
                    turno.estado === "LLAMADO"
            ).length,

            enAtencion: cola.filter(
                (turno) =>
                    turno.estado === "EN_ATENCION"
            ).length,
        };

        return res.status(200).json({
            ok: true,

            mensaje:
                cola.length > 0
                    ? "Cola obtenida correctamente."
                    : "La sede no tiene turnos activos.",

            sede: {
                idSede: sede.id_sede,
                codigo: sede.codigo,
                nombre: sede.nombre,
                direccion: sede.direccion,
            },

            resumen,
            cola,
        });
    } catch (error) {
        console.error(
            "Error al consultar la cola:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "Ocurrió un error al consultar la cola de atención.",

            error:
                process.env.NODE_ENV ===
                    "development"
                    ? error.message
                    : undefined,
        });
    }
}