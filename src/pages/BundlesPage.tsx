import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import SectionHeader from "@/components/premium/SectionHeader";
import EmptyState from "@/components/premium/EmptyState";
import { SkeletonCard } from "@/components/ui/skeleton";

const BundlesPage = () => {
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("bundles").select("*").eq("is_active", true).order("created_at", { ascending: false })
      .then(({ data }) => { setBundles(data || []); setLoading(false); });
  }, []);

  return (
    <Layout>
      <SEOHead title="Class Bundles" description="Save more with curated class bundles on Webtuto." path="/bundles" />
      <div className="relative bg-mesh pt-24 pb-20">
        <div className="container mx-auto px-4">
          <SectionHeader eyebrow="Bundles" title="Save more with curated bundles" description="Multi-class collections built by our team. Lower price, complete coverage." />
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : bundles.length > 0 ? (
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewportOnce} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
              {bundles.map((b) => {
                const discount = b.original_price ? Math.round(((b.original_price - b.price) / b.original_price) * 100) : 0;
                return (
                  <motion.div key={b.id} variants={fadeUp} className="group relative glass-strong rounded-2xl p-6 transition-all hover:-translate-y-1 hover:ring-glow gradient-border">
                    {discount > 0 && <span className="absolute top-4 right-4 badge-discount">−{discount}%</span>}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 ring-1 ring-primary/15">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">{b.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{b.description}</p>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="font-bold text-xl text-gradient">LKR {Number(b.price).toLocaleString()}</span>
                      {b.original_price && <span className="text-muted-foreground line-through text-sm">LKR {Number(b.original_price).toLocaleString()}</span>}
                    </div>
                    <Link to={`/bundle/${b.id}`}><Button size="sm" variant="premium" className="w-full">View Bundle</Button></Link>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <EmptyState icon={Package} title="No bundles available yet" description="Check back soon — new curated bundles drop regularly." />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BundlesPage;
