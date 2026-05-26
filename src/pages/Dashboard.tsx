import { useMemo } from 'react';
import {
  Package,
  CheckCircle,
  Clock,
  Truck,
  ArrowDownToLine,
  RotateCcw,
  TrendingUp,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { parcelStorage, activityStorage } from '../lib/storage';
import { StatusBadge } from '../components/ui/Badge';
import type { AuthSession } from '../types';

interface DashboardProps {
  session: AuthSession;
  onNavigate: (page: string) => void;
}

const COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function Dashboard({ session, onNavigate }: DashboardProps) {
  const parcels = parcelStorage.getAll();
  const activity = activityStorage.getRecent(20);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: parcels.length,
      readyForCollection: parcels.filter((p) => p.status === 'Ready for Collection').length,
      deliveredToday: parcels.filter(
        (p) => p.status === 'Delivered' && p.deliveredAt?.split('T')[0] === today
      ).length,
      pending: parcels.filter((p) => p.status === 'Pending').length,
      receivedToday: parcels.filter((p) => p.arrivalDate === today).length,
      returned: parcels.filter((p) => p.status === 'Returned').length,
      received: parcels.filter((p) => p.status === 'Received').length,
      delivered: parcels.filter((p) => p.status === 'Delivered').length,
    };
  }, [parcels]);

  // Last 7 days arrivals chart
  const last7DaysData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const count = parcels.filter((p) => p.arrivalDate === dateStr).length;
      return { date: format(date, 'MMM d'), count };
    });
  }, [parcels]);

  // Status distribution for pie chart
  const statusData = useMemo(() => {
    const statusMap: Record<string, number> = {};
    parcels.forEach((p) => {
      statusMap[p.status] = (statusMap[p.status] || 0) + 1;
    });
    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  }, [parcels]);

  // Recent parcels
  const recentParcels = useMemo(() => {
    return [...parcels]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [parcels]);

  const StatCard = ({
    label,
    value,
    icon: Icon,
    color,
    onClick,
  }: {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    onClick?: () => void;
  }) => (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Good {getGreeting()}, {session.fullName.split(' ')[0]}!
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} · Here's what's happening today
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-teal-50 rounded-xl border border-teal-100">
          <Activity className="w-4 h-4 text-teal-600" />
          <span className="text-sm font-medium text-teal-700">Live</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Parcels"
          value={stats.total}
          icon={Package}
          color="bg-slate-700"
          onClick={() => onNavigate('parcels')}
        />
        <StatCard
          label="Ready for Collection"
          value={stats.readyForCollection}
          icon={CheckCircle}
          color="bg-emerald-500"
          onClick={() => onNavigate('parcels')}
        />
        <StatCard
          label="Delivered Today"
          value={stats.deliveredToday}
          icon={Truck}
          color="bg-blue-500"
        />
        <StatCard
          label="Pending Parcels"
          value={stats.pending}
          icon={Clock}
          color="bg-amber-500"
          onClick={() => onNavigate('parcels')}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
          <ArrowDownToLine className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-blue-600 font-medium">Arrived Today</p>
            <p className="text-xl font-bold text-blue-800">{stats.receivedToday}</p>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-purple-600 font-medium">Received</p>
            <p className="text-xl font-bold text-purple-800">{stats.received}</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <RotateCcw className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-red-500 font-medium">Returned</p>
            <p className="text-xl font-bold text-red-700">{stats.returned}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Daily Arrivals */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Arrivals (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last7DaysData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Bar dataKey="count" name="Parcels" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Parcel Status Distribution</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No parcel data available
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Parcels + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Parcels */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Recently Added Parcels</h3>
            <button
              onClick={() => onNavigate('parcels')}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentParcels.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">No parcels yet</div>
            ) : (
              recentParcels.map((parcel) => (
                <div key={parcel.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {parcel.customerName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{parcel.trackingNumber}</p>
                  </div>
                  <StatusBadge status={parcel.status} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {activity.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">No activity yet</div>
            ) : (
              activity.slice(0, 8).map((log) => (
                <div key={log.id} className="px-5 py-3 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-snug">
                      <span className="font-medium">{log.username}</span>{' '}
                      <span className="text-gray-500">{log.details}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(parseISO(log.timestamp), 'MMM d, HH:mm')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
