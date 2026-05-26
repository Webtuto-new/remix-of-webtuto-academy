import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Testimonial = {
  id: string;
  student_name: string;
  student_role: string | null;
  avatar_url: string | null;
  quote: string;
  rating: number;
  sort_order: number;
  is_active: boolean;
};

const empty: Partial<Testimonial> = {
  student_name: "",
  student_role: "",
  avatar_url: "",
  quote: "",
  rating: 5,
  sort_order: 0,
  is_active: true,
};

const AdminTestimonials = () => {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Testimonial>>(empty);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Testimonial[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    setEditing(empty);
    setOpen(true);
  };
  const startEdit = (t: Testimonial) => {
    setEditing(t);
    setOpen(true);
  };

  const save = async () => {
    if (!editing.student_name || !editing.quote) {
      toast.error("Name and quote are required");
      return;
    }
    const payload = {
      student_name: editing.student_name,
      student_role: editing.student_role || null,
      avatar_url: editing.avatar_url || null,
      quote: editing.quote,
      rating: editing.rating || 5,
      sort_order: editing.sort_order || 0,
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("testimonials").update(payload).eq("id", editing.id)
      : await supabase.from("testimonials").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing.id ? "Updated" : "Created");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    load();
  };

  const toggleActive = async (t: Testimonial) => {
    const { error } = await supabase
      .from("testimonials")
      .update({ is_active: !t.is_active })
      .eq("id", t.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    load();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Testimonials</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Student quotes shown on the homepage. Lower sort order appears first.
          </p>
        </div>
        <Button onClick={startNew} className="gap-2">
          <Plus className="w-4 h-4" /> Add Testimonial
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No testimonials yet. Add your first one to build social proof on the homepage.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((t) => (
            <div
              key={t.id}
              className="relative rounded-2xl p-5 bg-card ring-1 ring-border/60 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
                    {t.avatar_url ? (
                      <img src={t.avatar_url} alt={t.student_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold">{t.student_name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{t.student_name}</div>
                    {t.student_role && (
                      <div className="text-xs text-muted-foreground truncate">{t.student_role}</div>
                    )}
                  </div>
                </div>
                <Switch checked={t.is_active} onCheckedChange={() => toggleActive(t)} />
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < t.rating ? "fill-accent text-accent" : "text-foreground/20"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-foreground/80 line-clamp-4">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t border-border/40">
                <span>Sort: {t.sort_order}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(t)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(t.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Edit" : "Add"} Testimonial</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Student Name *</Label>
              <Input
                value={editing.student_name || ""}
                onChange={(e) => setEditing({ ...editing, student_name: e.target.value })}
                placeholder="e.g. Sahan Perera"
              />
            </div>
            <div>
              <Label>Role / Grade</Label>
              <Input
                value={editing.student_role || ""}
                onChange={(e) => setEditing({ ...editing, student_role: e.target.value })}
                placeholder="e.g. Grade 11 — Cambridge"
              />
            </div>
            <div>
              <Label>Avatar URL</Label>
              <Input
                value={editing.avatar_url || ""}
                onChange={(e) => setEditing({ ...editing, avatar_url: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <div>
              <Label>Quote *</Label>
              <Textarea
                rows={4}
                value={editing.quote || ""}
                onChange={(e) => setEditing({ ...editing, quote: e.target.value })}
                placeholder="What the student said…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Rating (1-5)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={editing.rating || 5}
                  onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={editing.sort_order || 0}
                  onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Active (show on homepage)</Label>
              <Switch
                checked={editing.is_active ?? true}
                onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTestimonials;