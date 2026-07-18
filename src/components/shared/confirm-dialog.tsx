"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "primary",
  busy,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "primary" | "danger";
  busy?: boolean;
  onConfirm(): void;
  onClose(): void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
      <div className="p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p></div><button type="button" className="focus-ring rounded-lg p-2 text-slate-500" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div><div className="mt-6 flex justify-end gap-3"><button type="button" className="button-secondary" onClick={onClose} disabled={busy}>Cancel</button><button type="button" className={tone === "danger" ? "button-danger" : "button-primary"} onClick={onConfirm} disabled={busy}>{busy ? "Working…" : confirmLabel}</button></div></div>
    </dialog>
  );
}
