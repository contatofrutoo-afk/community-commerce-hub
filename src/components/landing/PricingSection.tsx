import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, X } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const plans = [
  {
    name: "Starter",
    desc: "Para começar",
    price: "Sob consulta",
    color: "from-gray-500 to-gray-600",
    features: ["500 membros", "Feed", "Mensagens", "Agenda básica", "Suporte email"]
  },
  {
    name: "Pro",
    desc: "Mais popular",
    price: "Sob consulta",
    popular: true,
    color: "from-[#630091] to-[#d81e62]",
    features: ["Membros ilimitados", "Loja", "CRM", "Domínio", "Priority", "White-label"]
  },
  {
    name: "Enterprise",
    desc: "Para escalar",
    price: "Sob consulta",
    color: "from-[#1a1a1a] to-[#4a4a4a]",
    features: ["Multi comunidades", "API", "Manager dedicado", "SLA", "Custom"]
  }
];

export default function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-white" />
      
      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#d81e62] font-semibold mb-4">
            Planos
          </div>
          <h2 className="font-display text-4xl sm:text-5xl text-balance text-[#1a1a1a]">
            Simples. Justo.
          </h2>
          <p className="text-muted-foreground mt-4">Escolha o plano ideal pro seu momento.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className={`relative p-8 rounded-3xl border-2 transition-all duration-300 ${
                plan.popular 
                  ? "border-transparent shadow-2xl scale-105" 
                  : "border-[#630091]/10 shadow-lg hover:shadow-xl"
              }`}
              style={plan.popular ? { background: "linear-gradient(135deg, rgba(99, 0, 145, 0.03) 0%, rgba(216, 30, 98, 0.03) 100%)" } : {}}
            >
              {plan.popular && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r ${plan.color} text-white text-xs font-semibold px-4 py-1.5 rounded-full`}>
                  Mais popular
                </div>
              )}
              <h3 className="font-display text-2xl font-semibold mb-1 text-[#1a1a1a]">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
              <div className="font-display text-3xl font-bold mb-6 text-[#1a1a1a]">{plan.price}</div>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#630091]/20 to-[#d81e62]/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-[#630091]" />
                    </div>
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