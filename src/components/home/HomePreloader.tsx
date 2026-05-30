import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

const SESSION_KEY = "webtuto_preloader_shown";

const HomePreloader = () => {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem(SESSION_KEY);
  });

  useEffect(() => {
    if (!show) return;
    // Lock scroll & force top while preloader is visible
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);

    const t = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setShow(false);
    }, 1800);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [show]);

  useEffect(() => {
    if (!show) window.scrollTo(0, 0);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
          aria-hidden
        >
          {/* Soft animated rings */}
          <motion.div
            className="absolute h-72 w-72 rounded-full border border-blue-200/60"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 1.6], opacity: [0.8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute h-72 w-72 rounded-full border border-amber-300/60"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 1.9], opacity: [0.6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
          />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -12, y: 20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
            exit={{ scale: 1.15, opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <motion.img
              src={logo}
              alt="Webtuto"
              className="h-24 w-24 sm:h-28 sm:w-28 object-contain drop-shadow-[0_10px_30px_rgba(30,64,175,0.25)]"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
              className="h-[3px] w-40 max-w-[60vw] overflow-hidden rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400"
            />
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-xs tracking-[0.3em] font-medium text-slate-500 uppercase"
            >
              Webtuto
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HomePreloader;