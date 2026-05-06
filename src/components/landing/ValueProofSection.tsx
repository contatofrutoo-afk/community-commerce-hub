import { motion } from "framer-motion";
import { MessageCircle, Users, TrendingUp, Check } from "lucide-react";

export default function ValueProofSection() {
  return (
    <section className="py-16 md:py-24 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-white mb-4">
            Por que a Weaze funciona
          </h2>
          <p className="text-lg text-[#a1a1a1a]">
            Resultados reais de comunidades que cresceram com a gente
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: TrendingUp, value: "+312%", label: "Engajamento", desc: "Aumento médio em 30 dias" },
            { icon: Users, value: "85%", label: "Retenção", desc: "Membros ativos mensais" },
            { icon: MessageCircle, value: "4.2k", label: "Mensagens", desc: "Conversas por comunidade" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-6 rounded-2xl bg-[#1a1a1a] border border-[#630091]/20"
            >
              <stat.icon className="h-8 w-8 text-[#d81e62] mx-auto mb-4" />
              <div className="font-display text-4xl font-bold text-white mb-2">{stat.value}</div>
              <div className="font-semibold text-[#d81e62] mb-1">{stat.label}</div>
              <div className="text-sm text-[#a1a1a1a]">{stat.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}