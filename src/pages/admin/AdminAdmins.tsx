import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Trash2, Search } from "lucide-react";

const AdminAdmins = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const { toast } = useToast();

  const fetchAdmins = async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("*")
      .eq("role", "admin");
    if (!roles?.length) { setAdmins([]); return; }
    const userIds = roles.map(r => r.user_id);
    const { data: profs } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);
    setAdmins((profs || []).map(p => ({ ...p, role_id: roles.find(r => r.user_id === p.id)?.id })));
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, email, admission_number").order("full_name");
    setProfiles(data || []);
  };

  useEffect(() => { fetchAdmins(); fetchProfiles(); }, []);

  const filteredProfiles = profiles.filter(p => {
    if (!search) return false;
    const q = search.toLowerCase();
    const isAlreadyAdmin = admins.some(a => a.id === p.id);
    if (isAlreadyAdmin) return false;
    return (p.full_name || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q);
  });

  const handleAdd = async () => {
    if (!selectedUserId) {
      toast({ title: "Select a user first", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("user_roles").insert({ user_id: selectedUserId, role: "admin" });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Admin added!" });
      setAddOpen(false);
      setSearch("");
      setSelectedUserId("");
      fetchAdmins();
    }
  };

  const handleRemove = async (roleId: string, name: string) => {
    if (admins.length <= 1) {
      toast({ title: "Cannot remove the last admin", variant: "destructive" });
      return;
    }
    if (!confirm(`Remove admin access for ${name}?`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Admin removed" });
      fetchAdmins();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gradient">Admin Management</h1>
        <Button onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="w-4 h-4" /> Add Admin
        </Button>
      </div>

      <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) { setSearch(""); setSelectedUserId(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Admin</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search user by name or email</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Type to search..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelectedUserId(""); }}
                />
              </div>
            </div>
            {filteredProfiles.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                {filteredProfiles.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedUserId(p.id); setSearch(p.full_name || p.email); }}
                    className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                      selectedUserId === p.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    }`}
                    type="button"
                  >
                    <p className="font-medium text-foreground">{p.full_name || "No name"}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </button>
                ))}
              </div>
            )}
            {search && filteredProfiles.length === 0 && !selectedUserId && (
              <p className="text-sm text-muted-foreground text-center py-2">No matching users found</p>
            )}
            <Button onClick={handleAdd} disabled={!selectedUserId} className="w-full gap-1">
              <Shield className="w-4 h-4" /> Make Admin
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {admins.map(a => (
              <div key={a.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.full_name || "No name"}</p>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(a.role_id, a.full_name)}
                  className="text-destructive text-xs gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </Button>
              </div>
            ))}
            {admins.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No admins found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAdmins;
