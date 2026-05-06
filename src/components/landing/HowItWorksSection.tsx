import { motion } from "framer-motion";
import { Sparkles, Users, TrendingUp, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Crie sua comunidade",
    desc: "Cadastre sua marca e personalize seu espaço.",
    icon: Sparkles,
  },
  {
    number: "02",
    title: "Convide seus clientes",
    desc: "Eles solicitam acesso e você controla quem entra.",
    icon: Users,
  },
  {
    number: "03",
    title: "Engaje e monetize",
    desc: "Publique conteúdo, converse e transforme atenção em receita.",
    icon: TrendingUp,
  },
];

export default function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-16 md:py-24 bg-gradient-to-b from-white via-[#fafafa] to-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="inline-block text-xs uppercase tracking-[0.25em] text-[#d81e62] font-semibold mb-4">
            Como funciona
          </span>
          <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a]">
            Comece em minutos.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              <div className="p-6 md:p-8 rounded-2xl bg-white border-2 border-[#630091]/10 hover:border-[#630091]/30 transition-all duration-300 shadow-lg hover:shadow-xl h-full">
                <div className="font-display text-5xl md:text-6xl font-bold text-[#630091]/15 absolute top-4 right-6">
                  {s.number}
                </div>
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-[#630091] to-[#d81e62] flex items-center justify-center mb-5 shadow-lg">
                  <s.icon className="h-6 w-6 md:h-7 md:w-7 text-white" />
                </div>
                <h3 className="font-display text-xl md:text-2xl font-semibold mb-3 text-[#1a1a1a]">{s.title}</h3>
                <p className="text-[#6a6a6a]">{s.desc}</p>
              </div>
              
              {i < steps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#630091] to-[#d81e62] flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}