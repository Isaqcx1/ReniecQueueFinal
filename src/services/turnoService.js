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
export async function llamarSiguienteTurno(idAsesor) {
    const respuesta = await fetch(
        `${API_URL}/api/turnos/siguiente`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                idAsesor,
            }),
        }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.mensaje ||
                "No se pudo llamar al siguiente turno."
        );
    }

    return datos;
}

export async function actualizarEstadoTurno(
    idTurno,
    idAsesor,
    nuevoEstado
) {
    const respuesta = await fetch(
        `${API_URL}/api/turnos/${idTurno}/estado`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                idAsesor,
                nuevoEstado,
            }),
        }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.mensaje ||
                "No se pudo actualizar el estado del turno."
        );
    }

    return datos;
}