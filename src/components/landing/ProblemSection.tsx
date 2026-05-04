import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const problems = [
  {
    title: "Você não controla quem vê seu conteúdo",
    desc: "O algoritmo decide. Seu alcance muda a cada alteração da plataforma."
  },
  {
    title: "Não consegue manter contato",
    desc: "Após o post, não há como falar direto com quem te seguiu."
  },
  {
    title: "Seguidores não viram clientes",
    desc: "Tem atenção, mas dificuldade em converter em vendas."
  },
  {
    title: "Sua marca se perde no meio de outras",
    desc: "Competindo por atenção num feed lotado de concorrentes."
  }
];

export default function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section className="py-24 bg-muted/30">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="mb-12"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            O problema
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-balance max-w-2xl">
            As redes sociais trabalham contra você.
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className="p-6 rounded-xl bg-background border border-border"
            >
              <h3 className="font-medium text-lg mb-2">{problem.title}</h3>
              <p className="text-sm text-muted-foreground">{problem.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}