import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, HeartOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/premium/EmptyState";
import { fadeUp, stagger } from "@/lib/motion";

const DashboardWishlist = () => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchWishlist = () => {
    if (!user) return;
    supabase.from("wishlists").select("*, classes(*)").eq("user_id", user.id)
      .then(({ data }) => setWishlist(data || []));
  };
  useEffect(() => { fetchWishlist(); }, [user]);

  const removeFromWishlist = async (id: string) => {
    await supabase.from("wishlists").delete().eq("id", id);
    toast({ title: "Removed from wishlist" });
    fetchWishlist();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-gradient">My Wishlist</h1>
      {wishlist.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save classes you love to revisit them later."
          action={<Link to="/classes"><Button variant="premium" size="sm">Browse Classes</Button></Link>}
        />
      ) : (
        <motion.div initial="hidden" animate="show" variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlist.map(w => (
            <motion.div
              key={w.id}
              variants={fadeUp}
              className="glass-strong rounded-2xl p-5 transition-all hover:ring-glow hover:-translate-y-1"
            >
              <h3 className="font-display font-semibold text-foreground mb-1">{w.classes?.title || "Class"}</h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{w.classes?.short_description || ""}</p>
              <p className="text-base font-bold text-gradient mb-4">LKR {w.classes?.price || 0}</p>
              <div className="flex gap-2">
                <Link to={`/class/${w.class_id}`}><Button variant="premium" size="sm">View</Button></Link>
                <Button variant="ghost" size="sm" onClick={() => removeFromWishlist(w.id)}>
                  <HeartOff className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default DashboardWishlist;
