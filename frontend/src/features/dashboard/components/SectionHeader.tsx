import { Link } from "react-router-dom";

export interface SectionHeaderProps {
  title: string;
  action?: { label: string; to: string };
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-heading-md font-semibold text-text-primary">{title}</h2>
      {action && (
        <Link
          to={action.to}
          className="text-body-sm text-gold-bright hover:text-gold-muted transition-colors flex items-center gap-1"
        >
          {action.label}
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}
