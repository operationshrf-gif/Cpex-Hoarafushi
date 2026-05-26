// ============================================================
// IslandPost — Excel / CSV Import Logic
// ============================================================

import * as XLSX from 'xlsx';
import type { ImportPreviewRow, ParcelStatus, ImportError } from '../types';

// Column aliases — maps many possible header names to our internal fields
const COLUMN_MAP: Record<string, string> = {
  // tracking number
  'tracking number': 'trackingNumber',
  'tracking no': 'trackingNumber',
  'tracking#': 'trackingNumber',
  'tracking': 'trackingNumber',
  'parcel number': 'trackingNumber',
  'parcel no': 'trackingNumber',
  'awb': 'trackingNumber',
  'awb number': 'trackingNumber',
  'reference': 'trackingNumber',

  // customer name
  'customer name': 'customerName',
  'name': 'customerName',
  'recipient': 'customerName',
  'consignee': 'customerName',
  'full name': 'customerName',
  'receiver name': 'customerName',

  // mobile
  'mobile number': 'mobileNumber',
  'mobile': 'mobileNumber',
  'phone': 'mobileNumber',
  'phone number': 'mobileNumber',
  'contact': 'mobileNumber',
  'contact number': 'mobileNumber',
  'tel': 'mobileNumber',

  // address / island
  'address': 'address',
  'address/island': 'address',
  'delivery address': 'address',
  'island': 'island',
  'atoll': 'island',
  'location': 'island',
  'city': 'island',

  // description
  'parcel description': 'description',
  'description': 'description',
  'contents': 'description',
  'item description': 'description',
  'goods': 'description',
  'commodity': 'description',

  // arrival date
  'arrival date': 'arrivalDate',
  'date': 'arrivalDate',
  'received date': 'arrivalDate',
  'import date': 'arrivalDate',
  'date received': 'arrivalDate',

  // courier
  'courier name': 'courierName',
  'courier': 'courierName',
  'carrier': 'courierName',
  'shipping company': 'courierName',
  'shipper': 'courierName',

  // status
  'parcel status': 'status',
  'status': 'status',
  'delivery status': 'status',

  // remarks
  'remarks': 'remarks',
  'notes': 'remarks',
  'comment': 'remarks',
  'comments': 'remarks',
};

// Available statuses for validation reference
export const VALID_STATUSES: ParcelStatus[] = [
  'Received',
  'Ready for Collection',
  'Delivered',
  'Returned',
  'Pending',
];

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/\s+/g, ' ');
}

function parseDate(value: unknown): string {
  if (!value) return new Date().toISOString().split('T')[0];

  // Excel serial date
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const d = new Date(date.y, date.m - 1, date.d);
      return d.toISOString().split('T')[0];
    }
  }

  // String date
  if (typeof value === 'string') {
    const cleaned = value.trim();
    // Try various formats
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    // DD/MM/YYYY
    const dmyMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmyMatch) {
      const d = new Date(
        parseInt(dmyMatch[3]),
        parseInt(dmyMatch[2]) - 1,
        parseInt(dmyMatch[1])
      );
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
  }

  return new Date().toISOString().split('T')[0];
}

function normalizeStatus(value: unknown): ParcelStatus {
  if (!value) return 'Received';
  const v = String(value).trim().toLowerCase();
  if (v.includes('ready') || v.includes('collection')) return 'Ready for Collection';
  if (v.includes('deliver')) return 'Delivered';
  if (v.includes('return')) return 'Returned';
  if (v.includes('pending')) return 'Pending';
  return 'Received';
}

function normalizeMobile(value: unknown): string {
  if (!value) return '';
  return String(value).trim().replace(/[^\d+\-\s()]/g, '');
}

export interface ParseResult {
  preview: ImportPreviewRow[];
  headers: string[];
  mappedHeaders: Record<string, string>;
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicateRows: number;
}

/**
 * Parse an Excel or CSV file and return a preview of the data.
 */
export async function parseExcelFile(
  file: File,
  existingTrackingNumbers: Set<string>
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Get raw data with header row
        const rawData = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          raw: true,
        }) as unknown[][];

        if (rawData.length < 2) {
          reject(new Error('File is empty or has no data rows.'));
          return;
        }

        // Map headers
        const headerRow = rawData[0] as string[];
        const mappedHeaders: Record<string, string> = {};
        const fieldIndices: Record<string, number> = {};

        headerRow.forEach((h, idx) => {
          const normalized = normalizeHeader(String(h));
          const mapped = COLUMN_MAP[normalized];
          if (mapped) {
            mappedHeaders[String(h)] = mapped;
            fieldIndices[mapped] = idx;
          }
        });

        // Process data rows
        const preview: ImportPreviewRow[] = [];
        let validRows = 0;
        let errorRows = 0;
        let duplicateRows = 0;

        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i] as unknown[];
          const errors: ImportError[] = [];

          const getValue = (field: string): unknown => {
            const idx = fieldIndices[field];
            return idx !== undefined ? row[idx] : '';
          };

          const trackingNumber = String(getValue('trackingNumber') || '').trim();
          const customerName = String(getValue('customerName') || '').trim();
          const mobileNumber = normalizeMobile(getValue('mobileNumber'));
          const address = String(getValue('address') || '').trim();
          const island = String(getValue('island') || getValue('address') || '').trim();
          const description = String(getValue('description') || '').trim();
          const arrivalDate = parseDate(getValue('arrivalDate'));
          const courierName = String(getValue('courierName') || '').trim();
          const status = normalizeStatus(getValue('status'));
          const remarks = String(getValue('remarks') || '').trim();

          // Validation
          if (!trackingNumber) {
            errors.push({
              row: i + 1,
              field: 'trackingNumber',
              message: 'Tracking number is required',
            });
          }

          if (!customerName) {
            errors.push({
              row: i + 1,
              field: 'customerName',
              message: 'Customer name is required',
            });
          }

          // Check duplicate
          const isDuplicate =
            !!trackingNumber &&
            existingTrackingNumbers.has(trackingNumber.toLowerCase());

          if (isDuplicate) {
            duplicateRows++;
          }

          if (errors.length > 0) {
            errorRows++;
          } else {
            validRows++;
          }

          // Skip completely empty rows
          const allEmpty = [trackingNumber, customerName, mobileNumber, address, description].every(
            (v) => !v
          );
          if (allEmpty) continue;

          preview.push({
            row: i + 1,
            trackingNumber,
            customerName,
            mobileNumber,
            address,
            island: island || address,
            description,
            arrivalDate,
            courierName,
            status,
            remarks,
            errors,
            isDuplicate,
          });
        }

        resolve({
          preview,
          headers: headerRow.map(String),
          mappedHeaders,
          totalRows: preview.length,
          validRows,
          errorRows,
          duplicateRows,
        });
      } catch (err) {
        reject(new Error('Failed to parse file: ' + (err as Error).message));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export parcels to Excel file
 */
export function exportToExcel(parcels: unknown[], filename = 'parcels-export.xlsx'): void {
  const ws = XLSX.utils.json_to_sheet(parcels);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Parcels');
  XLSX.writeFile(wb, filename);
}
