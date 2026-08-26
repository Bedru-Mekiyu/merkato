import { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center h-[60vh] px-6">
      <div className="h-12 w-12 rounded-md bg-accent/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-accent" />
      </div>
      <h1 className="text-lg font-semibold text-white mb-1.5">{title}</h1>
      <p className="text-sm text-muted max-w-sm">{description}</p>
      <span className="mt-4 text-xs font-medium text-faint border border-border rounded-full px-3 py-1">
        Coming soon
      </span>
    </div>
  );
}
