import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <div className="flex flex-col items-center justify-center text-center h-[60vh] px-6 animate-fade-in-up">
      <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.2)] flex items-center justify-center mb-5">
        <Icon className="h-6 w-6 text-indigo-400" />
      </div>
      <h1 className="text-xl font-bold text-white tracking-tight mb-2">{title}</h1>
      <p className="text-sm text-white/60 max-w-sm leading-relaxed">{description}</p>
      <Badge variant="primary" dot className="mt-5">
        In Active Development
      </Badge>
    </div>
  );
}
