import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32 bg-secondary/20 overflow-hidden">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.p 
            variants={{ opacity: 0, y: 20 }}
            className="text-brand text-xs uppercase tracking-[0.2em] mb-6"
          >
            Comece agora
          </motion.p>
          
          <motion.h2 
            variants={{ opacity: 0, y: 20 }}
            className="font-display text-4xl sm:text-5xl text-balance mb-6"
          >
            Sua audiência já existe. <br />
            <span className="text-brand">Agora é hora de transformar isso em relacionamento e receita.</span>
          </motion.h2>
          
          <motion.div 
            variants={{ opacity: 0, y: 20 }}
            className="flex flex-wrap justify-center gap-4 mt-10"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/auth">
                <motion.button 
                  className="inline-flex items-center gap-2 bg-brand text-primary-foreground hover:opacity-90 shadow-brand px-8 py-4 rounded-full font-medium text-lg transition-all"
                >
                  Criar minha comunidade
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}