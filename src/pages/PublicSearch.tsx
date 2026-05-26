import { useState, useMemo } from 'react';
import {
  Search,
  Package,
  MapPin,
  Phone,
  Truck,
  Calendar,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { parcelStorage } from '../lib/storage';
import { StatusBadge } from '../components/ui/Badge';
import { settingsStorage } from '../lib/storage';
import type { Parcel } from '../types';

interface PublicSearchProps {
  onGoToStaff: () => void;
  onHome?: () => void;
}

type SearchField = 'all' | 'trackingNumber' | 'customerName' | 'mobileNumber' | 'island';

const FIELD_LABELS: Record<SearchField, string> = {
  all: 'All Fields',
  trackingNumber: 'Tracking Number',
  customerName: 'Customer Name',
  mobileNumber: 'Mobile Number',
  island: 'Island / Location',
};

import { Navbar } from '../components/layout/Navbar';

export function PublicSearch({ onGoToStaff, onHome }: PublicSearchProps) {
  const [query, setQuery] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);

  const settings = settingsStorage.get();
  const publicOfficeName = 'Cpex Hoarafushi';
  const publicIslandName = 'Hoarafushi, Maldives';

  const results = useMemo(() => {
    if (!query.trim() || !hasSearched) return [];
    // Only show non-delivered, non-returned parcels in public search
    const all = parcelStorage.search(query, searchField).filter(
      (p) => p.status !== 'Delivered' && p.status !== 'Returned'
    );
    return all;
  }, [query, searchField, hasSearched]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setHasSearched(true);
      setSelectedParcel(null);
    }
  };

  const handleClear = () => {
    setQuery('');
    setHasSearched(false);
    setSelectedParcel(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
      <Navbar onHome={onHome} onCustomer={() => {}} onAdmin={onGoToStaff} />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-sm font-medium mb-5">
            <Package className="w-4 h-4" />
            Parcel Tracking Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Track Your Parcel
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-md mx-auto">
            Search for your parcel using your name, mobile number, tracking number, or island
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 sm:p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-3">
            {/* Field selector */}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(FIELD_LABELS) as SearchField[]).map((field) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => setSearchField(field)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${searchField === field
                      ? 'bg-teal-500 text-white'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                >
                  {FIELD_LABELS[field]}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (!e.target.value) setHasSearched(false);
                  }}
                  placeholder={
                    searchField === 'trackingNumber'
                      ? 'Enter tracking number...'
                      : searchField === 'mobileNumber'
                      ? 'Enter mobile number...'
                      : searchField === 'customerName'
                      ? 'Enter your name...'
                      : searchField === 'island'
                      ? 'Enter island name...'
                      : 'Search by name, mobile, tracking number or island...'
                  }
                  className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-white/15 text-white placeholder-slate-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white/20 text-base"
                />
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-5 h-5 text-slate-400 hover:text-white" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!query.trim()}
                className="px-5 py-3.5 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="space-y-3">
            {results.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-10 text-center">
                <Package className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                <h3 className="text-white font-semibold text-lg mb-1">No parcels found</h3>
                <p className="text-slate-400 text-sm">
                  No available parcels match your search. If you expected a parcel, please contact our office.
                </p>
                <div className="mt-4 text-xs text-slate-500">
                  <p>📞 {settings.contactNumber}</p>
                  <p>✉️ {settings.emailAddress}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                  <CheckCircle className="w-4 h-4 text-teal-400" />
                  Found {results.length} parcel{results.length !== 1 ? 's' : ''} available for collection
                </div>
                {results.map((parcel) => (
                  <div
                    key={parcel.id}
                    onClick={() => setSelectedParcel(selectedParcel?.id === parcel.id ? null : parcel)}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 sm:p-5 cursor-pointer hover:bg-white/15 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Package className="w-5 h-5 text-teal-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-xs font-semibold bg-white/15 text-slate-200 px-2 py-0.5 rounded">
                              {parcel.trackingNumber}
                            </span>
                            <StatusBadge status={parcel.status} size="sm" />
                          </div>
                          <h3 className="font-semibold text-white">{parcel.customerName}</h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-400">
                            {parcel.mobileNumber && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {parcel.mobileNumber}
                              </span>
                            )}
                            {parcel.island && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {parcel.island}
                              </span>
                            )}
                            {parcel.arrivalDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(parseISO(parcel.arrivalDate), 'MMM d, yyyy')}
                              </span>
                            )}
                            {parcel.courierName && (
                              <span className="flex items-center gap-1">
                                <Truck className="w-3 h-3" /> {parcel.courierName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {parcel.status === 'Ready for Collection' && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Ready</span>
                          </div>
                        )}
                        {parcel.status === 'Received' && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Processing</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedParcel?.id === parcel.id && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {parcel.description && (
                            <div>
                              <p className="text-slate-500 text-xs mb-0.5">Description</p>
                              <p className="text-slate-200">{parcel.description}</p>
                            </div>
                          )}
                          {parcel.address && (
                            <div>
                              <p className="text-slate-500 text-xs mb-0.5">Address</p>
                              <p className="text-slate-200">{parcel.address}</p>
                            </div>
                          )}
                        </div>

                        {parcel.status === 'Ready for Collection' && (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <p className="text-emerald-300 text-sm font-medium flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Your parcel is ready for collection!
                            </p>
                            <p className="text-emerald-400/70 text-xs mt-1">
                              Please bring a valid ID when collecting your parcel from{' '}
                              {settings.officeName}.
                            </p>
                          </div>
                        )}
                        {parcel.status === 'Received' && (
                          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <p className="text-blue-300 text-sm font-medium flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Your parcel is being processed
                            </p>
                            <p className="text-blue-400/70 text-xs mt-1">
                              We will notify you when it is ready for collection.
                            </p>
                          </div>
                        )}
                        {parcel.remarks && (
                          <div>
                            <p className="text-slate-500 text-xs mb-0.5">Notes</p>
                            <p className="text-slate-300 text-sm">{parcel.remarks}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* How it works */}
        {!hasSearched && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            {[
              {
                icon: Search,
                title: 'Search Your Parcel',
                desc: 'Enter your name, mobile number, or tracking number in the search box above',
              },
              {
                icon: Package,
                title: 'View Status',
                desc: 'See if your parcel has arrived and is ready for collection',
              },
              {
                icon: CheckCircle,
                title: 'Collect at Office',
                desc: 'Bring a valid ID to collect your parcel from our post office',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white/5 rounded-xl border border-white/10 p-4 text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-teal-400" />
                </div>
                <h4 className="text-white font-medium text-sm mb-1">{title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-10 pt-6 border-t border-white/10">
          <p className="text-slate-500 text-xs">
            {publicOfficeName} · {publicIslandName}
          </p>
          <p className="text-slate-600 text-xs mt-1">
            {settings.contactNumber} · {settings.emailAddress}
          </p>
        </div>
      </div>
    </div>
  );
}
