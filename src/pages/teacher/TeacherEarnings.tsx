import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Wallet } from "lucide-react";
import EmptyState from "@/components/premium/EmptyState";
import { fadeUp, stagger } from "@/lib/motion";

const TeacherEarnings = () => {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user) return;
    loadPayouts();
  }, [user]);

  const loadPayouts = async () => {
    const { data: t } = await supabase.from("teachers").select("id").eq("user_id", user!.id).single();
    if (!t) return;
    const { data } = await supabase.from("teacher_payouts").select("*").eq("teacher_id", t.id).order("created_at", { ascending: false });
    setPayouts(data || []);
    setTotal((data || []).reduce((s, p) => s + Number(p.amount), 0));
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-gradient">My Earnings</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <Card className="glass-strong border-border/50 hover:ring-glow transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center ring-1 ring-emerald-500/20">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">LKR {total.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
          <Card className="glass-strong border-border/50 hover:ring-glow transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{payouts.length}</p>
                <p className="text-sm text-muted-foreground">Payouts Received</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {payouts.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No payouts yet"
          description="Your earnings and payouts will appear here once processed."
        />
      ) : (
        <Card className="glass-strong border-border/50 overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="text-lg font-display">Payout History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 font-medium text-muted-foreground">Period</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Notes</th>
                  </tr>
                </thead>
                <motion.tbody variants={stagger} initial="hidden" animate="show">
                  {payouts.map((p) => (
                    <motion.tr key={p.id} variants={fadeUp} className="border-b border-border last:border-0 hover:bg-primary/5 transition-colors group">
                      <td className="p-4 text-foreground">{p.period_start} → {p.period_end}</td>
                      <td className="p-4 font-medium text-foreground">{p.currency} {Number(p.amount).toLocaleString()}</td>
                      <td className="p-4">
                        <Badge variant={p.status === "paid" ? "default" : "secondary"} className={p.status === "paid" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : ""}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{p.notes || "—"}</td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherEarnings;
