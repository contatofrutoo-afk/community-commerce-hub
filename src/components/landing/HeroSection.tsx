import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function HeroSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col justify-center pt-16">
      <div className="absolute inset-0 bg-background" />
      
      <motion.div 
        className="relative mx-auto max-w-5xl px-6 py-20"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <motion.div variants={fadeInUp} className="max-w-3xl">
          <motion.p 
            variants={fadeInUp}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6"
          >
            <span className="h-px w-8 bg-muted-foreground/40" />
            Comunidade · Conteúdo · Conversão
          </motion.p>
          
          <motion.h1 
            variants={fadeInUp}
            className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.1] text-balance mb-6"
          >
            Construa uma comunidade <span className="text-brand">própria</span> que engaja e gera receita todos os dias.
          </motion.h1>
          
          <motion.p 
            variants={fadeInUp}
            className="text-lg text-muted-foreground text-pretty max-w-xl mb-8"
          >
            Um espaço seu, onde sua marca se conecta com as pessoas e transforma atenção em ação.
          </motion.p>
          
          <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
            <Link to="/auth">
              <motion.button 
                className="inline-flex items-center gap-2 bg-brand text-primary-foreground hover:opacity-90 shadow-brand px-6 py-3 rounded-full font-medium transition-all"
                whileHover={{ scale: 1.02, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
                whileTap={{ scale: 0.98 }}
              >
                Criar minha comunidade
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
            
            <Link to="/communities">
              <motion.button 
                className="inline-flex items-center gap-2 border border-input bg-background hover:bg-secondary px-6 py-3 rounded-full font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Ver demonstração
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="h-5 w-5 text-muted-foreground/50" />
      </motion.div>
    </section>
  );
}