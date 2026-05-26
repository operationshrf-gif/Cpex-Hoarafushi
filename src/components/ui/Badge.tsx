import type { ParcelStatus } from '../../types';

interface BadgeProps {
  status: ParcelStatus;
  size?: 'sm' | 'md';
}

const STATUS_STYLES: Record<ParcelStatus, string> = {
  'Received': 'bg-blue-100 text-blue-800 border-blue-200',
  'Ready for Collection': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Delivered': 'bg-gray-100 text-gray-700 border-gray-200',
  'Returned': 'bg-red-100 text-red-800 border-red-200',
  'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
};

const STATUS_DOTS: Record<ParcelStatus, string> = {
  'Received': 'bg-blue-500',
  'Ready for Collection': 'bg-emerald-500',
  'Delivered': 'bg-gray-500',
  'Returned': 'bg-red-500',
  'Pending': 'bg-amber-500',
};

export function StatusBadge({ status, size = 'md' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClass} ${STATUS_STYLES[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status]}`} />
      {status}
    </span>
  );
}

interface RoleBadgeProps {
  role: string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const styles: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    staff: 'bg-teal-100 text-teal-800 border-teal-200',
    customer: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border text-xs px-2.5 py-1 font-medium capitalize ${styles[role] || styles.customer}`}
    >
      {role}
    </span>
  );
}
