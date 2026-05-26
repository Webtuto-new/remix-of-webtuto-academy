import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthShell from "@/components/premium/AuthShell";
import SEOHead from "@/components/SEOHead";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <>
      <SEOHead title="Reset Password" description="Reset your Webtuto account password." path="/forgot-password" />
      <AuthShell
        title="Reset your password"
        subtitle="We'll email you a secure reset link"
        footer={<><Link to="/login" className="text-primary hover:underline font-semibold">Back to login</Link></>}
      >
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20 text-xl">✓</div>
              <p className="text-muted-foreground">Check your email for the reset link.</p>
              <Link to="/login"><Button variant="outline" className="rounded-xl">Back to Login</Button></Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-xl bg-background/40" />
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-primary/20" size="lg" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
      </AuthShell>
    </>
  );
};

export default ForgotPasswordPage;
