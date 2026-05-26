import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import ClassCard from "@/components/ClassCard";
import { supabase } from "@/integrations/supabase/client";
import { Mic } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import SectionHeader from "@/components/premium/SectionHeader";
import EmptyState from "@/components/premium/EmptyState";
import { SkeletonCard } from "@/components/ui/skeleton";

const SeminarsPage = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("classes").select("*, teachers(name), curriculums(name), grades(name), subjects(name)")
      .eq("is_active", true).eq("class_type", "seminar").order("created_at", { ascending: false })
      .then(({ data }) => { setClasses(data || []); setLoading(false); });
  }, []);

  return (
    <Layout>
      <SEOHead title="Seminars" description="One-time deep-dive sessions with expert tutors on Webtuto." path="/seminars" />
      <div className="relative bg-mesh pt-24 pb-20">
        <div className="container mx-auto px-4">
          <SectionHeader eyebrow="Live events" title="Seminars" description="One-time deep-dive sessions with expert tutors. Perfect for revision, special topics, and exam prep." />
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
            <EmptyState icon={Mic} title="No seminars available yet" description="Check back soon for upcoming live deep-dive sessions." />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SeminarsPage;
