const API_URL =
    "http://localhost:3001/api/asesores";

export async function obtenerDashboard(
    idSede
) {
    const respuesta =
        await fetch(
            `${API_URL}/dashboard/${idSede}`
        );

    const datos =
        await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.mensaje ||
                "No se pudo obtener el dashboard."
        );
    }

    return datos;
}