import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const benefits = [
  "Ambiente 100% da sua marca",
  "Seu próprio feed e conteúdo",
  "Mensagens diretas com seguidores",
  "Agenda e agendamentos",
  "Vendas direto na plataforma",
  "Dados reais da sua audiência"
];

export default function SolutionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="mb-12"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            A solução
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-balance max-w-2xl mb-4">
            Um lugar só seu. Onde a conexão vira conversão.
          </h2>
          <p className="text-muted-foreground max-w-xl">
            Esqueça os algoritmos. Com weaze, você construye um espaço onde sua audiência encontra, interage e compra — direto no seu ambiente.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
              className="flex items-center gap-3 p-4 rounded-lg bg-muted/30"
            >
              <div className="h-6 w-6 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3 text-brand" />
              </div>
              <span className="text-sm">{benefit}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}