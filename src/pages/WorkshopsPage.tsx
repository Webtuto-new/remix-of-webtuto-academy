import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import ClassCard from "@/components/ClassCard";
import { supabase } from "@/integrations/supabase/client";
import { Hammer } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import SectionHeader from "@/components/premium/SectionHeader";
import EmptyState from "@/components/premium/EmptyState";
import { SkeletonCard } from "@/components/ui/skeleton";

const WorkshopsPage = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("classes").select("*, teachers(name), curriculums(name), grades(name), subjects(name)")
      .eq("is_active", true).eq("class_type", "workshop").order("created_at", { ascending: false })
      .then(({ data }) => { setClasses(data || []); setLoading(false); });
  }, []);

  return (
    <Layout>
      <SEOHead title="Workshops" description="Intensive hands-on learning workshops on Webtuto." path="/workshops" />
      <div className="relative bg-mesh pt-24 pb-20">
        <div className="container mx-auto px-4">
          <SectionHeader eyebrow="Hands-on" title="Workshops" description="Intensive practice-led learning experiences. Build real skills with guided projects and live feedback." />
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : classes.length > 0 ? (
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewportOnce} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
              {classes.map((c) => (
                <motion.div key={c.id} variants={fadeUp}>
                  <ClassCard id={c.id} title={c.title} curriculum={c.curriculums?.name || "—"} grade={c.grades?.name || "—"} subject={c.subjects?.name || "—"} teacherName={c.teachers?.name || "Tutor"} classType={c.class_type} price={Number(c.price)} originalPrice={c.original_price ? Number(c.original_price) : undefined} duration={c.duration_minutes ? `${c.duration_minutes} min` : undefined} isLive={c.is_live} description={c.short_description || c.description} thumbnail={c.thumbnail_url} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyState icon={Hammer} title="No workshops available yet" description="Check back soon — new hands-on workshops drop regularly." />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default WorkshopsPage;
