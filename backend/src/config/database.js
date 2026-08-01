import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

pool.on("error", (error) => {
    console.error(
        "Error inesperado en PostgreSQL:",
        error
    );
});

export async function comprobarConexion() {
    const resultado = await pool.query(`
        SELECT
            CURRENT_DATABASE() AS base_datos,
            CURRENT_USER AS usuario_postgres,
            CURRENT_TIMESTAMP AS fecha_servidor
    `);

    return resultado.rows[0];
}

export default pool;