"use client";

import { CopyButton } from "./CopyButton";
import { ShareLink } from "./ShareLink";
import { ExportButton } from "./ExportButton";

interface AnalysisToolbarProps {
  type: "content" | "keyword" | "account";
  id: string;
  summary?: string;
}

/**
 * Unified toolbar for analysis result pages:
 * copy summary + share link + export
 */
export function AnalysisToolbar({ type, id, summary }: AnalysisToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {summary && <CopyButton text={summary} />}
      <ShareLink type={type} id={id} />
      <ExportButton type={type} id={id} />
    </div>
  );
}
