import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

const problems = [
  {
    title: "Dependência total de algoritmos",
    desc: "Seu alcance diminui a cada mudança de feed. Você não controla quem vê seu conteúdo."
  },
  {
    title: "Sem controle da experiência",
    desc: "Plataformas decides onde seu conteúdo aparece. Sua marca compete por atenção."
  },
  {
    title: "Conversão fraca",
    desc: "Seguidores não se tornam compradores. Olink está disponível, mas falta conexão."
  },
  {
    title: "Sem relacionamento contínuo",
    desc: "Após o post, não há como manter contato. O alcance é pontual, não permanente."
  }
];

export default function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-secondary/20 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
        >
          <motion.p className="text-brand text-xs uppercase tracking-[0.2em] mb-4">
            O problema
          </motion.p>
          <motion.h2 className="font-display text-4xl sm:text-5xl text-balance max-w-3xl mb-16">
            As redes sociais não trabalham para sua marca. Você trabalha para elas.
          </motion.h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
              className="p-8 rounded-2xl bg-card border border-border hover:border-brand/30 transition-colors"
            >
              <h3 className="font-display text-xl mb-3 text-foreground">{problem.title}</h3>
              <p className="text-muted-foreground">{problem.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}