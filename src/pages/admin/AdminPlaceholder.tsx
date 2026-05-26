import { Card, CardContent } from "@/components/ui/card";

const AdminPlaceholder = ({ title }: { title: string }) => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold text-gradient">{title}</h1>
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">
        <p>Admin feature coming soon.</p>
      </CardContent>
    </Card>
  </div>
);

export default AdminPlaceholder;
