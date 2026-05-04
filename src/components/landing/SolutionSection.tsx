import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Sparkles, Users, TrendingUp, MessageCircle, Calendar, ShoppingBag, BarChart3, Globe, Shield, Rocket } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const benefits = [
  { icon: Sparkles, title: "Feed proprietário", desc: "Seu conteúdo, suas regras. Sem algoritmo." },
  { icon: Globe, title: "Domínio próprio", desc: "seumarca.com — 100% white-label." },
  { icon: MessageCircle, title: "Mensagens", desc: "Chat integrado. Sem WhatsApp pessoal." },
  { icon: Calendar, title: "Agenda", desc: "Agendamentos nativos." },
  { icon: ShoppingBag, title: "Loja", desc: "Venda direta, sem link externo." },
  { icon: BarChart3, title: "Dados reais", desc: "CRM completo." },
  { icon: Users, title: "Membros", desc: "Lista completa." },
  { icon: Shield, title: "Segurança", desc: "Seus dados, suas regras." },
  { icon: Rocket, title: "Escala", desc: "Suporta milhares." }
];

const colors = ["from-[#630091] to-[#8b2091]", "from-[#8b2091] to-[#d81e62]", "from-[#d81e62] to-[#630091]"];

export default function SolutionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#630091] via-[#d81e62] to-[#630091]" />
      <div className="absolute inset-0 bg-white/95" />
      
      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#d81e62] font-semibold mb-4">
            A solução
          </div>
          <h2 className="font-display text-4xl sm:text-5xl text-balance max-w-2xl mx-auto mb-4 text-[#1a1a1a]">
            Sua própria infraestrutura.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Weaze é a plataforma que marcas profissionais usam para criar relacionamento real. Sem algoritmo, sem intermediários.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.04 * i, duration: 0.4 }}
              className="group p-5 rounded-2xl bg-white border border-[#630091]/10 shadow-md hover:shadow-2xl transition-all duration-300"
              whileHover={{ y: -2 }}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[i % 3]} flex items-center justify-center mb-3`}>
                <benefit.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-display text-base font-semibold mb-1 text-[#1a1a1a]">{benefit.title}</h3>
              <p className="text-xs text-muted-foreground">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}