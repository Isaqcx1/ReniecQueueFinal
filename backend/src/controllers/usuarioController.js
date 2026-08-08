import pool from "../config/database.js";


export async function verificarCiudadano(
    req,
    res
) {
    const { dni } = req.params;

    try {
        const resultadoCiudadano =
            await pool.query(
                `
                SELECT *
                FROM ciudadanos_reniec
                WHERE dni = $1
                  AND estado = TRUE
                `,
                [dni]
            );

        if (
            resultadoCiudadano.rows.length ===
            0
        ) {
            return res.status(404).json({
                ok: false,
                existeCiudadano: false,
                existeUsuario: false,
                mensaje:
                    "DNI no encontrado en RENIEC.",
            });
        }

        const ciudadano =
            resultadoCiudadano.rows[0];

        const resultadoUsuario =
            await pool.query(
                `
                SELECT
                    id_usuario,
                    dni,
                    nombre_perfil,
                    correo,
                    celular,
                    estado
                FROM usuarios
                WHERE dni = $1
                `,
                [dni]
            );

        const existeUsuario =
            resultadoUsuario.rows.length > 0;

        return res.json({
            ok: true,
            existeCiudadano: true,
            existeUsuario,
            ciudadano: {
                dni:
                    ciudadano.dni,
                nombres:
                    ciudadano.nombres,
                apellidoPaterno:
                    ciudadano.apellido_paterno,
                apellidoMaterno:
                    ciudadano.apellido_materno,
            },
        });
    } catch (error) {
        console.error(
            "Error al verificar ciudadano:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No se pudo verificar el DNI.",
        });
    }
}


export async function registrarUsuario(
    req,
    res
) {
    const {
        dni,
        correo,
        celular,
        password,
    } = req.body;

    if (
        !dni ||
        !correo ||
        !celular ||
        !password
    ) {
        return res.status(400).json({
            ok: false,
            mensaje:
                "Complete todos los campos.",
        });
    }

    try {
        const resultadoCiudadano =
            await pool.query(
                `
                SELECT *
                FROM ciudadanos_reniec
                WHERE dni = $1
                  AND estado = TRUE
                `,
                [dni]
            );

        if (
            resultadoCiudadano.rows.length ===
            0
        ) {
            return res.status(404).json({
                ok: false,
                mensaje:
                    "El DNI no existe en RENIEC.",
            });
        }

        const usuarioExistente =
            await pool.query(
                `
                SELECT id_usuario
                FROM usuarios
                WHERE dni = $1
                `,
                [dni]
            );

        if (
            usuarioExistente.rows.length > 0
        ) {
            return res.status(409).json({
                ok: false,
                mensaje:
                    "El ciudadano ya tiene una cuenta registrada.",
            });
        }

        const ciudadano =
            resultadoCiudadano.rows[0];

        const resultado =
            await pool.query(
                `
                INSERT INTO usuarios (
                    dni,
                    nombre_perfil,
                    correo,
                    celular,
                    contrasena_hash,
                    fecha_registro,
                    fecha_actualizacion,
                    estado
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    crypt(
                        $5,
                        gen_salt('bf', 6)
                    ),
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP,
                    TRUE
                )
                RETURNING
                    id_usuario,
                    dni,
                    nombre_perfil,
                    correo,
                    celular,
                    estado
                `,
                [
                    dni,
                    ciudadano.nombres,
                    correo.trim().toLowerCase(),
                    celular.trim(),
                    password,
                ]
            );

        return res.status(201).json({
            ok: true,
            mensaje:
                "Cuenta registrada correctamente.",
            usuario:
                resultado.rows[0],
        });
    } catch (error) {
        console.error(
            "Error al registrar usuario:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No se pudo registrar la cuenta.",
        });
    }
}


export async function iniciarSesionUsuario(
    req,
    res
) {
    const {
        dni,
        password,
    } = req.body;

    if (!dni || !password) {
        return res.status(400).json({
            ok: false,
            mensaje:
                "Ingrese DNI y contraseña.",
        });
    }

    try {
        const resultado =
            await pool.query(
                `
                SELECT
                    u.id_usuario,
                    u.dni,
                    u.nombre_perfil,
                    u.correo,
                    u.celular,
                    u.estado,

                    c.nombres,
                    c.apellido_paterno,
                    c.apellido_materno

                FROM usuarios u

                INNER JOIN ciudadanos_reniec c
                    ON c.dni = u.dni

                WHERE u.dni = $1
                  AND u.estado = TRUE
                  AND c.estado = TRUE
                  AND u.contrasena_hash =
                      crypt(
                          $2,
                          u.contrasena_hash
                      )
                `,
                [
                    dni,
                    password,
                ]
            );

        if (
            resultado.rows.length === 0
        ) {
            return res.status(401).json({
                ok: false,
                mensaje:
                    "DNI o contraseña incorrectos.",
            });
        }

        const usuario =
            resultado.rows[0];

        return res.json({
            ok: true,
            mensaje:
                "Inicio de sesión correcto.",
            usuario: {
                idUsuario:
                    usuario.id_usuario,
                dni:
                    usuario.dni,

                nombres:
                    usuario.nombres,

                apellidoPaterno:
                    usuario.apellido_paterno,

                apellidoMaterno:
                    usuario.apellido_materno,

                nombrePerfil:
                    usuario.nombre_perfil,

                correo:
                    usuario.correo,

                celular:
                    usuario.celular ?? "",
            },
        });
    } catch (error) {
        console.error(
            "Error al iniciar sesión:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No se pudo iniciar sesión.",
        });
    }
}


