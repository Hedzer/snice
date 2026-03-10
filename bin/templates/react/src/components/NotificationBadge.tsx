interface NotificationBadgeProps {
  count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  if (count <= 0) return null;

  return (
    <span className="notification-badge">
      {count > 99 ? '99+' : count}
    </span>
  );
}
