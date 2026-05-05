import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  }
};

export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#630091] via-[#8b2091] to-[#d81e62]" />
      
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
      
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={fadeInUp}
        className="relative mx-auto max-w-3xl px-6 text-center"
      >
        <h2 className="font-display text-4xl sm:text-5xl text-balance mb-6 text-white">
          Sua audiência já existe.
          <br />
          <span className="text-white/90">Hora de transformar em renda.</span>
        </h2>
        
        <p className="text-lg text-white/80 mb-10 leading-relaxed">
          Você já fez o trabalho difícil de construir seguidores. 
          Agora tenha um lugar próprio para продолжение dessa relação.
        </p>
        
        <motion.div>
          <Link to="/auth">
            <motion.button 
              className="inline-flex items-center gap-3 bg-white text-[#630091] hover:bg-white/90 shadow-2xl px-10 py-5 rounded-full font-semibold text-lg transition-all"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.98 }}
            >
              Começar agora
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}