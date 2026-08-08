import pool from "../config/database.js";

export async function iniciarSesionAsesor(req, res) {
    try {
        const { usuario, contrasena } = req.body;

        if (
            !usuario ||
            usuario.trim() === "" ||
            !contrasena ||
            contrasena.trim() === ""
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Ingrese su usuario y contraseña.",
            });
        }

        const resultado = await pool.query(
            `
            SELECT
                a.id_asesor,
                a.usuario,
                a.nombres,
                a.apellidos,
                a.correo,
                a.rol,
                a.ventanilla,
                a.turno_trabajo,
                a.estado,

                s.id_sede,
                s.codigo AS codigo_sede,
                s.nombre AS nombre_sede,
                s.direccion AS direccion_sede

            FROM asesores AS a

            INNER JOIN sedes AS s
                ON s.id_sede = a.id_sede

            WHERE LOWER(a.usuario) = LOWER($1)

              AND a.contrasena_hash = crypt(
                  $2,
                  a.contrasena_hash
              )

            LIMIT 1
            `,
            [
                usuario.trim(),
                contrasena,
            ]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                ok: false,
                mensaje:
                    "Usuario o contraseña incorrectos.",
            });
        }

        const asesor = resultado.rows[0];

        if (!asesor.estado) {
            return res.status(403).json({
                ok: false,
                mensaje:
                    "La cuenta del asesor se encuentra inactiva.",
            });
        }

        await pool.query(
            `
            UPDATE asesores
            SET ultima_conexion = CURRENT_TIMESTAMP
            WHERE id_asesor = $1
            `,
            [asesor.id_asesor]
        );

        return res.status(200).json({
            ok: true,
            mensaje: "Inicio de sesión correcto.",

            asesor: {
                idAsesor: asesor.id_asesor,
                usuario: asesor.usuario,
                nombres: asesor.nombres,
                apellidos: asesor.apellidos,
                nombreCompleto:
                    `${asesor.nombres} ${asesor.apellidos}`,

                correo: asesor.correo,
                rol: asesor.rol,

                idSede: asesor.id_sede,
                codigoSede: asesor.codigo_sede,
                sede: asesor.nombre_sede,
                direccionSede:
                    asesor.direccion_sede,

                ventanilla: asesor.ventanilla,
                turnoTrabajo:
                    asesor.turno_trabajo,
            },
        });

    } catch (error) {
        console.error(
            "Error al iniciar sesión del asesor:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "Ocurrió un error al iniciar sesión.",
            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    }
}
export async function obtenerDashboardAsesor(req, res) {
    try {
        const idSede = Number(
            req.params.idSede
        );

        if (
            !Number.isInteger(idSede) ||
            idSede <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "La sede indicada no es válida.",
            });
        }

        const sedeResultado =
            await pool.query(
                `
                SELECT
                    id_sede,
                    codigo,
                    nombre
                FROM sedes
                WHERE id_sede = $1
                LIMIT 1
                `,
                [idSede]
            );

        if (
            sedeResultado.rows.length ===
            0
        ) {
            return res.status(404).json({
                ok: false,
                mensaje:
                    "La sede no existe.",
            });
        }

        const resumenResultado =
            await pool.query(
                `
                SELECT
                    COUNT(*)::int
                        AS total_hoy,

                    COUNT(*) FILTER (
                        WHERE estado = 'EN_ESPERA'
                    )::int
                        AS en_espera,

                    COUNT(*) FILTER (
                        WHERE estado = 'LLAMADO'
                    )::int
                        AS llamados,

                    COUNT(*) FILTER (
                        WHERE estado = 'EN_ATENCION'
                    )::int
                        AS en_atencion,

                    COUNT(*) FILTER (
                        WHERE estado = 'FINALIZADO'
                    )::int
                        AS finalizados,

                    COUNT(*) FILTER (
                        WHERE estado = 'AUSENTE'
                    )::int
                        AS ausentes,

                    COUNT(*) FILTER (
                        WHERE estado = 'CANCELADO'
                    )::int
                        AS cancelados

                FROM vw_turnos_detalle

                WHERE id_sede = $1
                  AND fecha_registro::date =
                      CURRENT_DATE
                `,
                [idSede]
            );

        const actividadResultado =
            await pool.query(
                `
                SELECT
                    id_turno,
                    codigo_turno,
                    estado,
                    nombre_tramite,
                    nombre_sede,
                    ventanilla_atencion,
                    fecha_registro

                FROM vw_turnos_detalle

                WHERE id_sede = $1
                  AND fecha_registro::date =
                      CURRENT_DATE

                ORDER BY fecha_registro DESC

                LIMIT 8
                `,
                [idSede]
            );

        const sede =
            sedeResultado.rows[0];

        const resumen =
            resumenResultado.rows[0];

        return res.status(200).json({
            ok: true,

            sede: {
                idSede:
                    sede.id_sede,
                codigo:
                    sede.codigo,
                nombre:
                    sede.nombre,
            },

            fecha:
                new Date()
                    .toISOString()
                    .split("T")[0],

            resumen: {
                totalHoy:
                    resumen.total_hoy,

                enEspera:
                    resumen.en_espera,

                llamados:
                    resumen.llamados,

                enAtencion:
                    resumen.en_atencion,

                finalizados:
                    resumen.finalizados,

                ausentes:
                    resumen.ausentes,

                cancelados:
                    resumen.cancelados,
            },

            actividadReciente:
                actividadResultado.rows.map(
                    (turno) => ({
                        idTurno:
                            turno.id_turno,

                        codigoTurno:
                            turno.codigo_turno,

                        estado:
                            turno.estado,

                        tramite:
                            turno.nombre_tramite,

                        sede:
                            turno.nombre_sede,

                        ventanilla:
                            turno
                                .ventanilla_atencion,

                        fechaRegistro:
                            turno
                                .fecha_registro,
                    })
                ),
        });
    } catch (error) {
        console.error(
            "Error al obtener dashboard:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No se pudo obtener la información del dashboard.",
            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    }
}