import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/premium/EmptyState";

const DashboardPlaceholder = ({ title }: { title: string }) => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl md:text-3xl font-bold text-gradient">{title}</h1>
    <EmptyState
      icon={Sparkles}
      title="Coming soon"
      description="We're polishing this experience. Check back shortly."
    />
  </div>
);

export default DashboardPlaceholder;
