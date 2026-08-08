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
export async function llamarSiguienteTurno(req, res) {
    const client = await pool.connect();

    try {
        const { idAsesor } = req.body;
        const idAsesorNumero = Number(idAsesor);

        if (
            !Number.isInteger(idAsesorNumero) ||
            idAsesorNumero <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El identificador del asesor no es válido.",
            });
        }

        await client.query("BEGIN");

        // Buscar los datos del asesor.
        const resultadoAsesor = await client.query(
            `
            SELECT
                a.id_asesor,
                a.usuario,
                a.nombres,
                a.apellidos,
                a.id_sede,
                a.ventanilla,
                a.estado,
                s.codigo AS codigo_sede,
                s.nombre AS nombre_sede
            FROM asesores AS a
            INNER JOIN sedes AS s
                ON s.id_sede = a.id_sede
            WHERE a.id_asesor = $1
            LIMIT 1
            FOR UPDATE OF a
            `,
            [idAsesorNumero]
        );

        if (resultadoAsesor.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                ok: false,
                mensaje:
                    "El asesor solicitado no existe.",
            });
        }

        const asesor = resultadoAsesor.rows[0];

        if (!asesor.estado) {
            await client.query("ROLLBACK");

            return res.status(403).json({
                ok: false,
                mensaje:
                    "La cuenta del asesor se encuentra inactiva.",
            });
        }

        if (!asesor.id_sede) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                ok: false,
                mensaje:
                    "El asesor no tiene una sede asignada.",
            });
        }

        /*
        Comprobar si el asesor ya tiene un turno
        llamado o en atención.

        codigo_turno se obtiene desde la vista.
        */
        const resultadoTurnoActual = await client.query(
            `
            SELECT
                t.id_turno,
                vd.codigo_turno,
                t.estado,
                t.ventanilla_atencion
            FROM turnos AS t
            INNER JOIN vw_turnos_detalle AS vd
                ON vd.id_turno = t.id_turno
            WHERE t.id_asesor = $1
              AND t.estado IN (
                  'LLAMADO',
                  'EN_ATENCION'
              )
            ORDER BY t.fecha_registro ASC
            LIMIT 1
            `,
            [idAsesorNumero]
        );

        if (resultadoTurnoActual.rows.length > 0) {
            const turnoActual =
                resultadoTurnoActual.rows[0];

            await client.query("ROLLBACK");

            return res.status(409).json({
                ok: false,
                mensaje:
                    `Ya tienes el turno ${turnoActual.codigo_turno} en estado ${turnoActual.estado}. Debes terminarlo antes de llamar al siguiente ciudadano.`,

                turnoActual: {
                    idTurno:
                        turnoActual.id_turno,

                    codigoTurno:
                        turnoActual.codigo_turno,

                    estado:
                        turnoActual.estado,

                    ventanilla:
                        turnoActual
                            .ventanilla_atencion,
                },
            });
        }

        /*
        Buscar el turno más antiguo en espera
        perteneciente a la sede del asesor.
        */
        const resultadoSiguienteTurno =
            await client.query(
                `
                SELECT
                    t.id_turno,
                    t.id_usuario,
                    t.numero_turno,
                    t.fecha_registro,

                    vd.codigo_turno,

                    u.dni,

                    CONCAT_WS(
                        ' ',
                        cr.nombres,
                        cr.apellido_paterno,
                        cr.apellido_materno
                    ) AS nombre_completo,

                    tr.id_tramite,
                    tr.codigo AS codigo_tramite,
                    tr.nombre AS nombre_tramite,

                    c.id_cola,
                    c.id_sede

                FROM turnos AS t

                INNER JOIN colas AS c
                    ON c.id_cola = t.id_cola

                INNER JOIN usuarios AS u
                    ON u.id_usuario = t.id_usuario

                INNER JOIN ciudadanos_reniec AS cr
                    ON cr.dni = u.dni

                INNER JOIN tramites AS tr
                    ON tr.id_tramite = c.id_tramite

                INNER JOIN vw_turnos_detalle AS vd
                    ON vd.id_turno = t.id_turno

                WHERE c.id_sede = $1
                  AND c.fecha = CURRENT_DATE
                  AND c.estado = 'ABIERTA'
                  AND t.estado = 'EN_ESPERA'

                ORDER BY
                    t.fecha_registro ASC,
                    t.numero_turno ASC

                LIMIT 1

                FOR UPDATE OF t SKIP LOCKED
                `,
                [asesor.id_sede]
            );

        if (
            resultadoSiguienteTurno.rows.length === 0
        ) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                ok: false,
                mensaje:
                    "Actualmente no existen ciudadanos esperando en la cola de esta sede.",
            });
        }

        const siguienteTurno =
            resultadoSiguienteTurno.rows[0];

        /*
        Actualizar el turno.

        No usamos codigo_turno en RETURNING porque
        esa columna no existe en la tabla turnos.
        */
        const resultadoActualizacion =
            await client.query(
                `
                UPDATE turnos
                SET
                    estado = 'LLAMADO',
                    id_asesor = $1,
                    ventanilla_atencion = $2,
                    fecha_llamado =
                        CURRENT_TIMESTAMP,
                    observacion =
                        'Turno llamado por el asesor'
                WHERE id_turno = $3
                RETURNING
                    id_turno,
                    numero_turno,
                    estado,
                    id_asesor,
                    ventanilla_atencion,
                    fecha_registro,
                    fecha_llamado
                `,
                [
                    asesor.id_asesor,
                    asesor.ventanilla,
                    siguienteTurno.id_turno,
                ]
            );

        const turnoActualizado =
            resultadoActualizacion.rows[0];

        await client.query("COMMIT");

        return res.status(200).json({
            ok: true,

            mensaje:
                `Turno ${siguienteTurno.codigo_turno} llamado correctamente.`,

            turno: {
                idTurno:
                    turnoActualizado.id_turno,

                codigoTurno:
                    siguienteTurno.codigo_turno,

                numeroTurno:
                    turnoActualizado.numero_turno,

                estado:
                    turnoActualizado.estado,

                ciudadano: {
                    dni: siguienteTurno.dni,

                    nombreCompleto:
                        siguienteTurno.nombre_completo,
                },

                tramite: {
                    idTramite:
                        siguienteTurno.id_tramite,

                    codigo:
                        siguienteTurno.codigo_tramite,

                    nombre:
                        siguienteTurno.nombre_tramite,
                },

                sede: {
                    idSede:
                        asesor.id_sede,

                    codigo:
                        asesor.codigo_sede,

                    nombre:
                        asesor.nombre_sede,
                },

                asesor: {
                    idAsesor:
                        asesor.id_asesor,

                    nombreCompleto:
                        `${asesor.nombres} ${asesor.apellidos}`,

                    ventanilla:
                        turnoActualizado
                            .ventanilla_atencion,
                },

                fechaRegistro:
                    turnoActualizado.fecha_registro,

                fechaLlamado:
                    turnoActualizado.fecha_llamado,
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Error al llamar el siguiente turno:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "Ocurrió un error al llamar al siguiente turno.",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    } finally {
        client.release();
    }
}
export async function actualizarEstadoTurno(req, res) {
    const client = await pool.connect();

    try {
        const idTurno = Number(req.params.idTurno);
        const idAsesor = Number(req.body.idAsesor);
        const nuevoEstado = String(
            req.body.nuevoEstado || ""
        )
            .trim()
            .toUpperCase();

        if (
            !Number.isInteger(idTurno) ||
            idTurno <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El identificador del turno no es válido.",
            });
        }

        if (
            !Number.isInteger(idAsesor) ||
            idAsesor <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El identificador del asesor no es válido.",
            });
        }

        const estadosPermitidos = [
            "EN_ATENCION",
            "AUSENTE",
            "FINALIZADO",
        ];

        if (
            !estadosPermitidos.includes(
                nuevoEstado
            )
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El nuevo estado solicitado no es válido.",
            });
        }

        await client.query("BEGIN");

        /*
        Buscar y validar al asesor.
        */
        const resultadoAsesor =
            await client.query(
                `
                SELECT
                    a.id_asesor,
                    a.nombres,
                    a.apellidos,
                    a.id_sede,
                    a.ventanilla,
                    a.estado,
                    s.nombre AS nombre_sede
                FROM asesores AS a
                INNER JOIN sedes AS s
                    ON s.id_sede = a.id_sede
                WHERE a.id_asesor = $1
                LIMIT 1
                FOR UPDATE OF a
                `,
                [idAsesor]
            );

        if (
            resultadoAsesor.rows.length === 0
        ) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                ok: false,
                mensaje:
                    "El asesor solicitado no existe.",
            });
        }

        const asesor =
            resultadoAsesor.rows[0];

        if (!asesor.estado) {
            await client.query("ROLLBACK");

            return res.status(403).json({
                ok: false,
                mensaje:
                    "La cuenta del asesor se encuentra inactiva.",
            });
        }

        /*
        Buscar y bloquear el turno.
        El código se obtiene desde la vista porque
        codigo_turno no existe en la tabla turnos.
        */
        const resultadoTurno =
            await client.query(
                `
                SELECT
                    t.id_turno,
                    t.id_asesor,
                    t.id_usuario,
                    t.id_cola,
                    t.numero_turno,
                    t.estado,
                    t.ventanilla_atencion,
                    t.fecha_registro,
                    t.fecha_llamado,
                    t.fecha_inicio_atencion,

                    vd.codigo_turno,
                    vd.dni,
                    vd.nombre_completo,
                    vd.nombre_tramite,

                    c.id_sede

                FROM turnos AS t

                INNER JOIN colas AS c
                    ON c.id_cola = t.id_cola

                INNER JOIN vw_turnos_detalle AS vd
                    ON vd.id_turno = t.id_turno

                WHERE t.id_turno = $1
                LIMIT 1
                FOR UPDATE OF t
                `,
                [idTurno]
            );

        if (
            resultadoTurno.rows.length === 0
        ) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                ok: false,
                mensaje:
                    "El turno solicitado no existe.",
            });
        }

        const turno =
            resultadoTurno.rows[0];

        /*
        El turno debe pertenecer a la misma sede.
        */
        if (
            Number(turno.id_sede) !==
            Number(asesor.id_sede)
        ) {
            await client.query("ROLLBACK");

            return res.status(403).json({
                ok: false,
                mensaje:
                    "El turno pertenece a una sede diferente a la del asesor.",
            });
        }

        /*
        El turno debe estar asignado al asesor
        que intenta actualizarlo.
        */
        if (
            Number(turno.id_asesor) !==
            idAsesor
        ) {
            await client.query("ROLLBACK");

            return res.status(403).json({
                ok: false,
                mensaje:
                    "El turno está asignado a otro asesor.",
            });
        }

        /*
        Definir las transiciones válidas.
        */
        const transicionesPermitidas = {
            LLAMADO: [
                "EN_ATENCION",
                "AUSENTE",
            ],
            EN_ATENCION: [
                "FINALIZADO",
            ],
        };

        const siguientesEstados =
            transicionesPermitidas[
                turno.estado
            ] || [];

        if (
            !siguientesEstados.includes(
                nuevoEstado
            )
        ) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                ok: false,
                mensaje:
                    `No se puede cambiar el turno de ${turno.estado} a ${nuevoEstado}.`,
            });
        }

        let consultaActualizacion = "";
        let observacion = "";

        if (
            nuevoEstado === "EN_ATENCION"
        ) {
            consultaActualizacion = `
                UPDATE turnos
                SET
                    estado = 'EN_ATENCION',
                    fecha_inicio_atencion =
                        CURRENT_TIMESTAMP,
                    observacion =
                        'Atención iniciada por el asesor'
                WHERE id_turno = $1
                RETURNING
                    id_turno,
                    numero_turno,
                    estado,
                    id_asesor,
                    ventanilla_atencion,
                    fecha_registro,
                    fecha_llamado,
                    fecha_inicio_atencion,
                    fecha_finalizacion
            `;

            observacion =
                "La atención del ciudadano fue iniciada.";
        }

        if (
            nuevoEstado === "AUSENTE"
        ) {
            consultaActualizacion = `
                UPDATE turnos
                SET
                    estado = 'AUSENTE',
                    fecha_finalizacion =
                        CURRENT_TIMESTAMP,
                    observacion =
                        'Ciudadano ausente al momento del llamado'
                WHERE id_turno = $1
                RETURNING
                    id_turno,
                    numero_turno,
                    estado,
                    id_asesor,
                    ventanilla_atencion,
                    fecha_registro,
                    fecha_llamado,
                    fecha_inicio_atencion,
                    fecha_finalizacion
            `;

            observacion =
                "El ciudadano fue marcado como ausente.";
        }

        if (
            nuevoEstado === "FINALIZADO"
        ) {
            consultaActualizacion = `
                UPDATE turnos
                SET
                    estado = 'FINALIZADO',
                    fecha_finalizacion =
                        CURRENT_TIMESTAMP,
                    observacion =
                        'Atención finalizada correctamente'
                WHERE id_turno = $1
                RETURNING
                    id_turno,
                    numero_turno,
                    estado,
                    id_asesor,
                    ventanilla_atencion,
                    fecha_registro,
                    fecha_llamado,
                    fecha_inicio_atencion,
                    fecha_finalizacion
            `;

            observacion =
                "La atención fue finalizada correctamente.";
        }

        const resultadoActualizacion =
            await client.query(
                consultaActualizacion,
                [idTurno]
            );

        const turnoActualizado =
            resultadoActualizacion.rows[0];

        await client.query("COMMIT");

        return res.status(200).json({
            ok: true,
            mensaje: observacion,

            turno: {
                idTurno:
                    turnoActualizado.id_turno,

                codigoTurno:
                    turno.codigo_turno,

                numeroTurno:
                    turnoActualizado.numero_turno,

                estadoAnterior:
                    turno.estado,

                estado:
                    turnoActualizado.estado,

                ciudadano: {
                    dni: turno.dni,
                    nombreCompleto:
                        turno.nombre_completo,
                },

                tramite: {
                    nombre:
                        turno.nombre_tramite,
                },

                asesor: {
                    idAsesor:
                        asesor.id_asesor,

                    nombreCompleto:
                        `${asesor.nombres} ${asesor.apellidos}`,

                    ventanilla:
                        turnoActualizado
                            .ventanilla_atencion,
                },

                fechaRegistro:
                    turnoActualizado.fecha_registro,

                fechaLlamado:
                    turnoActualizado.fecha_llamado,

                fechaInicioAtencion:
                    turnoActualizado
                        .fecha_inicio_atencion,

                fechaFinalizacion:
                    turnoActualizado
                        .fecha_finalizacion,
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Error al actualizar el turno:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "Ocurrió un error al actualizar el estado del turno.",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    } finally {
        client.release();
    }
}
export async function obtenerTurnoActivo(req, res) {
    try {
        const dni = String(
            req.params.dni || ""
        ).trim();

        if (!/^\d{8}$/.test(dni)) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El DNI debe contener exactamente 8 dígitos.",
            });
        }

        /*
        Buscar el último turno del ciudadano
        correspondiente al día actual.

        personas_delante se calcula nuevamente
        en cada consulta para mantener el dato
        actualizado.
        */
        const resultado = await pool.query(
            `
            SELECT
                t.id_turno,
                t.id_cola,
                t.numero_turno,
                t.estado,
                t.ventanilla_atencion,
                t.fecha_registro,
                t.fecha_llamado,
                t.fecha_inicio_atencion,
                t.fecha_finalizacion,

                vd.codigo_turno,

                vd.id_sede,
                vd.codigo_sede,
                vd.nombre_sede,

                vd.id_tramite,
                vd.codigo_tramite,
                vd.nombre_tramite,

                vd.id_asesor,
                vd.nombre_asesor,

                (
                    SELECT COUNT(*)::INTEGER
                    FROM turnos AS anterior
                    WHERE anterior.id_cola =
                        t.id_cola
                      AND anterior.numero_turno <
                        t.numero_turno
                      AND anterior.estado IN (
                          'EN_ESPERA',
                          'LLAMADO',
                          'EN_ATENCION'
                      )
                ) AS personas_delante

            FROM turnos AS t

            INNER JOIN usuarios AS u
                ON u.id_usuario = t.id_usuario

            INNER JOIN colas AS c
                ON c.id_cola = t.id_cola

            INNER JOIN vw_turnos_detalle AS vd
                ON vd.id_turno = t.id_turno

            WHERE u.dni = $1
              AND c.fecha = CURRENT_DATE

            ORDER BY t.id_turno DESC
            LIMIT 1
            `,
            [dni]
        );

        if (resultado.rows.length === 0) {
            return res.status(200).json({
                ok: true,
                tieneTurno: false,
                tieneTurnoActivo: false,
                mensaje:
                    "El ciudadano no tiene un turno registrado para hoy.",
                turno: null,
            });
        }

        const registro = resultado.rows[0];

        const estadosActivos = [
            "EN_ESPERA",
            "LLAMADO",
            "EN_ATENCION",
        ];

        const tieneTurnoActivo =
            estadosActivos.includes(
                registro.estado
            );

        /*
        Las personas delante solo se muestran
        mientras el ciudadano está esperando.
        */
        const personasDelante =
            registro.estado === "EN_ESPERA"
                ? Number(
                      registro.personas_delante
                  )
                : 0;

        /*
        Para el prototipo se considera un tiempo
        promedio de 5 minutos por persona.
        */
        const minutosPorPersona = 5;

        const tiempoEstimadoMinutos =
            registro.estado === "EN_ESPERA"
                ? personasDelante *
                  minutosPorPersona
                : 0;

        /*
        Generar el aviso que utilizará la
        aplicación móvil.
        */
        let aviso = null;

        if (registro.estado === "EN_ESPERA") {
            if (personasDelante === 0) {
                aviso = {
                    tipo: "SIGUIENTE",
                    titulo:
                        "Eres el siguiente",
                    mensaje:
                        "Mantente atento, tu turno será llamado próximamente.",
                };
            } else if (personasDelante === 1) {
                aviso = {
                    tipo: "PROXIMO",
                    titulo:
                        "Tu turno está muy cerca",
                    mensaje:
                        "Hay una persona delante de ti. Prepárate para ser llamado.",
                };
            } else if (personasDelante === 2) {
                aviso = {
                    tipo: "PROXIMO",
                    titulo:
                        "Tu turno está próximo",
                    mensaje:
                        "Hay dos personas delante de ti. Mantente cerca de la sede.",
                };
            }
        }

        if (registro.estado === "LLAMADO") {
            aviso = {
                tipo: "LLAMADO",
                titulo: "¡Es tu turno!",
                mensaje:
                    `Dirígete a la ventanilla ${
                        registro.ventanilla_atencion ||
                        "asignada"
                    }.`,
            };
        }

        if (
            registro.estado ===
            "EN_ATENCION"
        ) {
            aviso = {
                tipo: "EN_ATENCION",
                titulo:
                    "Atención en proceso",
                mensaje:
                    `Tu trámite está siendo atendido en la ventanilla ${
                        registro.ventanilla_atencion ||
                        ""
                    }.`,
            };
        }

        if (
            registro.estado === "FINALIZADO"
        ) {
            aviso = {
                tipo: "FINALIZADO",
                titulo:
                    "Atención finalizada",
                mensaje:
                    "Tu atención fue finalizada correctamente.",
            };
        }

        if (registro.estado === "AUSENTE") {
            aviso = {
                tipo: "AUSENTE",
                titulo:
                    "Turno marcado como ausente",
                mensaje:
                    "No te presentaste cuando tu turno fue llamado.",
            };
        }

        return res.status(200).json({
            ok: true,
            tieneTurno: true,
            tieneTurnoActivo,

            turno: {
                idTurno:
                    registro.id_turno,

                codigoTurno:
                    registro.codigo_turno,

                numeroTurno:
                    registro.numero_turno,

                estado:
                    registro.estado,

                personasDelante,

                tiempoEstimadoMinutos,

                ventanilla:
                    registro
                        .ventanilla_atencion,

                sede: {
                    idSede:
                        registro.id_sede,

                    codigo:
                        registro.codigo_sede,

                    nombre:
                        registro.nombre_sede,
                },

                tramite: {
                    idTramite:
                        registro.id_tramite,

                    codigo:
                        registro.codigo_tramite,

                    nombre:
                        registro.nombre_tramite,
                },

                asesor: registro.id_asesor
                    ? {
                          idAsesor:
                              registro.id_asesor,

                          nombreCompleto:
                              registro.nombre_asesor,
                      }
                    : null,

                fechaRegistro:
                    registro.fecha_registro,

                fechaLlamado:
                    registro.fecha_llamado,

                fechaInicioAtencion:
                    registro
                        .fecha_inicio_atencion,

                fechaFinalizacion:
                    registro
                        .fecha_finalizacion,

                aviso,
            },
        });
    } catch (error) {
        console.error(
            "Error al consultar el turno activo:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "Ocurrió un error al consultar el seguimiento del turno.",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    }
}

export async function cancelarTurno(req, res) {
    const client = await pool.connect();

    try {
        const idTurno = Number(req.params.idTurno);

        const dni = String(
            req.body.dni || ""
        ).trim();

        if (
            !Number.isInteger(idTurno) ||
            idTurno <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El identificador del turno no es válido.",
            });
        }

        if (!/^\d{8}$/.test(dni)) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El DNI debe contener exactamente 8 dígitos.",
            });
        }

        await client.query("BEGIN");

        /*
        Buscar el turno y comprobar que realmente
        pertenece al ciudadano que está solicitando
        la cancelación.
        */
        const resultadoTurno =
            await client.query(
                `
                SELECT
                    t.id_turno,
                    t.id_usuario,
                    t.id_cola,
                    t.numero_turno,
                    t.estado,
                    t.fecha_registro,

                    u.dni,

                    vd.codigo_turno,
                    vd.nombre_sede,
                    vd.nombre_tramite

                FROM turnos AS t

                INNER JOIN usuarios AS u
                    ON u.id_usuario = t.id_usuario

                INNER JOIN vw_turnos_detalle AS vd
                    ON vd.id_turno = t.id_turno

                WHERE t.id_turno = $1
                LIMIT 1

                FOR UPDATE OF t
                `,
                [idTurno]
            );

        if (
            resultadoTurno.rows.length === 0
        ) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                ok: false,
                mensaje:
                    "El turno solicitado no existe.",
            });
        }

        const turno =
            resultadoTurno.rows[0];

        /*
        Validar que el turno pertenezca
        al ciudadano autenticado.
        */
        if (turno.dni !== dni) {
            await client.query("ROLLBACK");

            return res.status(403).json({
                ok: false,
                mensaje:
                    "El turno no pertenece al ciudadano indicado.",
            });
        }

        /*
        Solo se puede cancelar mientras
        el ciudadano continúa esperando.
        */
        if (turno.estado !== "EN_ESPERA") {
            await client.query("ROLLBACK");

            return res.status(409).json({
                ok: false,
                mensaje:
                    `No puedes cancelar un turno que se encuentra en estado ${turno.estado}.`,
            });
        }

        /*
        Cambiar el estado del turno.
        No eliminamos el registro porque debe
        permanecer en el historial del ciudadano.
        */
        const resultadoActualizacion =
            await client.query(
                `
                UPDATE turnos
                SET
                    estado = 'CANCELADO',
                    fecha_finalizacion =
                        CURRENT_TIMESTAMP,
                    observacion =
                        'Turno cancelado por el ciudadano'
                WHERE id_turno = $1

                RETURNING
                    id_turno,
                    numero_turno,
                    estado,
                    fecha_registro,
                    fecha_finalizacion
                `,
                [idTurno]
            );

        const turnoCancelado =
            resultadoActualizacion.rows[0];

        await client.query("COMMIT");

        return res.status(200).json({
            ok: true,

            mensaje:
                `El turno ${turno.codigo_turno} fue cancelado correctamente.`,

            turno: {
                idTurno:
                    turnoCancelado.id_turno,

                codigoTurno:
                    turno.codigo_turno,

                estado:
                    turnoCancelado.estado,

                sede:
                    turno.nombre_sede,

                tramite:
                    turno.nombre_tramite,

                fechaRegistro:
                    turnoCancelado.fecha_registro,

                fechaCancelacion:
                    turnoCancelado.fecha_finalizacion,
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Error al cancelar el turno:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "Ocurrió un error al cancelar el turno.",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    } finally {
        client.release();
    }
}