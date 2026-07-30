import GrowthHeader from "@/components/admin/growth/GrowthHeader";
import EmptyState from "@/components/admin/growth/shared/EmptyState";

export default function Page() {
  return (
    <>
      <GrowthHeader
        title="Tasks"
        description="This Growth OS section is ready for its database-connected interface."
      />

      <div className="p-5 sm:p-8">
        <EmptyState
          title="Tasks is ready to build"
          description="The route and shared Growth OS layout are working. We will connect this section to Supabase next."
        />
      </div>
    </>
  );
}
