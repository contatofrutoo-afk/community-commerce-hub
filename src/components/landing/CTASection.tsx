import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-24 bg-muted/30">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
        >
          <h2 className="font-display text-3xl sm:text-4xl text-balance mb-4">
            Sua audiência já existe.
            <br />
            <span className="text-brand">Hora de transformar em renda.</span>
          </h2>
          
          <motion.div 
            variants={fadeInUp}
            className="mt-8"
          >
            <Link to="/auth">
              <motion.button 
                className="inline-flex items-center gap-2 bg-brand text-primary-foreground hover:opacity-90 shadow-brand px-8 py-4 rounded-full font-medium transition-all"
                whileHover={{ scale: 1.02, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
                whileTap={{ scale: 0.98 }}
              >
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}