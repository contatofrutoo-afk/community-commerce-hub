import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

const float = {
  animate: {
    y: [0, -10, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
  }
};

export default function HeroSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-brand/5 blur-3xl" />

      <motion.div 
        className="relative mx-auto max-w-6xl px-6 pt-20"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={stagger}
      >
        <motion.div variants={fadeInUp} className="max-w-4xl">
          <motion.p 
            variants={fadeInUp}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brand mb-6"
          >
            <span className="h-px w-8 bg-brand" />
            Comunidade · Conteúdo · Conversão
          </motion.p>
          
          <motion.h1 
            variants={fadeInUp}
            className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.1] text-balance mb-6"
          >
            Transforme sua audiência em uma{" "}
            <span className="text-brand">comunidade</span> que compra de você todos os dias.
          </motion.h1>
          
          <motion.p 
            variants={fadeInUp}
            className="text-xl text-muted-foreground text-pretty max-w-2xl mb-10"
          >
            Crie um espaço próprio, com feed, conversas e experiências que aproximam sua marca das pessoas e transformam atenção em receita.
          </motion.p>
          
          <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to="/auth">
                <motion.button 
                  className="inline-flex items-center gap-2 bg-brand text-primary-foreground hover:opacity-90 shadow-brand px-8 py-4 rounded-full font-medium transition-all"
                  whileHover={{ boxShadow: "0 0 30px rgba(var(--brand-rgb), 0.3)" }}
                >
                  Criar minha comunidade
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to="/communities">
                <motion.button 
                  className="inline-flex items-center gap-2 border border-border bg-background hover:bg-secondary px-8 py-4 rounded-full font-medium transition-all"
                  whileHover={{ borderColor: "var(--brand)" }}
                >
                  Ver como funciona
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div 
          variants={fadeInUp}
          className="mt-16 relative"
        >
          <motion.div
            animate={float}
            className="aspect-[9/16] max-w-xs mx-auto rounded-[2rem] bg-foreground/5 border border-border overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent" />
            
            <div className="absolute top-4 left-4 right-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-brand/30" />
              <div className="flex-1">
                <div className="h-3 w-24 bg-foreground/20 rounded-full" />
                <div className="h-2 w-16 bg-foreground/10 rounded-full mt-1" />
              </div>
            </div>
            
            <div className="absolute top-20 left-4 right-4 space-y-3">
              <div className="h-40 bg-foreground/5 rounded-2xl" />
              <div className="h-32 bg-foreground/5 rounded-2xl" />
            </div>
            
            <div className="absolute bottom-6 left-4 right-4">
              <div className="h-3 w-32 bg-brand rounded-full" />
              <div className="h-2 w-24 bg-foreground/10 rounded-full mt-2" />
            </div>
            
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-brand/20"
            />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="h-6 w-6 text-muted-foreground" />
      </motion.div>
    </section>
  );
}