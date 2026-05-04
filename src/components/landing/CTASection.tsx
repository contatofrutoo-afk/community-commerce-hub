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
    <section ref={ref} className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br via-[#630091]/5 to-[#d81e62]/5" />
      
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={fadeInUp}
        className="relative mx-auto max-w-2xl px-6 text-center"
      >
        <h2 className="font-display text-3xl sm:text-4xl text-balance mb-4">
          Sua audiência já existe.
          <br />
          <span className="bg-gradient-to-r from-[#630091] to-[#d81e62] bg-clip-text text-transparent">
            Hora de transformar em renda.
          </span>
        </h2>
        
        <p className="text-muted-foreground text-lg mb-8">
          Você já fez o trabalho difícil de construir seguidores. Agora tenha um lugar próprio para continuar essa relação.
        </p>
        
        <motion.div variants={fadeInUp}>
          <Link to="/auth">
            <motion.button 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#630091] to-[#d81e62] text-white hover:opacity-90 shadow-lg px-8 py-4 rounded-full font-medium transition-all"
              style={{ boxShadow: "0 4px 20px rgba(99, 0, 145, 0.3)" }}
              whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(99, 0, 145, 0.4)" }}
              whileTap={{ scale: 0.98 }}
            >
              Começar agora
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}