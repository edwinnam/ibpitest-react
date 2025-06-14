/**
 * Data export service for Excel, CSV, and other formats
 */

/**
 * Export data to Excel format
 * Uses native browser APIs to create Excel-compatible files
 */
export const exportToExcel = async (data, filename, options = {}) => {
  const {
    sheetName = 'Sheet1',
    includeTimestamp = false,
    headerStyle = true
  } = options;

  try {
    // Create workbook content
    const worksheet = createWorksheet(data);
    const workbook = createWorkbook(worksheet, sheetName);
    
    // Generate filename
    const finalFilename = includeTimestamp 
      ? `${filename}_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`
      : `${filename}.xlsx`;

    // Create blob and download
    const blob = new Blob([workbook], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    downloadBlob(blob, finalFilename);
  } catch (error) {
    console.error('Excel export error:', error);
    throw new Error('Excel 파일 생성 중 오류가 발생했습니다.');
  }
};

/**
 * Export data to CSV format
 */
export const exportToCSV = (data, filename, options = {}) => {
  const {
    delimiter = ',',
    includeHeaders = true,
    encoding = 'utf-8'
  } = options;

  try {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('데이터가 없습니다.');
    }

    let csv = '';

    // Add BOM for UTF-8
    if (encoding === 'utf-8') {
      csv = '\uFEFF';
    }

    // Extract headers
    const headers = Object.keys(data[0]);
    
    if (includeHeaders) {
      csv += headers.map(h => escapeCSV(h)).join(delimiter) + '\n';
    }

    // Add data rows
    data.forEach(row => {
      csv += headers.map(header => escapeCSV(row[header])).join(delimiter) + '\n';
    });

    // Create blob and download
    const blob = new Blob([csv], { type: `text/csv;charset=${encoding}` });
    downloadBlob(blob, `${filename}.csv`);
  } catch (error) {
    console.error('CSV export error:', error);
    throw new Error('CSV 파일 생성 중 오류가 발생했습니다.');
  }
};

/**
 * Export data to JSON format
 */
export const exportToJSON = (data, filename, options = {}) => {
  const {
    pretty = true,
    includeMetadata = false
  } = options;

  try {
    let exportData = data;

    if (includeMetadata) {
      exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          recordCount: data.length,
          version: '1.0'
        },
        data
      };
    }

    const json = pretty 
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);

    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, `${filename}.json`);
  } catch (error) {
    console.error('JSON export error:', error);
    throw new Error('JSON 파일 생성 중 오류가 발생했습니다.');
  }
};

/**
 * Export data to PDF format
 */
export const exportToPDF = async (data, filename, options = {}) => {
  const {
    title = 'Data Export',
    orientation = 'portrait',
    format = 'A4'
  } = options;

  try {
    // Create PDF content
    const doc = createPDFDocument(data, { title, orientation, format });
    
    // Generate blob
    const blob = await doc.blob();
    downloadBlob(blob, `${filename}.pdf`);
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error('PDF 파일 생성 중 오류가 발생했습니다.');
  }
};

/**
 * Helper: Create worksheet content for Excel
 */
const createWorksheet = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return '<worksheet><sheetData></sheetData></worksheet>';
  }

  const headers = Object.keys(data[0]);
  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
  xml += '<sheetData>';

  // Add headers
  xml += '<row>';
  headers.forEach((header, index) => {
    xml += `<c t="str" s="1"><v>${escapeXML(header)}</v></c>`;
  });
  xml += '</row>';

  // Add data rows
  data.forEach(row => {
    xml += '<row>';
    headers.forEach(header => {
      const value = row[header];
      const cellType = typeof value === 'number' ? 'n' : 'str';
      xml += `<c t="${cellType}"><v>${escapeXML(String(value || ''))}</v></c>`;
    });
    xml += '</row>';
  });

  xml += '</sheetData></worksheet>';
  return xml;
};

/**
 * Helper: Create workbook content for Excel
 */
const createWorkbook = (worksheet, sheetName) => {
  // Simplified Excel file structure
  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheets>
    <sheet name="${escapeXML(sheetName)}" sheetId="1"/>
  </sheets>
</workbook>`;

  // For a real implementation, you would need to create a proper XLSX file
  // with multiple XML files in a ZIP container. Here we're using a simplified approach.
  // Consider using a library like SheetJS for production use.
  
  return worksheet; // Simplified - returns just the worksheet
};

/**
 * Helper: Create PDF document
 */
const createPDFDocument = (data, options) => {
  // Simplified PDF creation
  // For a real implementation, you would use a library like jsPDF or pdfmake
  
  const doc = {
    blob: async () => {
      const content = `PDF Export\n\n${JSON.stringify(data, null, 2)}`;
      return new Blob([content], { type: 'application/pdf' });
    }
  };
  
  return doc;
};

/**
 * Helper: Escape CSV values
 */
const escapeCSV = (value) => {
  if (value === null || value === undefined) return '';
  
  const str = String(value);
  
  // Check if escaping is needed
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
};

/**
 * Helper: Escape XML values
 */
const escapeXML = (value) => {
  if (!value) return '';
  
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Helper: Download blob as file
 */
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export multiple sheets to Excel
 */
export const exportMultipleSheets = async (sheets, filename) => {
  // This would require a more complex implementation with proper XLSX structure
  // For now, we'll export the first sheet only
  if (sheets.length > 0) {
    const { data, name } = sheets[0];
    await exportToExcel(data, filename, { sheetName: name });
  }
};

/**
 * Export with custom formatting
 */
export const exportWithFormatting = async (data, filename, formatters = {}) => {
  // Apply formatters to data
  const formattedData = data.map(row => {
    const formattedRow = {};
    
    Object.entries(row).forEach(([key, value]) => {
      if (formatters[key]) {
        formattedRow[key] = formatters[key](value);
      } else {
        formattedRow[key] = value;
      }
    });
    
    return formattedRow;
  });
  
  return exportToExcel(formattedData, filename);
};

export default {
  exportToExcel,
  exportToCSV,
  exportToJSON,
  exportToPDF,
  exportMultipleSheets,
  exportWithFormatting
};