import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    step: "01",
    title: "Crie seu espaço",
    desc: "Escolha cores, nome e personalize com sua marca."
  },
  {
    step: "02",
    title: "Convide sua gente",
    desc: "Compartilhe o link e invites quem já te segue."
  },
  {
    step: "03",
    title: "Comece a vender",
    desc: "Publique, engaje e faça vendas diretas."
  }
];

export default function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section className="py-24 bg-muted/30">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-12"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Como funciona
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-balance">
            Pronto em minutos.
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className="relative p-6 rounded-xl bg-background border border-border"
            >
              <div className="text-muted-foreground/30 font-display text-5xl absolute top-4 right-6">
                {s.step}
              </div>
              <h3 className="font-display text-xl mb-2 mt-6">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}