import { useState, useMemo } from 'react';
import {
  Search,
  Package,
  Filter,
  X,
  Eye,
  Edit2,
  CheckSquare,
  ChevronDown,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { parcelStorage } from '../lib/storage';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import type { Parcel, ParcelStatus, AuthSession } from '../types';

interface SearchPageProps {
  session: AuthSession;
  onNavigate: (page: string) => void;
}

type SearchField = 'all' | 'trackingNumber' | 'customerName' | 'mobileNumber' | 'island' | 'address';

const FIELD_OPTIONS: { value: SearchField; label: string }[] = [
  { value: 'all', label: 'All Fields' },
  { value: 'trackingNumber', label: 'Tracking Number' },
  { value: 'customerName', label: 'Customer Name' },
  { value: 'mobileNumber', label: 'Mobile Number' },
  { value: 'island', label: 'Island' },
];

const STATUS_OPTIONS: (ParcelStatus | 'all')[] = [
  'all', 'Received', 'Ready for Collection', 'Delivered', 'Returned', 'Pending'
];

export function SearchPage({ session, onNavigate }: SearchPageProps) {
  const [query, setQuery] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [statusFilter, setStatusFilter] = useState<ParcelStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const results = useMemo(() => {
    let list = parcelStorage.search(query, searchField);

    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (dateFrom) {
      list = list.filter((p) => p.arrivalDate >= dateFrom);
    }
    if (dateTo) {
      list = list.filter((p) => p.arrivalDate <= dateTo);
    }

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [query, searchField, statusFilter, dateFrom, dateTo]);

  const handleClear = () => {
    setQuery('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setSearchField('all');
  };

  const hasActiveFilters = query || statusFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Parcel Search</h2>
        <p className="text-sm text-gray-500">Search across all parcel records</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search parcels..."
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium transition-colors
              ${showFilters || hasActiveFilters
                ? 'border-teal-300 bg-teal-50 text-teal-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-teal-500" />
            )}
          </button>
        </div>

        {/* Field selector */}
        <div className="flex flex-wrap gap-2">
          {FIELD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSearchField(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${searchField === opt.value
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ParcelStatus | 'all')}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s === 'all' ? 'All Statuses' : s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Arrival From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Arrival To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium"
          >
            <X className="w-3.5 h-3.5" />
            Clear all filters
          </button>
        )}
      </div>

      {/* Results */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Search className="w-4 h-4 text-gray-400" />
        {query || hasActiveFilters
          ? `${results.length} result${results.length !== 1 ? 's' : ''} found`
          : `${results.length} total parcels`}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tracking</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Island</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Arrival</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Courier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">
                      {hasActiveFilters ? 'No parcels match your search' : 'Start typing to search'}
                    </p>
                  </td>
                </tr>
              ) : (
                results.map((parcel) => (
                  <tr key={parcel.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {parcel.trackingNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{parcel.customerName}</p>
                      <p className="text-xs text-gray-500">{parcel.mobileNumber}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600 text-xs">
                      {parcel.island || parcel.address || '—'}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600 text-xs whitespace-nowrap">
                      {parcel.arrivalDate
                        ? format(parseISO(parcel.arrivalDate), 'MMM d, yyyy')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-600 text-xs">
                      {parcel.courierName || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={parcel.status} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSelectedParcel(parcel); setShowViewModal(true); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(session.role === 'admin' || session.role === 'staff') && (
                          <button
                            onClick={() => onNavigate('handover')}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                            title="Handover"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>
                        )}
                        {session.role === 'admin' && (
                          <button
                            onClick={() => onNavigate('parcels')}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
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
      </div>

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Parcel Details" size="lg">
        {selectedParcel && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
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
                <div key={label}>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
                  <p className="text-gray-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            {selectedParcel.status !== 'Delivered' && (session.role === 'admin' || session.role === 'staff') && (
              <button
                onClick={() => { setShowViewModal(false); onNavigate('handover'); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
              >
                <CheckSquare className="w-4 h-4" />
                Process Handover
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
