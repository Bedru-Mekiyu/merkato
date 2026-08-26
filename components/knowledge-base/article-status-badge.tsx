import { Badge } from "@/components/ui/badge";
import type { ArticleStatus } from "@/types/database";

export function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  return (
    <Badge variant={status === "published" ? "success" : "default"} className="capitalize shrink-0">
      {status}
    </Badge>
  );
}
