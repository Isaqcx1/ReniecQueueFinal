const API_URL = "http://localhost:3001";

export async function obtenerColaPorSede(idSede) {
    const respuesta = await fetch(
        `${API_URL}/api/turnos/sede/${idSede}`
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.mensaje ||
                "No se pudo obtener la cola de atención."
        );
    }

    return datos;
}