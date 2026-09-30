import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

  export const exportToExcel = (data: any[], sheetName: string, filename: string, columns: { key: string; header: string }[]) => {
    if (data.length === 0) {
      console.warn("No data to export");
      return;
    }

    const processedData = data.map((item, index) => {
      const row: any = {};
      columns.forEach(({key, header}) => {
        if (key === "index") {
          row[header] = index + 1;
        } else {
          row[header] = item[key] || item[key.toLowerCase()] || '';
        }
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(processedData);

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for(let R = range.s.r; R <= range.e.r; ++R) {
      for(let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = {c:C, r:R};
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        
        if(!ws[cell_ref]) continue;
        
        if(R === 0) {
          ws[cell_ref].s = {
            fill: {fgColor: {rgb: "4287F5"}},
            font: {color: {rgb: "FFFFFF"}, bold: true},
            alignment: {horizontal: "center"},
          };
        }
        
        if(!ws[cell_ref].s) ws[cell_ref].s = {};
        ws[cell_ref].s = {
          ...ws[cell_ref].s,
          border: {
            top: {style: "thin"},
            bottom: {style: "thin"},
            left: {style: "thin"},
            right: {style: "thin"}
          },
          alignment: {vertical: "center", horizontal: "center"},
        };
      }
    }

    const colWidths = columns.map(() => ({wch: 15}));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const excelFile = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(excelFile, `${filename}.xlsx`);
  };

  export const exportToPDF = (data: any[], filename: string, columns: { key: string; header: string }[]) => {
    if (data.length === 0) {
      console.warn("No data to export");
      return;
    }
  
    const doc = new jsPDF();
    doc.text(filename, 14, 15); // PDF Title
  
    const tableColumnHeaders = columns.map((col) => col.header);
    const tableRows = data.map((item) => {
      return columns.map(({key}) => {
        if (key === "index") {
          return item[key];
        } else {
          return item[key] || item[key.toLowerCase()] || '';
        }
      });
    });
  
    (doc as any).autoTable({
      head: [tableColumnHeaders],
      body: tableRows,
      startY: 20,
      theme: "striped",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [51, 122, 183], // Blue background color
        textColor: [255, 255, 255], // White text
        fontStyle: 'bold'
      },
      margin: { top: 20 },
    });
  
    doc.save(`${filename}.pdf`);
  };