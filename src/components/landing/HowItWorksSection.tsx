import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    step: "01",
    title: "Crie seu espaço",
    desc: "Personalize com sua marca, cores e identidade. Um ambiente 100% seu."
  },
  {
    step: "02",
    title: "Convide sua audiência",
    desc: "Convide seguidores, clientes e interessados. Tudo começa aqui."
  },
  {
    step: "03",
    title: "Engaje e converta",
    desc: "Publique, interaja e faça vendas diretas. Relacionamento que vira receita."
  }
];

export default function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-secondary/20 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <p className="text-brand text-xs uppercase tracking-[0.2em] mb-4">
            Como funciona
          </p>
          <h2 className="font-display text-4xl sm:text-5xl text-balance">
            Em três passos, sua comunidade no ar.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
              className="relative p-8 rounded-2xl bg-card border border-border"
            >
              <div className="text-brand/30 font-display text-6xl absolute top-4 right-6">
                {s.step}
              </div>
              <h3 className="font-display text-2xl mb-3 mt-8">{s.title}</h3>
              <p className="text-muted-foreground">{s.desc}</p>
              
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <svg className="w-8 h-8 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}