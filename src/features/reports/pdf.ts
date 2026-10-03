import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { dateTime } from '../../lib/period'
import { formatRWF } from '../../lib/currency'
import { historyLabels, type PrintableReport } from './types'
import { summaryRows, stockRows, paymentRows, reportPeriod, reportFilename, resultLabel } from './presentation'

// Resolve the application's theme at download time, including CSS variable aliases.
function themeColor(name: string) {
  const probe = document.createElement('span')
  probe.style.color = `var(--color-${name})`
  document.body.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  const channels = color.match(/[\d.]+/g)
  if (!channels || channels.length < 3) throw new Error('Theme color unavailable')
  return channels.slice(0, 3).map(Number) as [number, number, number]
}
export function createReportPDF(report: PrintableReport, period: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const ink = themeColor('text'), primary = themeColor('sidebar'), surface = themeColor('surface')
  const resultColor = themeColor(report.summary.profit_loss > 0 ? 'success' : report.summary.profit_loss < 0 ? 'danger' : 'text')
  let y = 18
  const heading = (text: string) => {
    if (y > 255) { doc.addPage(); y = 18 }
    doc.setTextColor(...ink).setFont('helvetica', 'bold').setFontSize(12)
    doc.text(text, 14, y)
    y += 5
  }
  const table = (head: string[], body: string[][], history = false) => {
    autoTable(doc, {
      startY: y, head: [head], body,
      margin: { top: 16, bottom: 18, left: 14, right: 14 },
      theme: 'grid', showHead: 'everyPage', rowPageBreak: 'avoid',
      styles: { font: 'helvetica', fontSize: history ? 8 : 10, cellPadding: 2.2, overflow: 'linebreak', textColor: ink, lineColor: themeColor('border') },
      headStyles: { fillColor: primary, textColor: surface },
      columnStyles: history ? { 0: { cellWidth: 23 }, 1: { cellWidth: 19 }, 2: { cellWidth: 31 }, 3: { cellWidth: 22 }, 4: { cellWidth: 13, halign: 'right' }, 5: { cellWidth: 27, halign: 'right' }, 6: { cellWidth: 47 } } : {},
      didParseCell: data => {
        if (data.section === 'body' && data.row.raw === body[body.length - 1] && head[0] === 'Business Summary') {
          data.cell.styles.textColor = resultColor
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 11
  }
  doc.setTextColor(...ink).setFont('helvetica', 'bold').setFontSize(15)
  doc.text('BEVERAGE SHOP BUSINESS REPORT', 14, y)
  y += 9
  doc.setFont('helvetica', 'normal').setFontSize(10)
  const header = doc.splitTextToSize(`Report Period: ${reportPeriod(report, period)}\nGenerated: ${dateTime(report.generated_at)} (Africa/Kigali)\nCurrency: RWF`, 182)
  doc.text(header, 14, y)
  y += header.length * 5 + 5
  table(['Business Summary', 'Amount'], summaryRows(report.summary))
  heading('Stock Summary')
  table(['Stock', 'Quantity'], stockRows(report.summary))
  doc.setFontSize(9).setTextColor(...ink)
  doc.text('Stock counts are current; low stock includes out-of-stock products.', 14, y - 4)
  y += 4
  heading('Payment Summary')
  table(['Payment Method', 'Amount'], paymentRows(report.summary))
  if (period === 'year') {
    heading('Monthly Summary')
    table(['Month', 'Sales', 'Expenses', 'Damaged Loss', 'Profit / Loss'], report.monthly.map(row => [row.month, formatRWF(row.summary.sales_revenue), formatRWF(row.summary.expenses), formatRWF(row.summary.damaged_loss), `${resultLabel(row.summary.profit_loss)}: ${formatRWF(Math.abs(row.summary.profit_loss))}`]))
  }
  heading('Full Business History')
  if (report.history.length) {
    table(['Date', 'Type', 'Item / Description', 'Category', 'Qty', 'Amount', 'Details'], report.history.map(row => [dateTime(row.date), historyLabels[row.type] ?? row.type, row.description, row.category || '-', row.quantity == null ? '-' : String(row.quantity), formatRWF(row.amount), row.details || '-']), true)
  } else {
    doc.setFont('helvetica', 'normal').setFontSize(10).text('No activity recorded in this period.', 14, y + 4)
    y += 16
  }
  if (y > 245) { doc.addPage(); y = 18 }
  heading('FINAL RESULT')
  doc.setTextColor(...resultColor).setFontSize(14).setFont('helvetica', 'bold')
  doc.text(`${resultLabel(report.summary.profit_loss).toUpperCase()}: ${formatRWF(Math.abs(report.summary.profit_loss))}`, 14, y + 4)
  doc.setTextColor(...ink).setFontSize(9).setFont('helvetica', 'normal')
  doc.text('Sales - Cost of Items Sold - Expenses - Damaged Loss = Profit / Loss', 14, y + 13)
  doc.text('Purchases are shown separately and are not deducted directly from profit.', 14, y + 18)
  const count = doc.getNumberOfPages()
  for (let page = 1; page <= count; page++) {
    doc.setPage(page).setTextColor(...ink).setFontSize(9)
    doc.text(`Page ${page} of ${count}`, 196, 288, { align: 'right' })
  }
  return doc
}
export async function downloadReportPDF(report: PrintableReport, period: string) {
  const doc = createReportPDF(report, period)
  await doc.save(reportFilename(report, period), { returnPromise: true })
}
