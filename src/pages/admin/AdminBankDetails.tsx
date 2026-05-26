import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Building2, CheckCircle, XCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const AdminBankDetails = () => {
  const [bankDetails, setBankDetails] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    bank_name: "",
    account_name: "",
    account_number: "",
    branch: "",
    is_active: true,
  });
  const { toast } = useToast();

  const fetchBankDetails = async () => {
    const { data } = await supabase
      .from("bank_details")
      .select("*")
      .order("created_at", { ascending: false });
    setBankDetails(data || []);
  };

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const handleSave = async () => {
    if (!form.bank_name || !form.account_name || !form.account_number) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const payload = {
      bank_name: form.bank_name,
      account_name: form.account_name,
      account_number: form.account_number,
      branch: form.branch || null,
      is_active: form.is_active,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("bank_details").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("bank_details").insert(payload));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editing ? "Bank details updated!" : "Bank details added!" });
      setOpen(false);
      setEditing(null);
      setForm({
        bank_name: "",
        account_name: "",
        account_number: "",
        branch: "",
        is_active: true,
      });
      fetchBankDetails();
    }
  };

  const handleEdit = (bd: any) => {
    setEditing(bd);
    setForm({
      bank_name: bd.bank_name,
      account_name: bd.account_name,
      account_number: bd.account_number,
      branch: bd.branch || "",
      is_active: bd.is_active,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("bank_details").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bank details deleted" });
      fetchBankDetails();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("bank_details")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: !currentStatus ? "Account activated" : "Account deactivated" });
      fetchBankDetails();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gradient">Bank Details</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage bank accounts for student payments
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEditing(null);
            setForm({
              bank_name: "",
              account_name: "",
              account_number: "",
              branch: "",
              is_active: true,
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus className="w-4 h-4" /> Add Bank Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Add"} Bank Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Bank Name *</Label>
                <Input
                  placeholder="e.g. Commercial Bank"
                  value={form.bank_name}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Name *</Label>
                <Input
                  placeholder="e.g. Webtuto Academy (Pvt) Ltd"
                  value={form.account_name}
                  onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Number *</Label>
                <Input
                  placeholder="e.g. 1234567890"
                  value={form.account_number}
                  onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Branch (Optional)</Label>
                <Input
                  placeholder="e.g. Colombo Main"
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                {editing ? "Update" : "Add"} Bank Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {bankDetails.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No bank accounts configured yet. Add your first bank account to accept payments.
            </p>
            <Button onClick={() => setOpen(true)}>Add Bank Account</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bankDetails.map((bd) => (
            <Card key={bd.id} className={!bd.is_active ? "opacity-60" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{bd.bank_name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {bd.is_active ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Account Name:</span>
                    <p className="font-medium text-foreground">{bd.account_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Account Number:</span>
                    <p className="font-mono font-medium text-foreground">{bd.account_number}</p>
                  </div>
                  {bd.branch && (
                    <div>
                      <span className="text-muted-foreground">Branch:</span>
                      <p className="text-foreground">{bd.branch}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => toggleActive(bd.id, bd.is_active)}
                  >
                    {bd.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(bd)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(bd.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBankDetails;
