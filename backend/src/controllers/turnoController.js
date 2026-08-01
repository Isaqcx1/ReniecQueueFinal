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