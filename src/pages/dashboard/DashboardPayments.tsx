import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Download, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/premium/EmptyState";
import { fadeUp, stagger } from "@/lib/motion";
import { format, formatDistanceToNow, isPast, differenceInDays } from "date-fns";
import jsPDF from "jspdf";

const DashboardPayments = () => {
  const { user, profile } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("payments").select("*, enrollments(class_id, recording_id, classes(title), recordings(title))").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("enrollments").select("*, classes(title, class_type), recordings(title)").eq("user_id", user.id).order("enrolled_at", { ascending: false }),
    ]).then(([payRes, enrRes]) => {
      setPayments(payRes.data || []);
      setEnrollments(enrRes.data || []);
    });
  }, [user]);

  const getExpiryInfo = (e: any) => {
    if (!e.expires_at) return { label: "No expiry", color: "text-muted-foreground", icon: CheckCircle2 };
    const expDate = new Date(e.expires_at);
    if (isPast(expDate)) return { label: "Expired", color: "text-destructive", icon: XCircle };
    const days = differenceInDays(expDate, new Date());
    if (days <= 7) return { label: `Expires in ${formatDistanceToNow(expDate)}`, color: "text-amber-500", icon: AlertTriangle };
    return { label: `Expires in ${formatDistanceToNow(expDate)}`, color: "text-muted-foreground", icon: Clock };
  };

  const generateInvoice = (p: any) => {
    const itemName = p.enrollments?.classes?.title || p.enrollments?.recordings?.title || "Service";
    const invoiceNumber = `INV-${p.id.slice(0, 8).toUpperCase()}`;
    const invoiceDate = format(new Date(p.created_at), "PPP");
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    let yPos = 20;

    // Brand color (primary blue from your theme)
    const primaryColor: [number, number, number] = [41, 68, 114]; // hsl(225, 70%, 28%) converted to RGB
    const accentColor: [number, number, number] = [242, 183, 71]; // hsl(42, 92%, 56%) converted to RGB
    
    // Header with gradient effect (simulated)
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 45, 'F');
    
    // Company name
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('WebTuto Academy', margin, yPos);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('edu.webtuto.lk', margin, yPos + 8);
    
    // Invoice title on right
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INVOICE', pageWidth - margin, yPos, { align: 'right' });
    
    yPos = 60;
    
    // Invoice details box
    pdf.setTextColor(0, 0, 0);
    pdf.setFillColor(245, 247, 250);
    pdf.roundedRect(pageWidth - 70, yPos, 50, 20, 2, 2, 'F');
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text('Invoice #', pageWidth - 68, yPos + 6);
    pdf.text('Date', pageWidth - 68, yPos + 14);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(invoiceNumber, pageWidth - margin, yPos + 6, { align: 'right' });
    pdf.text(invoiceDate, pageWidth - margin, yPos + 14, { align: 'right' });
    
    // Bill To section
    yPos += 35;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text('BILL TO', margin, yPos);
    
    yPos += 8;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(profile?.full_name || "Student", margin, yPos);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    if (profile?.email) {
      yPos += 6;
      pdf.text(profile.email, margin, yPos);
    }
    if (profile?.admission_number) {
      yPos += 6;
      pdf.text(`Admission #: ${profile.admission_number}`, margin, yPos);
    }
    
    // Items table
    yPos += 20;
    const tableTop = yPos;
    
    // Table header
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Description', margin + 5, yPos + 7);
    pdf.text('Amount', pageWidth - margin - 5, yPos + 7, { align: 'right' });
    
    yPos += 10;
    
    // Table row
    pdf.setFillColor(250, 250, 250);
    pdf.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.text(itemName, margin + 5, yPos + 8);
    pdf.text(`${p.currency} ${p.amount.toFixed(2)}`, pageWidth - margin - 5, yPos + 8, { align: 'right' });
    
    yPos += 12;
    
    // Divider line
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    
    // Total section
    yPos += 8;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text('TOTAL', pageWidth - 70, yPos);
    pdf.setFontSize(14);
    pdf.text(`${p.currency} ${p.amount.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
    
    // Payment details
    yPos += 20;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text('Payment Details', margin, yPos);
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    pdf.text(`Payment Method: ${p.payment_method || 'Bank Transfer'}`, margin, yPos);
    yPos += 6;
    pdf.text(`Status: ${p.payment_status.charAt(0).toUpperCase() + p.payment_status.slice(1)}`, margin, yPos);
    yPos += 6;
    pdf.text(`Transaction Reference: ${p.transaction_ref || '—'}`, margin, yPos);
    
    // Footer with accent color
    const footerY = pdf.internal.pageSize.height - 25;
    pdf.setFillColor(...accentColor);
    pdf.rect(0, footerY - 5, pageWidth, 3, 'F');
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Thank you for your payment!', pageWidth / 2, footerY + 5, { align: 'center' });
    pdf.text('For support, contact us at support@webtutoacademy.com', pageWidth / 2, footerY + 11, { align: 'center' });
    
    // Save the PDF
    pdf.save(`invoice-${invoiceNumber}.pdf`);
  };

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-gradient">Payments & Subscriptions</h1>

      {/* Active Enrollments with Expiry */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">My Enrollments</h2>
        {enrollments.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No enrollments yet" />
        ) : (
          <motion.div initial="hidden" animate="show" variants={stagger} className="grid sm:grid-cols-2 gap-3">
            {enrollments.map(e => {
              const expiry = getExpiryInfo(e);
              const Icon = expiry.icon;
              const itemName = e.classes?.title || e.recordings?.title || "Unknown";
              const isActive = e.status === "active" && (!e.expires_at || !isPast(new Date(e.expires_at)));
              return (
                <motion.div
                  key={e.id}
                  variants={fadeUp}
                  className={`glass-strong rounded-2xl p-4 space-y-2 transition-all hover:ring-glow ${!isActive ? "opacity-60" : ""}`}
                >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{itemName}</p>
                        <p className="text-xs text-muted-foreground">{e.class_id ? e.classes?.class_type || "Class" : "Recording"}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider shrink-0 ring-1 ${
                        isActive ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" : "bg-destructive/15 text-destructive ring-destructive/30"
                      }`}>{isActive ? "Active" : "Expired"}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs ${expiry.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{expiry.label}</span>
                      {e.expires_at && !isPast(new Date(e.expires_at)) && (
                        <span className="text-muted-foreground ml-auto">{format(new Date(e.expires_at), "PP")}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Enrolled: {format(new Date(e.enrolled_at), "PP")}</p>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Payment History */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Payment History</h2>
        {payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payment history yet" />
        ) : (
          <div className="glass-strong rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-card/40">
                      <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Item</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Method</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Reference</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => {
                      const itemName = p.enrollments?.classes?.title || p.enrollments?.recordings?.title || "—";
                      return (
                        <tr key={p.id} className="border-b border-border/40 last:border-0 hover:bg-card/40 transition-colors">
                          <td className="p-4 text-foreground">{format(new Date(p.created_at), "PP")}</td>
                          <td className="p-4 text-foreground text-xs max-w-[150px] truncate">{itemName}</td>
                          <td className="p-4 font-medium text-foreground">{p.currency} {p.amount}</td>
                          <td className="p-4 text-muted-foreground">{p.payment_method || "—"}</td>
                          <td className="p-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ring-1 ${
                              p.payment_status === "completed" ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" :
                              p.payment_status === "failed" ? "bg-destructive/15 text-destructive ring-destructive/30" :
                              "bg-muted text-muted-foreground ring-border/60"
                            }`}>{p.payment_status}</span>
                          </td>
                          <td className="p-4 text-muted-foreground text-xs">{p.transaction_ref || "—"}</td>
                          <td className="p-4">
                            {p.payment_status === "completed" && (
                              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => generateInvoice(p)}>
                                <Download className="w-3 h-3" /> Invoice
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPayments;
