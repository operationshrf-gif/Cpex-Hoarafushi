interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  trend?: { value: number; label: string };
  onClick?: () => void;
}

export function StatCard({ label, value, icon: Icon, color, trend, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm
        ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full
              ${trend.value >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          >
            {trend.value >= 0 ? '+' : ''}{trend.value} {trend.label}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900 tabular-nums">{value}</p>
      <p className="text-sm text-gray-500 mt-1 font-medium">{label}</p>
    </div>
  );
}
