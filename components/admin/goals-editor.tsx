"use client";

import { useState, useTransition } from "react";

import { updateDashboardGoals } from "@/app/(admin)/admin/actions";
import { GoalsModal } from "./goals-modal";

type Props = {
  premiumMembersGoal: number;
  monthlyRevenueGoalInCents: number;
  paidSignupsGoal: number;
};

export function GoalsEditor({
  premiumMembersGoal,
  monthlyRevenueGoalInCents,
  paidSignupsGoal,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleSave(values: {
    premiumMembersGoal: number;
    monthlyRevenueGoal: number;
    paidSignupsGoal: number;
  }) {
    startTransition(async () => {
      const result = await updateDashboardGoals(values);

      if (result.success) {
        setOpen(false);

        // Refresh server components after revalidatePath()
        window.location.reload();
      } else {
        alert(result.message);
      }
    });
  }

  return (
    <>
     <button
  onClick={() => setOpen(true)}
  className="rounded-lg border border-amber-500 bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
>
  Edit Goals
</button>

      <GoalsModal
        open={open}
        pending={pending}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        defaultValues={{
          premiumMembersGoal,
          monthlyRevenueGoal:
            monthlyRevenueGoalInCents / 100,
          paidSignupsGoal,
        }}
      />
    </>
  );
}