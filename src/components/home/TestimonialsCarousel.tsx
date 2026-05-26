import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Testimonial = {
  id: string;
  student_name: string;
  student_role: string | null;
  avatar_url: string | null;
  quote: string;
  rating: number;
};

const TestimonialsCarousel = () => {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    supabase
      .from("testimonials")
      .select("id,student_name,student_role,avatar_url,quote,rating")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as Testimonial[]) || []));
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) return null;
  const t = items[idx];

  return (
    <section className="relative py-14 sm:py-20">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-1/4 w-[420px] h-[420px] rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] rounded-full bg-accent/10 blur-[140px]" />
      </div>
      <div className="relative container mx-auto px-4 sm:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.25em] text-accent uppercase mb-3">
            <span className="inline-block w-8 h-px bg-accent" />
            What students say
            <span className="inline-block w-8 h-px bg-accent" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
            Loved by learners across Sri Lanka
          </h2>
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-md ring-1 ring-foreground/10 shadow-2xl overflow-hidden">
            <Quote className="absolute top-6 right-6 w-16 h-16 text-primary/10" />
            <AnimatePresence mode="wait">
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < t.rating ? "fill-accent text-accent" : "text-foreground/20"}`}
                    />
                  ))}
                </div>
                <p className="font-display text-lg sm:text-xl md:text-2xl text-foreground leading-relaxed font-medium">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/40 bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
                    {t.avatar_url ? (
                      <img src={t.avatar_url} alt={t.student_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display font-bold text-lg text-foreground/80">
                        {t.student_name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-display font-bold text-foreground truncate">{t.student_name}</div>
                    {t.student_role && (
                      <div className="text-xs text-muted-foreground truncate">{t.student_role}</div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {items.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setIdx((i) => (i - 1 + items.length) % items.length)}
                className="w-10 h-10 rounded-full bg-card/60 backdrop-blur ring-1 ring-foreground/10 hover:ring-primary/40 hover:bg-card transition flex items-center justify-center"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-1.5">
                {items.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === idx ? "w-8 bg-primary" : "w-1.5 bg-foreground/20"
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setIdx((i) => (i + 1) % items.length)}
                className="w-10 h-10 rounded-full bg-card/60 backdrop-blur ring-1 ring-foreground/10 hover:ring-primary/40 hover:bg-card transition flex items-center justify-center"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;