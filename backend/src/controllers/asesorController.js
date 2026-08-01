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