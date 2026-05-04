import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle2 } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

const benefits = [
  "Ambiente próprio com sua marca",
  "Relacionamento contínuo com audiência",
  "Controle total da experiência",
  "Feed, mensagens e agenda integrados",
  "CRM completo para conversão",
  "Dados e métricas em tempo real"
];

export default function SolutionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
        >
          <motion.p className="text-brand text-xs uppercase tracking-[0.2em] mb-4">
            A solução
          </motion.p>
          <motion.h2 className="font-display text-4xl sm:text-5xl text-balance max-w-3xl mb-6">
            Sua própria infraestrutura. Sua comunidade. Seu controle.
          </motion.h2>
          <motion.p className="text-xl text-muted-foreground max-w-2xl mb-16">
            Forget os algoritmos. With weaze, você construye um espaço onde sua audiência encontra, interage e compra — direto no seu ambiente.
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="order-2 lg:order-1"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="grid gap-4">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.1 * i + 0.3 }}
                  className="flex items-center gap-4"
                >
                  <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-brand" />
                  </div>
                  <span className="text-lg">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="order-1 lg:order-2 relative"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-br from-brand/10 to-brand/5 border border-border p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-display text-brand mb-4">weaze</div>
                <p className="text-muted-foreground">Sua infraestrutura</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}