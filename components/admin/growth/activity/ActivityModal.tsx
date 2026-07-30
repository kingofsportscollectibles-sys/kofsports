"use client";

import { useState, type ReactNode } from "react";

import ActivityForm from "./ActivityForm";

type ActivityModalProps = {
  leadId: string;
  children: ReactNode;
};

export default function ActivityModal({
  leadId,
  children,
}: ActivityModalProps) {
  const [open, setOpen] = useState(false);

  function closeModal() {
    setOpen(false);
  }

  return (
    <>
      <div
        className="inline-flex"
        onClick={() => setOpen(true)}
      >
        {children}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="activity-modal-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2
                  id="activity-modal-title"
                  className="text-xl font-black text-slate-950"
                >
                  Log Activity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add an interaction to this lead&apos;s timeline.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close activity modal"
                className="rounded-lg px-3 py-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <ActivityForm
                leadId={leadId}
                onCancel={closeModal}
                onSuccess={closeModal}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
