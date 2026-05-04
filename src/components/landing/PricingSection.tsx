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

const plans = [
  {
    name: "Starter",
    desc: "Para começar",
    price: "Sob consulta",
    features: ["Até 500 membros", "Feed completo", "Mensagens", "Agenda básica", "Suporte por email"]
  },
  {
    name: "Pro",
    popular: true,
    desc: "Para marcas que querem escalar",
    price: "Sob consulta",
    features: ["Membros ilimitados", "Loja integrada", "Dados avançados", "Domínio próprio", "Priority support", "White-label completo"]
  },
  {
    name: "Enterprise",
    desc: "Para grandes operações",
    price: "Sob consulta",
    features: ["Tudo do Pro", "Múltiplas comunidades", "API access", "Dedicated manager", "SLA garantido", "Custom integrations"]
  }
];

export default function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#630091]/3 via-transparent to-[#d81e62]/3" />
      
      <div className="relative mx-auto max-w-5xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Planos
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-balance">
            Preços justos. Sem surpresa.
          </h2>
          <p className="text-muted-foreground mt-4">
            Escolha o plano que faz sentido pro seu momento. Todos com infraestrutura profissional.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className={`relative p-6 rounded-2xl border transition-all ${
                plan.popular 
                  ? "bg-background border-transparent shadow-xl"
                  : "bg-muted/30 border-border hover:border-[#630091]/30"
              }`}
              style={plan.popular ? { background: "linear-gradient(135deg, rgba(99, 0, 145, 0.03) 0%, rgba(216, 30, 98, 0.03) 100%)" } : {}}
            >
              {plan.popular && (
                <div 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#630091] to-[#d81e62] text-white text-xs px-4 py-1 rounded-full font-medium"
                >
                  Mais popular
                </div>
              )}
              <h3 className="font-display text-xl mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
              <p className="font-display text-2xl mb-4">{plan.price}</p>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-[#d81e62]" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}