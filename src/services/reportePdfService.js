import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

function formatearFecha(fecha) {
    if (!fecha) {
        return "-";
    }

    return new Date(
        fecha
    ).toLocaleDateString(
        "es-PE"
    );
}

function formatearEstado(estado) {
    const estados = {
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

export function generarReportePDF(
    reporte
) {
    const documento =
        new jsPDF();

    documento.setFontSize(18);

    documento.text(
        "RENIEC Queue",
        14,
        18
    );

    documento.setFontSize(14);

    documento.text(
        "Reporte de atención",
        14,
        28
    );

    documento.setFontSize(10);

    documento.text(
        `Sede: ${reporte.sede.nombre}`,
        14,
        38
    );

    documento.text(
        `Código: ${reporte.sede.codigo}`,
        14,
        44
    );

    documento.text(
        `Periodo: ${reporte.filtros.desde} al ${reporte.filtros.hasta}`,
        14,
        50
    );

    documento.text(
        `Estado: ${reporte.filtros.estado}`,
        14,
        56
    );

    documento.setFontSize(12);

    documento.text(
        "Resumen",
        14,
        68
    );

    autoTable(
        documento,
        {
            startY: 73,

            head: [[
                "Total",
                "Finalizados",
                "Ausentes",
                "Cancelados",
                "% finalización",
            ]],

            body: [[
                reporte.resumen
                    .totalTurnos,

                reporte.resumen
                    .finalizados,

                reporte.resumen
                    .ausentes,

                reporte.resumen
                    .cancelados,

                `${reporte.resumen
                    .porcentajeFinalizacion}%`,
            ]],
        }
    );

    const siguienteY =
        documento
            .lastAutoTable
            .finalY + 12;

    documento.text(
        "Detalle de turnos",
        14,
        siguienteY
    );

    autoTable(
        documento,
        {
            startY:
                siguienteY + 5,

            head: [[
                "Turno",
                "Fecha",
                "Trámite",
                "Estado",
                "Ventanilla",
            ]],

            body:
                reporte.detalle.map(
                    (turno) => [
                        turno.codigoTurno,
                        formatearFecha(
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
        }
    );

    documento.save(
        `reporte-reniec-${reporte.filtros.desde}-${reporte.filtros.hasta}.pdf`
    );
}