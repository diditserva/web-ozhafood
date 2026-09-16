function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Ozha Food - Order System')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getMenu() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Menu");
    if (!sheet) {
      throw new Error("Sheet 'Menu' tidak ditemukan. Harap buat sheet bernama 'Menu'.");
    }
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    
    // Fetch all columns (A:Name, B:Price, C:Description, D:Image URL, E:Status)
    const values = sheet.getRange("A2:E" + lastRow).getValues();
    
    // Filter out rows that are totally empty
    return values.filter(row => row[0] !== "" || row[1] !== "");
  } catch (error) {
    Logger.log("Error in getMenu: " + error.toString());
    throw new Error("Gagal mengambil menu: " + error.message);
  }
}

function getDivisi() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Referensi");
    if (!sheet) {
      throw new Error("Sheet 'Referensi' tidak ditemukan. Harap buat sheet bernama 'Referensi'.");
    }
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return []; 
    const data = sheet.getRange("A2:A" + lastRow).getValues();
    return data.flat().filter(String);
  } catch (error) {
    Logger.log("Error in getDivisi: " + error.toString());
    throw new Error("Gagal mengambil daftar divisi: " + error.message);
  }
}

function getLokasi() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Referensi");
    if (!sheet) {
      throw new Error("Sheet 'Referensi' tidak ditemukan. Harap buat sheet bernama 'Referensi'.");
    }
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return []; 
    
    const headers = sheet.getRange("1:1").getValues()[0];
    let colIndex = headers.findIndex(h => typeof h === 'string' && h.toLowerCase().includes('lokasi'));
    if (colIndex === -1) colIndex = 1; // Default to column B
    
    const data = sheet.getRange(2, colIndex + 1, lastRow - 1, 1).getValues();
    return data.flat().filter(String);
  } catch (error) {
    Logger.log("Error in getLokasi: " + error.toString());
    throw new Error("Gagal mengambil daftar lokasi: " + error.message);
  }
}

function prosesPesanan(dataForm) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Data_Penjualan");
    if (!sheet) {
      throw new Error("Sheet 'Data_Penjualan' tidak ditemukan. Harap buat sheet bernama 'Data_Penjualan'.");
    }
    
    if (!dataForm || !dataForm.nama || !dataForm.divisi || !dataForm.lokasi) {
      throw new Error("Data pemesanan tidak lengkap (Nama, Divisi, atau Lokasi kosong).");
    }

    // Build the row dynamically: Timestamp, Name, Divisi, then all QTYs, then Keterangan, then Total
    const row = [
      new Date(), 
      dataForm.nama, 
      dataForm.divisi
    ];
    
    // Add all quantities from the array
    if (Array.isArray(dataForm.qty)) {
      dataForm.qty.forEach(q => row.push(q || 0));
    }
    
    row.push(dataForm.keterangan || "");
    row.push(dataForm.total || 0);
    row.push(dataForm.lokasi || "");
    
    sheet.appendRow(row);
    return "Sukses";
  } catch (error) {
    Logger.log("Error in prosesPesanan: " + error.toString());
    throw new Error("Gagal memproses pesanan: " + error.message);
  }
}