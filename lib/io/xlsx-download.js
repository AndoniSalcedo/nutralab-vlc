/**
 * Genera y descarga un .xlsx en el navegador con exceljs (cargado bajo demanda
 * para no engordar el bundle inicial).
 * @param {{ filename: string, sheetName: string, rows: any[][], colWidths?: number[] }} options
 */
export async function downloadXlsx({ filename, sheetName, rows, colWidths = [] }) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  rows.forEach((row) => sheet.addRow(row));
  colWidths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
