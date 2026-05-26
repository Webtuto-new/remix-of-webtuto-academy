import { Sparkles, Wrench } from "lucide-react";
import AdminPageHeader from "@/components/premium/AdminPageHeader";
import EmptyState from "@/components/premium/EmptyState";

const AdminPlaceholder = ({ title }: { title: string }) => (
  <div className="space-y-6">
    <AdminPageHeader
      icon={Sparkles}
      eyebrow="In progress"
      title={title}
      description="This control surface is being crafted — check back shortly."
      accent="primary"
    />
    <EmptyState
      icon={Wrench}
      title="Admin feature coming soon"
      description="We're polishing this module. It will appear here once ready."
    />
  </div>
);

export default AdminPlaceholder;
