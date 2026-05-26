import { useState, useMemo, type FormEvent } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Download,
  ChevronDown,
  X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { parcelStorage, activityStorage } from '../lib/storage';
import { exportToExcel } from '../lib/excelImport';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import type { Parcel, ParcelStatus, AuthSession } from '../types';

interface ParcelsPageProps {
  session: AuthSession;
  onNavigate: (page: string) => void;
}

const STATUS_OPTIONS: ParcelStatus[] = [
  'Received',
  'Ready for Collection',
  'Delivered',
  'Returned',
  'Pending',
];

const INITIAL_FORM: Omit<Parcel, 'id' | 'createdAt' | 'updatedAt'> = {
  trackingNumber: '',
  customerName: '',
  mobileNumber: '',
  address: '',
  island: '',
  description: '',
  arrivalDate: new Date().toISOString().split('T')[0],
  courierName: '',
  status: 'Received',
  remarks: '',
};

interface ParcelFormProps {
  formError: string;
  formData: Omit<Parcel, 'id' | 'createdAt' | 'updatedAt'>;
  showEditModal: boolean;
  onChange: (data: Omit<Parcel, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
  showAddModal: boolean;
}

const ParcelForm = ({
  formError,
  formData,
  showEditModal,
  onChange,
  onSubmit,
  onClose,
  showAddModal,
}: ParcelFormProps) => {
  return (
    <form onSubmit={onSubmit} className="p-6 space-y-4">
      {formError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {formError}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tracking Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.trackingNumber}
            onChange={(e) => onChange({ ...formData, trackingNumber: e.currentTarget.value })}
            autoCorrect="off"
            spellCheck="false"
            autoCapitalize="off"
            inputMode="text"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="e.g. DHL-2024-001"
            disabled={showEditModal}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => onChange({ ...formData, customerName: e.currentTarget.value })}
            autoCorrect="off"
            spellCheck="false"
            autoCapitalize="off"
            inputMode="text"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Full name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
          <input
            type="tel"
            value={formData.mobileNumber}
            onChange={(e) => onChange({ ...formData, mobileNumber: e.currentTarget.value })}
            autoCorrect="off"
            spellCheck="false"
            autoCapitalize="off"
            inputMode="tel"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="+960 7XXXXXX"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Island / Atoll</label>
          <input
            type="text"
            value={formData.island}
            onChange={(e) => onChange({ ...formData, island: e.currentTarget.value })}
            autoCorrect="off"
            spellCheck="false"
            autoCapitalize="off"
            inputMode="text"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="e.g. Malé, Hulhumale"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => onChange({ ...formData, address: e.currentTarget.value })}
            autoCorrect="off"
            spellCheck="false"
            autoCapitalize="off"
            inputMode="text"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Full delivery address"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Parcel Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => onChange({ ...formData, description: e.currentTarget.value })}
            autoCorrect="off"
            spellCheck="false"
            autoCapitalize="off"
            inputMode="text"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="e.g. Electronics, Clothing"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Date</label>
          <input
            type="date"
            value={formData.arrivalDate}
            onChange={(e) => onChange({ ...formData, arrivalDate: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Courier Name</label>
          <input
            type="text"
            value={formData.courierName}
            onChange={(e) => onChange({ ...formData, courierName: e.currentTarget.value })}
            autoCorrect="off"
            spellCheck="false"
            autoCapitalize="off"
            inputMode="text"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="e.g. DHL, FedEx, Aramex"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => onChange({ ...formData, status: e.target.value as ParcelStatus })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <input
            type="text"
            value={formData.remarks}
            onChange={(e) => onChange({ ...formData, remarks: e.currentTarget.value })}
            autoCorrect="off"
            spellCheck="false"
            autoCapitalize="off"
            inputMode="text"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Additional notes"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          {showAddModal ? 'Add Parcel' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

export function ParcelsPage({ session }: ParcelsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ParcelStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const allParcels = parcelStorage.getAll();

  const filtered = useMemo(() => {
    let list = allParcels;
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.trackingNumber.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          p.mobileNumber.includes(q) ||
          p.island.toLowerCase().includes(q)
      );
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [allParcels, searchQuery, statusFilter]);

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.trackingNumber.trim()) {
      setFormError('Tracking number is required.');
      return;
    }
    if (!formData.customerName.trim()) {
      setFormError('Customer name is required.');
      return;
    }

    if (showAddModal) {
      const exists = parcelStorage.getByTracking(formData.trackingNumber);
      if (exists) {
        setFormError('A parcel with this tracking number already exists.');
        return;
      }
      const parcel = parcelStorage.create(formData);
      activityStorage.log({
        userId: session.userId,
        username: session.username,
        action: 'CREATE_PARCEL',
        target: parcel.id,
        details: `Created parcel ${parcel.trackingNumber} for ${parcel.customerName}`,
      });
      setShowAddModal(false);
      setFormData(INITIAL_FORM);
    } else if (showEditModal && selectedParcel) {
      parcelStorage.update(selectedParcel.id, formData);
      activityStorage.log({
        userId: session.userId,
        username: session.username,
        action: 'UPDATE_PARCEL',
        target: selectedParcel.id,
        details: `Updated parcel ${selectedParcel.trackingNumber}`,
      });
      setShowEditModal(false);
    }
  };

  const handleDelete = () => {
    if (!selectedParcel) return;
    parcelStorage.delete(selectedParcel.id);
    activityStorage.log({
      userId: session.userId,
      username: session.username,
      action: 'DELETE_PARCEL',
      target: selectedParcel.id,
      details: `Deleted parcel ${selectedParcel.trackingNumber}`,
    });
    setShowDeleteModal(false);
    setSelectedParcel(null);
  };

  const handleExport = () => {
    const data = filtered.map((p) => ({
      'Tracking Number': p.trackingNumber,
      'Customer Name': p.customerName,
      'Mobile Number': p.mobileNumber,
      'Island': p.island,
      'Address': p.address,
      'Description': p.description,
      'Arrival Date': p.arrivalDate,
      'Courier': p.courierName,
      'Status': p.status,
      'Remarks': p.remarks,
    }));
    exportToExcel(data, `parcels-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const openEdit = (parcel: Parcel) => {
    setSelectedParcel(parcel);
    setFormData({
      trackingNumber: parcel.trackingNumber,
      customerName: parcel.customerName,
      mobileNumber: parcel.mobileNumber,
      address: parcel.address,
      island: parcel.island,
      description: parcel.description,
      arrivalDate: parcel.arrivalDate,
      courierName: parcel.courierName,
      status: parcel.status,
      remarks: parcel.remarks,
    });
    setFormError('');
    setShowEditModal(true);
  };

  const canEdit = session.role === 'admin' || session.role === 'staff';
  const canDelete = session.role === 'admin';

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">Parcels</h2>
          <p className="text-sm text-gray-500">{filtered.length} parcels found</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          {canEdit && (
            <button
              onClick={() => { setFormData(INITIAL_FORM); setFormError(''); setShowAddModal(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Parcel
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by tracking, name, mobile, island..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as ParcelStatus | 'all'); setCurrentPage(1); }}
            className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Tracking #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell whitespace-nowrap">
                  Island
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell whitespace-nowrap">
                  Courier
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell whitespace-nowrap">
                  Arrival
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No parcels found</p>
                  </td>
                </tr>
              ) : (
                paginated.map((parcel) => (
                  <tr key={parcel.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                        {parcel.trackingNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{parcel.customerName}</p>
                        <p className="text-xs text-gray-500">{parcel.mobileNumber}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                      {parcel.island || parcel.address}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                      {parcel.courierName || '—'}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600 whitespace-nowrap">
                      {parcel.arrivalDate
                        ? format(parseISO(parcel.arrivalDate), 'MMM d, yyyy')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={parcel.status} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSelectedParcel(parcel); setShowViewModal(true); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => openEdit(parcel)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => { setSelectedParcel(parcel); setShowDeleteModal(true); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Page {currentPage} of {totalPages} · {filtered.length} results
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Parcel" size="xl">
        <ParcelForm
          formError={formError}
          formData={formData}
          showEditModal={false}
          showAddModal={showAddModal}
          onChange={setFormData}
          onSubmit={handleSubmit}
          onClose={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Parcel" size="xl">
        <ParcelForm
          formError={formError}
          formData={formData}
          showEditModal={true}
          showAddModal={showAddModal}
          onChange={setFormData}
          onSubmit={handleSubmit}
          onClose={() => setShowEditModal(false)}
        />
      </Modal>

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Parcel Details" size="lg">
        {selectedParcel && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-semibold bg-gray-100 px-3 py-1 rounded-lg">
                {selectedParcel.trackingNumber}
              </span>
              <StatusBadge status={selectedParcel.status} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Customer Name', value: selectedParcel.customerName },
                { label: 'Mobile Number', value: selectedParcel.mobileNumber || '—' },
                { label: 'Island', value: selectedParcel.island || '—' },
                { label: 'Address', value: selectedParcel.address || '—' },
                { label: 'Description', value: selectedParcel.description || '—' },
                { label: 'Courier', value: selectedParcel.courierName || '—' },
                {
                  label: 'Arrival Date',
                  value: selectedParcel.arrivalDate
                    ? format(parseISO(selectedParcel.arrivalDate), 'MMMM d, yyyy')
                    : '—',
                },
                { label: 'Remarks', value: selectedParcel.remarks || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="col-span-1">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
                  <p className="text-gray-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            {selectedParcel.status === 'Delivered' && selectedParcel.deliveredAt && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-sm">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Delivered</span>
                </div>
                <p className="text-emerald-600 mt-1 text-xs">
                  Delivered on {format(parseISO(selectedParcel.deliveredAt), 'MMMM d, yyyy HH:mm')}
                  {selectedParcel.deliveredBy ? ` by ${selectedParcel.deliveredBy}` : ''}
                  {selectedParcel.receiverName ? ` · Received by: ${selectedParcel.receiverName}` : ''}
                </p>
              </div>
            )}
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
              Created: {format(parseISO(selectedParcel.createdAt), 'MMM d, yyyy HH:mm')} ·
              Updated: {format(parseISO(selectedParcel.updatedAt), 'MMM d, yyyy HH:mm')}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Parcel" size="sm">
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-2">
            Are you sure you want to delete parcel{' '}
            <span className="font-semibold text-gray-900">{selectedParcel?.trackingNumber}</span>?
          </p>
          <p className="text-sm text-red-600 mb-6">This action cannot be undone.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
