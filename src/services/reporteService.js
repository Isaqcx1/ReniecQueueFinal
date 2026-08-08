const API_URL =
    "http://localhost:3001/api/asesores";

export async function obtenerReporte(
    idSede,
    filtros
) {
    const parametros =
        new URLSearchParams({
            desde: filtros.desde,
            hasta: filtros.hasta,
            estado:
                filtros.estado ||
                "TODOS",
            agrupacion:
                filtros.agrupacion ||
                "DIA",
        });

    const respuesta =
        await fetch(
            `${API_URL}/reportes/${idSede}?${parametros.toString()}`
        );

    const datos =
        await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.mensaje ||
                "No se pudo generar el reporte."
        );
    }

    return datos;
}