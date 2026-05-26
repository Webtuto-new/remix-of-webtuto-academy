import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import SectionHeader from "@/components/premium/SectionHeader";

const ContactPage = () => {
  const whatsappLink = "https://wa.me/94728028444";

  return (
    <Layout>
      <SEOHead title="Contact Us | Webtuto.LK" description="Get in touch with the Webtuto team for support and inquiries." />
      <div className="relative bg-mesh">
        <div className="container mx-auto px-4 pt-24 pb-20">
          <SectionHeader eyebrow="Support" title="Let's talk" description="Have questions? We're here to help. Reach out via email or WhatsApp — we usually reply within a few hours." align="center" />
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewportOnce} className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto mt-12">
            <motion.a href="mailto:admin@webtuto.lk" variants={fadeUp} className="group glass-strong rounded-2xl p-8 text-center transition-all hover:-translate-y-1 hover:ring-glow">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground mb-2">Email us</h2>
              <p className="text-primary text-lg font-medium">admin@webtuto.lk</p>
              <p className="text-muted-foreground text-sm mt-2">Typical reply in under 24 hours</p>
            </motion.a>
            <motion.div variants={fadeUp} className="group glass-strong rounded-2xl p-8 text-center transition-all hover:-translate-y-1 hover:ring-glow">
              <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-7 h-7 text-accent" />
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground mb-2">WhatsApp</h2>
              <p className="text-foreground text-lg font-medium flex items-center justify-center gap-2"><Phone className="w-4 h-4" /> 0728 028 444</p>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-medium bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                <MessageCircle className="w-4 h-4" /> Chat now
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;
