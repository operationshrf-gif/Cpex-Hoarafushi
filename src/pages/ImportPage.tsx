import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  Info,
} from 'lucide-react';
import { parseExcelFile } from '../lib/excelImport';
import { parcelStorage, batchStorage, activityStorage } from '../lib/storage';
import { StatusBadge } from '../components/ui/Badge';
import type { ImportPreviewRow, AuthSession, ParcelStatus } from '../types';

interface ImportPageProps {
  session: AuthSession;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

export function ImportPage({ session }: ImportPageProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [parseStats, setParseStats] = useState({
    total: 0,
    valid: 0,
    errors: 0,
    duplicates: 0,
  });
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [skipErrors, setSkipErrors] = useState(true);
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const [importResult, setImportResult] = useState({ success: 0, skipped: 0, errors: 0 });
  const [_isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setParseError('');
    setParseStats({ total: 0, valid: 0, errors: 0, duplicates: 0 });

    const existing = new Set(
      parcelStorage.getAll().map((p) => p.trackingNumber.toLowerCase())
    );

    try {
      const result = await parseExcelFile(f, existing);
      setPreview(result.preview);
      setParseStats({
        total: result.totalRows,
        valid: result.validRows,
        errors: result.errorRows,
        duplicates: result.duplicateRows,
      });
      setStep('preview');
    } catch (err) {
      setParseError((err as Error).message);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleImport = async () => {
    setIsImporting(true);
    setStep('importing');

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const toImport = preview.filter((row) => {
      if (row.errors.length > 0 && skipErrors) { skippedCount++; return false; }
      if (row.isDuplicate && skipDuplicates) { skippedCount++; return false; }
      return true;
    });

    if (toImport.length > 0) {
      const parcels = toImport.map((row) => ({
        trackingNumber: row.trackingNumber,
        customerName: row.customerName,
        mobileNumber: row.mobileNumber,
        address: row.address,
        island: row.island,
        description: row.description,
        arrivalDate: row.arrivalDate,
        courierName: row.courierName,
        status: row.status as ParcelStatus,
        remarks: row.remarks,
        importBatchId: '',
      }));

      try {
        const created = parcelStorage.bulkCreate(parcels);
        successCount = created.length;

        const batch = batchStorage.create({
          filename: file?.name || 'unknown',
          importedAt: new Date().toISOString(),
          importedBy: session.username,
          totalRows: preview.length,
          successRows: successCount,
          errorRows: errorCount,
          errors: [],
        });

        // Update batch ID on all created parcels
        created.forEach((p) => parcelStorage.update(p.id, { importBatchId: batch.id }));

        activityStorage.log({
          userId: session.userId,
          username: session.username,
          action: 'IMPORT_PARCELS',
          target: batch.id,
          details: `Imported ${successCount} parcels from ${file?.name}, skipped ${skippedCount}`,
        });
      } catch {
        errorCount = toImport.length;
      }
    }

    setImportResult({ success: successCount, skipped: skippedCount, errors: errorCount });
    setIsImporting(false);
    setStep('complete');
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setPreview([]);
    setParseError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const headers = [
      'Tracking Number',
      'Customer Name',
      'Mobile Number',
      'Address',
      'Island',
      'Parcel Description',
      'Arrival Date',
      'Courier Name',
      'Parcel Status',
      'Remarks',
    ];
    const sampleRow = [
      'DHL-2024-001',
      'Ahmed Ali',
      '+960 7123456',
      'Maafannu, Block 3',
      'Malé',
      'Electronics',
      '2024-01-15',
      'DHL',
      'Received',
      'Handle with care',
    ];
    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parcel-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Import Parcels</h2>
        <p className="text-sm text-gray-500">Upload Excel (.xlsx) or CSV files to bulk import parcels</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {(['upload', 'preview', 'complete'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full
                ${step === s ? 'bg-teal-100 text-teal-700' : 
                  (step === 'complete' || (step === 'preview' && i < 1) || (step === 'importing' && i < 2))
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'}`}
            >
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold
                ${step === s ? 'bg-teal-600 text-white' : 
                  (step === 'complete' || (step === 'preview' && i < 1))
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'}`}
              >
                {i + 1}
              </span>
              <span className="hidden sm:inline capitalize">{s === 'complete' ? 'Done' : s}</span>
            </div>
            {i < 2 && <div className="w-8 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Supported Formats</p>
              <p>Excel files (.xlsx, .xls) and CSV files (.csv) are supported. The system will automatically detect column headers.</p>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
              ${isDragging
                ? 'border-teal-400 bg-teal-50 scale-[1.01]'
                : 'border-gray-200 bg-gray-50 hover:border-teal-300 hover:bg-teal-50/50'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center">
                <Upload className="w-8 h-8 text-teal-600" />
              </div>
            </div>
            <p className="text-base font-semibold text-gray-800">
              {isDragging ? 'Drop your file here' : 'Drag & drop or click to browse'}
            </p>
            <p className="text-sm text-gray-500 mt-1">Supports .xlsx, .xls, .csv</p>
          </div>

          {parseError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{parseError}</p>
            </div>
          )}

          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download CSV Template
          </button>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Rows', value: parseStats.total, color: 'bg-gray-100 text-gray-700' },
              { label: 'Valid Rows', value: parseStats.valid, color: 'bg-green-100 text-green-700' },
              { label: 'Rows with Errors', value: parseStats.errors, color: 'bg-red-100 text-red-700' },
              { label: 'Duplicates', value: parseStats.duplicates, color: 'bg-amber-100 text-amber-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-xl p-4 ${color}`}>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* File info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <FileSpreadsheet className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{file?.name}</p>
              <p className="text-xs text-gray-500">
                {(file?.size ?? 0) > 1024
                  ? `${((file?.size ?? 0) / 1024).toFixed(1)} KB`
                  : `${file?.size} bytes`}
              </p>
            </div>
            <button onClick={reset} className="text-sm text-teal-600 hover:text-teal-700 font-medium">
              Change
            </button>
          </div>

          {/* Import Options */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 border-gray-300"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">Skip Duplicate Tracking Numbers</p>
                <p className="text-xs text-gray-500">Parcels with existing tracking numbers will be skipped</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={skipErrors}
                onChange={(e) => setSkipErrors(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 border-gray-300"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">Skip Rows with Errors</p>
                <p className="text-xs text-gray-500">Invalid rows will be skipped during import</p>
              </div>
            </label>
          </div>

          {/* Preview Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Data Preview (first 50 rows)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Row</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Status</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Tracking #</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Customer</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Island</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Courier</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Parcel Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.slice(0, 50).map((row) => (
                    <tr
                      key={row.row}
                      className={`transition-colors ${
                        row.errors.length > 0
                          ? 'bg-red-50/50'
                          : row.isDuplicate
                          ? 'bg-amber-50/50'
                          : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <td className="px-3 py-2 text-gray-500">{row.row}</td>
                      <td className="px-3 py-2">
                        {row.errors.length > 0 ? (
                          <button
                            onClick={() => {
                              const s = new Set(expandedErrors);
                              s.has(row.row) ? s.delete(row.row) : s.add(row.row);
                              setExpandedErrors(s);
                            }}
                            className="flex items-center gap-1 text-red-600 font-medium"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Error
                            {expandedErrors.has(row.row) ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        ) : row.isDuplicate ? (
                          <span className="flex items-center gap-1 text-amber-600 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Duplicate
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            OK
                          </span>
                        )}
                        {expandedErrors.has(row.row) && row.errors.length > 0 && (
                          <div className="mt-1 pl-4">
                            {row.errors.map((e, i) => (
                              <p key={i} className="text-red-600 text-xs">{e.field}: {e.message}</p>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-gray-800">{row.trackingNumber || '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{row.customerName || '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{row.island || '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{row.courierName || '—'}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={row.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.length > 50 && (
              <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-100">
                Showing 50 of {preview.length} rows
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Start Over
            </button>
            <button
              onClick={handleImport}
              disabled={preview.filter(r => !(r.errors.length > 0 && skipErrors) && !(r.isDuplicate && skipDuplicates)).length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              Import{' '}
              {preview.filter(r => !(r.errors.length > 0 && skipErrors) && !(r.isDuplicate && skipDuplicates)).length}{' '}
              Parcels
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {step === 'importing' && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
          <p className="text-lg font-semibold text-gray-800">Importing parcels...</p>
          <p className="text-sm text-gray-500">Please wait while data is being processed</p>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 'complete' && (
        <div className="space-y-6">
          <div className="flex flex-col items-center py-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-9 h-9 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Import Complete!</h3>
            <p className="text-sm text-gray-500">Your parcel data has been imported successfully</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-700">{importResult.success}</p>
              <p className="text-sm text-green-600 font-medium mt-1">Imported</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-amber-700">{importResult.skipped}</p>
              <p className="text-sm text-amber-600 font-medium mt-1">Skipped</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-700">{importResult.errors}</p>
              <p className="text-sm text-red-600 font-medium mt-1">Errors</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Upload className="w-4 h-4" />
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
