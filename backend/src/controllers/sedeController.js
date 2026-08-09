import pool from "../config/database.js";


export async function obtenerSedes(
    req,
    res
) {
    try {
        const resultado =
            await pool.query(`
                SELECT
                    s.id_sede,
                    s.codigo,
                    s.nombre,
                    s.direccion,
                    s.telefono,
                    s.correo,
                    s.horario,
                    s.latitud,
                    s.longitud,
                    s.imagen_url,
                    s.estado,
                    d.id_distrito,
                    d.nombre AS distrito
                FROM sedes s
                INNER JOIN distritos d
                    ON d.id_distrito = s.id_distrito
                WHERE s.estado = TRUE
                ORDER BY s.id_sede;
            `);

        const sedes =
            resultado.rows.map(
                (sede) => ({
                    idSede:
                        sede.id_sede,

                    codigo:
                        sede.codigo,

                    nombre:
                        sede.nombre,

                    direccion:
                        sede.direccion,

                    telefono:
                        sede.telefono,

                    correo:
                        sede.correo,

                    horario:
                        sede.horario,

                    latitud:
                        sede.latitud !== null
                            ? Number(
                                  sede.latitud
                              )
                            : null,

                    longitud:
                        sede.longitud !== null
                            ? Number(
                                  sede.longitud
                              )
                            : null,

                    imagenUrl:
                        sede.imagen_url
                            ? `${req.protocol}://${req.get(
                                  "host"
                              )}${sede.imagen_url}`
                            : null,

                    estado:
                        sede.estado,

                    distrito: {
                        idDistrito:
                            sede.id_distrito,

                        nombre:
                            sede.distrito,
                    },
                })
            );

        return res.json({
            ok: true,
            total:
                sedes.length,
            sedes,
        });
    } catch (error) {
        console.error(
            "Error al obtener sedes:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No se pudieron obtener las sedes.",
        });
    }
}


export async function obtenerSedePorId(
    req,
    res
) {
    try {
        const {
            idSede,
        } = req.params;

        const resultado =
            await pool.query(
                `
                SELECT
                    s.id_sede,
                    s.codigo,
                    s.nombre,
                    s.direccion,
                    s.telefono,
                    s.correo,
                    s.horario,
                    s.latitud,
                    s.longitud,
                    s.imagen_url,
                    s.estado,
                    d.id_distrito,
                    d.nombre AS distrito
                FROM sedes s
                INNER JOIN distritos d
                    ON d.id_distrito = s.id_distrito
                WHERE s.id_sede = $1
                  AND s.estado = TRUE;
                `,
                [
                    idSede,
                ]
            );

        if (
            resultado.rows.length ===
            0
        ) {
            return res.status(404).json({
                ok: false,
                mensaje:
                    "Sede no encontrada.",
            });
        }

        const sede =
            resultado.rows[0];

        return res.json({
            ok: true,

            sede: {
                idSede:
                    sede.id_sede,

                codigo:
                    sede.codigo,

                nombre:
                    sede.nombre,

                direccion:
                    sede.direccion,

                telefono:
                    sede.telefono,

                correo:
                    sede.correo,

                horario:
                    sede.horario,

                latitud:
                    sede.latitud !== null
                        ? Number(
                              sede.latitud
                          )
                        : null,

                longitud:
                    sede.longitud !== null
                        ? Number(
                              sede.longitud
                          )
                        : null,

                imagenUrl:
                    sede.imagen_url
                        ? `${req.protocol}://${req.get(
                              "host"
                          )}${sede.imagen_url}`
                        : null,

                estado:
                    sede.estado,

                distrito: {
                    idDistrito:
                        sede.id_distrito,

                    nombre:
                        sede.distrito,
                },
            },
        });
    } catch (error) {
        console.error(
            "Error al obtener sede:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No se pudo obtener la sede.",
        });
    }
}