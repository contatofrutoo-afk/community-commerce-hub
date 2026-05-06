import { motion } from "framer-motion";
import { Users, MessageCircle, Store, Calendar, DollarSign, BarChart3, Check } from "lucide-react";

const benefits = [
  { icon: Users, title: "Controle total da sua audiência", desc: "Você decide quem participa" },
  { icon: MessageCircle, title: "Comunicação direta", desc: "Chat exclusivo com seus clientes" },
  { icon: Store, title: "Ambiente exclusivo", desc: "Sua marca, seu espaço" },
  { icon: Calendar, title: "Agenda organizada", desc: "Eventos e lives planejados" },
  { icon: DollarSign, title: "Monetização recorrente", desc: "Transforme atenção em receita" },
  { icon: BarChart3, title: "Dados e métricas", desc: "Saiba como sua comunidade cresce" },
];

export default function WhoSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] mb-4">
            Tudo o que você precisa
          </h2>
          <p className="text-xl text-[#4a4a4a]">
            Ferramentas completas para engajar e convertir
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-4 p-4 md:p-5 rounded-xl bg-[#fafafa] border border-[#630091]/5"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#630091] to-[#d81e62] flex items-center justify-center flex-shrink-0">
                <b.icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1a1a1a] text-sm md:text-base">{b.title}</h3>
                <p className="text-xs md:text-sm text-[#6a6a6a]">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}