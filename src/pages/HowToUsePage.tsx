import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { BookOpen, UserPlus, CreditCard, Video } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import SectionHeader from "@/components/premium/SectionHeader";

const steps = [
  { icon: UserPlus, title: "Create Account", desc: "Sign up with your email and get your unique admission number." },
  { icon: BookOpen, title: "Browse Classes", desc: "Explore classes by curriculum, grade, and subject." },
  { icon: CreditCard, title: "Purchase & Enroll", desc: "Choose your plan and make a secure payment." },
  { icon: Video, title: "Join & Learn", desc: "Attend live classes via Zoom and access recordings anytime." },
];

const HowToUsePage = () => (
  <Layout>
    <SEOHead title="How To Use Webtuto" description="Get started with Webtuto in a few simple steps." path="/how-to-use" />
    <div className="relative bg-mesh pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <SectionHeader eyebrow="Getting started" title="How Webtuto works" description="Four simple steps to start learning with the best tutors in Sri Lanka." align="center" />
        <motion.ol variants={stagger} initial="hidden" whileInView="show" viewport={viewportOnce} className="mt-12 space-y-5">
          {steps.map((step, i) => (
            <motion.li key={step.title} variants={fadeUp} className="relative flex gap-5 glass-strong rounded-2xl p-6 transition-all hover:-translate-y-0.5 hover:ring-glow">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-1 ring-primary/20">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-accent-foreground text-[11px] font-bold flex items-center justify-center shadow-md">{i + 1}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-foreground text-lg mb-1">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </div>
  </Layout>
);

export default HowToUsePage;