export async function obtenerPerfilUsuario(
    req,
    res
) {
    const { dni } = req.params;

    try {
        const resultado =
            await pool.query(
                `
                SELECT
                    u.id_usuario,
                    u.dni,
                    u.nombre_perfil,
                    u.correo,
                    u.celular,

                    c.nombres,
                    c.apellido_paterno,
                    c.apellido_materno

                FROM usuarios u

                INNER JOIN ciudadanos_reniec c
                    ON c.dni = u.dni

                WHERE u.dni = $1
                  AND u.estado = TRUE
                  AND c.estado = TRUE
                `,
                [dni]
            );

        if (
            resultado.rows.length === 0
        ) {
            return res.status(404).json({
                ok: false,
                mensaje:
                    "Usuario no encontrado.",
            });
        }

        const usuario =
            resultado.rows[0];

        return res.json({
            ok: true,
            usuario: {
                idUsuario:
                    usuario.id_usuario,

                dni:
                    usuario.dni,

                nombres:
                    usuario.nombres,

                apellidoPaterno:
                    usuario.apellido_paterno,

                apellidoMaterno:
                    usuario.apellido_materno,

                nombrePerfil:
                    usuario.nombre_perfil,

                correo:
                    usuario.correo,

                celular:
                    usuario.celular ?? "",
            },
        });
    } catch (error) {
        console.error(
            "Error al obtener perfil:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No se pudo consultar el perfil.",
        });
    }
}


export async function actualizarPerfilUsuario(
    req,
    res
) {
    const { dni } = req.params;

    const {
        nombrePerfil,
        correo,
        celular,
    } = req.body;

    if (
        !nombrePerfil ||
        !correo ||
        !celular
    ) {
        return res.status(400).json({
            ok: false,
            mensaje:
                "Complete todos los datos del perfil.",
        });
    }

    try {
        const resultado =
            await pool.query(
                `
                UPDATE usuarios

                SET
                    nombre_perfil = $1,
                    correo = $2,
                    celular = $3,
                    fecha_actualizacion =
                        CURRENT_TIMESTAMP

                WHERE dni = $4
                  AND estado = TRUE

                RETURNING
                    id_usuario,
                    dni,
                    nombre_perfil,
                    correo,
                    celular
                `,
                [
                    nombrePerfil.trim(),
                    correo
                        .trim()
                        .toLowerCase(),
                    celular.trim(),
                    dni,
                ]
            );

        if (
            resultado.rows.length === 0
        ) {
            return res.status(404).json({
                ok: false,
                mensaje:
                    "Usuario no encontrado.",
            });
        }

        const datos =
            resultado.rows[0];

        return res.json({
            ok: true,
            mensaje:
                "Perfil actualizado correctamente.",
            usuario: {
                idUsuario:
                    datos.id_usuario,

                dni:
                    datos.dni,

                nombrePerfil:
                    datos.nombre_perfil,

                correo:
                    datos.correo,

                celular:
                    datos.celular ?? "",
            },
        });
    } catch (error) {
        console.error(
            "Error al actualizar perfil:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No se pudo actualizar el perfil.",
        });
    }
}


export async function cambiarPasswordUsuario(
    req,
    res
) {
    const { dni } = req.params;

    const {
        passwordActual,
        nuevaPassword,
    } = req.body;

    if (
        !passwordActual ||
        !nuevaPassword
    ) {
        return res.status(400).json({
            ok: false,
            mensaje:
                "Complete las contraseñas.",
        });
    }

    if (
        nuevaPassword.length < 6
    ) {
        return res.status(400).json({
            ok: false,
            mensaje:
                "La nueva contraseña debe tener al menos 6 caracteres.",
        });
    }

    try {
        const resultadoActual =
            await pool.query(
                `
                SELECT id_usuario
                FROM usuarios

                WHERE dni = $1
                  AND estado = TRUE
                  AND contrasena_hash =
                      crypt(
                          $2,
                          contrasena_hash
                      )
                `,
                [
                    dni,
                    passwordActual,
                ]
            );

        if (
            resultadoActual.rows.length ===
            0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "La contraseña actual es incorrecta.",
            });
        }

        await pool.query(
            `
            UPDATE usuarios

            SET
                contrasena_hash =
                    crypt(
                        $1,
                        gen_salt('bf', 6)
                    ),

                fecha_actualizacion =
                    CURRENT_TIMESTAMP

            WHERE dni = $2
              AND estado = TRUE
            `,
            [
                nuevaPassword,
                dni,
            ]
        );

        return res.json({
            ok: true,
            mensaje:
                "La contraseña fue actualizada correctamente.",
        });
    } catch (error) {
        console.error(
            "Error al cambiar contraseña:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No se pudo actualizar la contraseña.",
        });
    }
}