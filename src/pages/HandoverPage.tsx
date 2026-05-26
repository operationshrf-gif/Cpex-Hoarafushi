import { useState, useMemo } from 'react';
import {
  Search,
  CheckSquare,
  Package,
  User,
  Clock,
  Truck,
  X,
  Filter,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { parcelStorage, deliveryStorage, activityStorage } from '../lib/storage';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import type { Parcel, AuthSession } from '../types';

interface HandoverPageProps {
  session: AuthSession;
}

export function HandoverPage({ session }: HandoverPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [staffNotes, setStaffNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const allParcels = parcelStorage.getAll();

  const filtered = useMemo(() => {
    let list = allParcels;

    if (filter === 'pending') {
      list = list.filter(
        (p) => p.status === 'Ready for Collection' || p.status === 'Received'
      );
    } else {
      list = list.filter((p) => p.status !== 'Delivered' && p.status !== 'Returned');
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
      (a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime()
    );
  }, [allParcels, searchQuery, filter]);

  const recentlyDelivered = useMemo(() => {
    return allParcels
      .filter((p) => p.status === 'Delivered' && p.deliveredAt)
      .sort((a, b) => new Date(b.deliveredAt!).getTime() - new Date(a.deliveredAt!).getTime())
      .slice(0, 5);
  }, [allParcels]);

  const openHandover = (parcel: Parcel) => {
    setSelectedParcel(parcel);
    setReceiverName(parcel.customerName);
    setStaffNotes('');
    setFormError('');
    setShowHandoverModal(true);
  };

  const handleConfirmDelivery = () => {
    if (!selectedParcel) return;
    if (!receiverName.trim()) {
      setFormError('Receiver name is required.');
      return;
    }

    const now = new Date().toISOString();

    parcelStorage.update(selectedParcel.id, {
      status: 'Delivered',
      deliveredAt: now,
      deliveredBy: session.fullName,
      receiverName: receiverName.trim(),
      remarks: staffNotes
        ? `${selectedParcel.remarks ? selectedParcel.remarks + ' | ' : ''}Delivery note: ${staffNotes}`
        : selectedParcel.remarks,
    });

    deliveryStorage.create({
      parcelId: selectedParcel.id,
      trackingNumber: selectedParcel.trackingNumber,
      customerName: selectedParcel.customerName,
      deliveredAt: now,
      deliveredBy: session.fullName,
      receiverName: receiverName.trim(),
      staffNotes: staffNotes,
    });

    activityStorage.log({
      userId: session.userId,
      username: session.username,
      action: 'DELIVER_PARCEL',
      target: selectedParcel.id,
      details: `Marked parcel ${selectedParcel.trackingNumber} as delivered to ${receiverName}`,
    });

    setShowHandoverModal(false);
    setSuccessMessage(
      `✅ Parcel ${selectedParcel.trackingNumber} marked as delivered to ${receiverName}`
    );
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Parcel Handover</h2>
        <p className="text-sm text-gray-500">Mark parcels as delivered and record handover details</p>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 font-medium">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Parcel list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by tracking, name, mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('pending')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors
                  ${filter === 'pending'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Clock className="w-4 h-4" />
                Ready
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors
                  ${filter === 'all'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Filter className="w-4 h-4" />
                All Active
              </button>
            </div>
          </div>

          {/* Results count */}
          <p className="text-xs text-gray-500 font-medium">{filtered.length} parcels</p>

          {/* Parcel Cards */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
                <Package className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 text-sm">No parcels available for handover</p>
              </div>
            ) : (
              filtered.map((parcel) => (
                <div
                  key={parcel.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                          {parcel.trackingNumber}
                        </span>
                        <StatusBadge status={parcel.status} size="sm" />
                      </div>
                      <p className="font-semibold text-gray-900 mt-1">{parcel.customerName}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                        <span>{parcel.mobileNumber}</span>
                        <span>·</span>
                        <span>{parcel.island || parcel.address}</span>
                        {parcel.courierName && (
                          <>
                            <span>·</span>
                            <span>{parcel.courierName}</span>
                          </>
                        )}
                      </div>
                      {parcel.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{parcel.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-xs text-gray-500 hidden sm:block">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {parcel.arrivalDate
                        ? format(parseISO(parcel.arrivalDate), 'MMM d')
                        : '—'}
                    </div>
                    <button
                      onClick={() => openHandover(parcel)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors whitespace-nowrap"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Handover
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recently Delivered */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Truck className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-semibold text-gray-700">Recently Delivered</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {recentlyDelivered.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  No deliveries yet
                </div>
              ) : (
                recentlyDelivered.map((parcel) => (
                  <div key={parcel.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        {parcel.trackingNumber}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-1">{parcel.customerName}</p>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {parcel.receiverName}
                      {parcel.deliveredAt && (
                        <span className="ml-1 text-gray-400">
                          · {format(parseISO(parcel.deliveredAt), 'MMM d, HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Handover Confirmation Modal */}
      <Modal
        isOpen={showHandoverModal}
        onClose={() => setShowHandoverModal(false)}
        title="Confirm Parcel Handover"
        size="md"
      >
        {selectedParcel && (
          <div className="p-6 space-y-5">
            {/* Parcel Info */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-sm font-semibold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                  {selectedParcel.trackingNumber}
                </span>
                <StatusBadge status={selectedParcel.status} size="sm" />
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer</span>
                  <span className="font-medium text-gray-800">{selectedParcel.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mobile</span>
                  <span className="font-medium text-gray-800">{selectedParcel.mobileNumber || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Description</span>
                  <span className="font-medium text-gray-800 text-right max-w-40 truncate">
                    {selectedParcel.description || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Courier</span>
                  <span className="font-medium text-gray-800">{selectedParcel.courierName || '—'}</span>
                </div>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receiver Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => { setReceiverName(e.target.value); setFormError(''); }}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Name of person collecting parcel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Staff Notes (optional)
              </label>
              <textarea
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>

            <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
              <p>Handover will be recorded as:</p>
              <p className="mt-0.5">
                <span className="font-medium">Staff:</span> {session.fullName} ·{' '}
                <span className="font-medium">Time:</span> {format(new Date(), 'MMM d, yyyy HH:mm')}
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowHandoverModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelivery}
                className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 flex items-center justify-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                Confirm Delivery
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
