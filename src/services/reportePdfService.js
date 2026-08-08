import {
    jsPDF,
} from "jspdf";

import {
    autoTable,
} from "jspdf-autotable";

import html2canvas
    from "html2canvas";

function formatearFecha(
    fecha
) {
    if (!fecha) {
        return "-";
    }

    return new Date(
        fecha
    ).toLocaleDateString(
        "es-PE"
    );
}

function formatearFechaHora(
    fecha
) {
    if (!fecha) {
        return "-";
    }

    return new Date(
        fecha
    ).toLocaleString(
        "es-PE",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}

function formatearEstado(
    estado
) {
    const estados = {
        TODOS:
            "Todos",

        EN_ESPERA:
            "En espera",

        LLAMADO:
            "Llamado",

        EN_ATENCION:
            "En atención",

        FINALIZADO:
            "Finalizado",

        AUSENTE:
            "Ausente",

        CANCELADO:
            "Cancelado",
    };

    return (
        estados[estado] ||
        estado
    );
}

function formatearPeriodo(
    reporte
) {
    const desde =
        formatearFecha(
            `${reporte.filtros.desde}T12:00:00`
        );

    const hasta =
        formatearFecha(
            `${reporte.filtros.hasta}T12:00:00`
        );

    if (
        reporte.filtros.desde ===
        reporte.filtros.hasta
    ) {
        return desde;
    }

    return `${desde} al ${hasta}`;
}

async function capturarGrafico(
    elemento
) {
    if (!elemento) {
        return null;
    }

    const canvas =
        await html2canvas(
            elemento,
            {
                scale: 2,

                backgroundColor:
                    "#ffffff",

                useCORS: true,

                logging: false,
            }
        );

    return canvas.toDataURL(
        "image/png"
    );
}

function agregarEncabezado(
    documento,
    reporte
) {
    documento.setFillColor(
        25,
        118,
        210
    );

    documento.rect(
        0,
        0,
        210,
        34,
        "F"
    );

    documento.setTextColor(
        255,
        255,
        255
    );

    documento.setFontSize(18);

    documento.setFont(
        "helvetica",
        "bold"
    );

    documento.text(
        "RENIEC Queue",
        14,
        15
    );

    documento.setFontSize(
        11
    );

    documento.setFont(
        "helvetica",
        "normal"
    );

    documento.text(
        "Reporte de atención y gestión de turnos",
        14,
        23
    );

    documento.setTextColor(
        31,
        79,
        130
    );

    documento.setFontSize(
        14
    );

    documento.setFont(
        "helvetica",
        "bold"
    );

    documento.text(
        "Información del reporte",
        14,
        47
    );

    documento.setFontSize(
        10
    );

    documento.setFont(
        "helvetica",
        "normal"
    );

    documento.setTextColor(
        66,
        88,
        108
    );

    documento.text(
        `Sede: ${reporte.sede.nombre}`,
        14,
        56
    );

    documento.text(
        `Código de sede: ${reporte.sede.codigo}`,
        14,
        63
    );

    documento.text(
        `Periodo consultado: ${formatearPeriodo(
            reporte
        )}`,
        14,
        70
    );

    documento.text(
        `Estado consultado: ${formatearEstado(
            reporte.filtros.estado
        )}`,
        14,
        77
    );

    documento.text(
        `Fecha de generación: ${new Date().toLocaleString(
            "es-PE"
        )}`,
        14,
        84
    );
}

function agregarTituloSeccion(
    documento,
    titulo,
    y
) {
    documento.setTextColor(
        31,
        79,
        130
    );

    documento.setFont(
        "helvetica",
        "bold"
    );

    documento.setFontSize(
        13
    );

    documento.text(
        titulo,
        14,
        y
    );
}

function agregarGrafico(
    documento,
    imagen,
    titulo,
    posicionY
) {
    if (!imagen) {
        return posicionY;
    }

    const altoGrafico = 78;

    if (
        posicionY +
        altoGrafico +
        18 >
        282
    ) {
        documento.addPage();

        posicionY = 20;
    }

    agregarTituloSeccion(
        documento,
        titulo,
        posicionY
    );

    documento.addImage(
        imagen,
        "PNG",
        14,
        posicionY + 7,
        182,
        altoGrafico,
        undefined,
        "FAST"
    );

    return (
        posicionY +
        altoGrafico +
        17
    );
}

function agregarNumeracionPaginas(
    documento
) {
    const totalPaginas =
        documento.getNumberOfPages();

    for (
        let pagina = 1;
        pagina <= totalPaginas;
        pagina += 1
    ) {
        documento.setPage(
            pagina
        );

        documento.setDrawColor(
            218,
            230,
            239
        );

        documento.line(
            14,
            287,
            196,
            287
        );

        documento.setFontSize(
            8
        );

        documento.setTextColor(
            113,
            134,
            154
        );

        documento.text(
            "RENIEC Queue - Reporte generado por el sistema",
            14,
            292
        );

        documento.text(
            `Página ${pagina} de ${totalPaginas}`,
            196,
            292,
            {
                align: "right",
            }
        );
    }
}

export async function generarReportePDF(
    reporte,
    graficos = {}
) {
    const documento =
        new jsPDF({
            orientation:
                "portrait",

            unit: "mm",

            format: "a4",
        });

    agregarEncabezado(
        documento,
        reporte
    );

    agregarTituloSeccion(
        documento,
        "Resumen estadístico",
        98
    );

    autoTable(
        documento,
        {
            startY: 104,

            head: [[
                "Indicador",
                "Resultado",
            ]],

            body: [
                [
                    "Total de turnos",
                    reporte.resumen
                        .totalTurnos,
                ],
                [
                    "Turnos finalizados",
                    reporte.resumen
                        .finalizados,
                ],
                [
                    "Ciudadanos ausentes",
                    reporte.resumen
                        .ausentes,
                ],
                [
                    "Turnos cancelados",
                    reporte.resumen
                        .cancelados,
                ],
                [
                    "Tasa de finalización",
                    `${reporte.resumen
                        .porcentajeFinalizacion}%`,
                ],
                [
                    "Trámite más solicitado",
                    reporte.estadisticas
                        ?.tramiteMasSolicitado
                        ? `${reporte.estadisticas
                            .tramiteMasSolicitado
                            .nombre} (${reporte.estadisticas
                                .tramiteMasSolicitado
                                .cantidad} turnos)`
                        : "Sin información",
                ],
            ],

            theme: "grid",

            headStyles: {
                fillColor: [
                    25,
                    118,
                    210,
                ],

                textColor: [
                    255,
                    255,
                    255,
                ],

                fontStyle:
                    "bold",
            },

            bodyStyles: {
                textColor: [
                    66,
                    88,
                    108,
                ],
            },

            alternateRowStyles: {
                fillColor: [
                    245,
                    249,
                    252,
                ],
            },

            margin: {
                left: 14,
                right: 14,
            },
        }
    );

    const imagenEvolucion =
        await capturarGrafico(
            graficos.evolucion
        );

    const imagenEstados =
        await capturarGrafico(
            graficos.estados
        );

    const imagenTramites =
        await capturarGrafico(
            graficos.tramites
        );


    documento.addPage();

    let posicionY = 20;


    posicionY =
        agregarGrafico(
            documento,
            imagenEvolucion,
            "Evolución de turnos",
            posicionY
        );


    posicionY =
        agregarGrafico(
            documento,
            imagenEstados,
            "Distribución de turnos por estado",
            posicionY
        );


    agregarGrafico(
        documento,
        imagenTramites,
        "Trámites más solicitados",
        posicionY
    );


    documento.addPage();

    agregarTituloSeccion(
        documento,
        "Detalle de turnos",
        20
    );

    documento.setFontSize(
        9
    );

    documento.setFont(
        "helvetica",
        "normal"
    );

    documento.setTextColor(
        113,
        134,
        154
    );

    documento.text(
        `${reporte.detalle.length} registros incluidos en el reporte`,
        14,
        27
    );

    autoTable(
        documento,
        {
            startY: 33,

            head: [[
                "Turno",
                "Fecha y hora",
                "Trámite",
                "Estado",
                "Ventanilla",
            ]],

            body:
                reporte.detalle.map(
                    (
                        turno
                    ) => [
                            turno.codigoTurno,

                            formatearFechaHora(
                                turno.fechaRegistro
                            ),

                            turno.tramite,

                            formatearEstado(
                                turno.estado
                            ),

                            turno.ventanilla ||
                            "-",
                        ]
                ),

            theme: "striped",

            styles: {
                fontSize: 8,

                cellPadding: 2.5,

                textColor: [
                    66,
                    88,
                    108,
                ],

                overflow:
                    "linebreak",
            },

            headStyles: {
                fillColor: [
                    25,
                    118,
                    210,
                ],

                textColor: [
                    255,
                    255,
                    255,
                ],

                fontStyle:
                    "bold",
            },

            alternateRowStyles: {
                fillColor: [
                    245,
                    249,
                    252,
                ],
            },

            columnStyles: {
                0: {
                    cellWidth: 18,
                },

                1: {
                    cellWidth: 32,
                },

                2: {
                    cellWidth: 65,
                },

                3: {
                    cellWidth: 29,
                },

                4: {
                    cellWidth: 25,
                },
            },

            margin: {
                left: 14,
                right: 14,
                bottom: 15,
            },
        }
    );

    agregarNumeracionPaginas(
        documento
    );

    documento.save(
        `reporte-reniec-${reporte.filtros.desde}-${reporte.filtros.hasta}.pdf`
    );
}