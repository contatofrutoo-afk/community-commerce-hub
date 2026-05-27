import { motion } from "framer-motion";
import { Check, Sparkles, Star, ArrowRight } from "lucide-react";

const handlePaymentClick = (plan: "monthly" | "yearly") => {
  // TODO: adicionar link Mercado Pago conforme plano
};

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const features = [
  "Todos os recursos da plataforma",
  "Comunidade ilimitada",
  "Feed completo",
  "Mensagens",
  "Grupos",
  "Conteúdos",
];

export default function PricingSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-[#fafafa] relative overflow-hidden">
      {/* Subtle background decoration */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-gradient-to-br from-[#630091]/5 via-[#d81e62]/5 to-transparent blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-5xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] mb-3">
            Invista na sua comunidade
          </h2>
          <p className="text-lg text-[#4a4a4a] max-w-2xl mx-auto">
            Mesmo acesso completo em ambos os planos. A diferença é apenas o
            compromisso — e a economia.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">
          {/* ANNUAL CARD — left on desktop, top on mobile */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col bg-white rounded-3xl border-2 border-[#630091]/30 shadow-2xl relative"
            style={{
              boxShadow:
                "0 20px 60px -15px rgba(99, 0, 145, 0.25), 0 0 0 1px rgba(99, 0, 145, 0.08)",
            }}
          >
            {/* Glow effect */}
            <motion.div
              className="absolute -inset-2 rounded-[2rem] opacity-60 blur-2xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(99,0,145,0.3), rgba(216,30,98,0.3))",
              }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 4, repeat: Infinity }}
            />

            {/* Badge */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide text-white shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, #630091 0%, #d81e62 100%)",
                  boxShadow:
                    "0 8px 24px -8px rgba(99, 0, 145, 0.6)",
                }}
              >
                <Star className="h-3 w-3 fill-white" />
                MAIS ESCOLHIDO
              </div>
            </div>

            {/* Header */}
            <div className="px-6 pt-12 pb-4 text-center border-b border-[#630091]/10 bg-gradient-to-r from-[#630091]/5 via-[#d81e62]/5 to-[#630091]/5 rounded-t-3xl">
              <h3 className="font-display text-xl text-[#1a1a1a] mb-1">
                Plano Anual
              </h3>
              <p className="text-xs text-[#6a6a6a]">Melhor custo-benefício</p>
            </div>

            {/* Price */}
            <div className="px-6 py-6 text-center">
              <div className="flex items-baseline justify-center gap-0.5">
                <span className="text-lg text-[#6a6a6a]">R$</span>
                <span className="font-display text-5xl font-bold text-[#1a1a1a]">
                  87
                </span>
                <span className="text-base text-[#6a6a6a]">em 10x</span>
              </div>
              <p className="text-sm text-[#6a6a6a] mt-2">
                Receba 12 meses de acesso
              </p>

              {/* Savings highlight */}
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#630091]/10 to-[#d81e62]/10 border border-[#630091]/15">
                <Sparkles className="h-4 w-4 text-[#d81e62]" />
                <div className="text-sm font-semibold text-[#1a1a1a]">
                  Economize{" "}
                  <span className="text-[#d81e62]">R$ 654</span>
                </div>
              </div>
              <div className="mt-2 text-xs font-medium text-[#630091]">
                🎁 Ganhe 2 meses grátis
              </div>
            </div>

            {/* Features */}
            <div className="px-6 pb-2 flex-1">
              <ul className="space-y-3">
                {features.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#630091]/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-[#630091]" />
                    </div>
                    <span className="text-sm text-[#1a1a1a]">{item}</span>
                  </li>
                ))}
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#630091]/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-[#630091]" />
                  </div>
                  <span className="text-sm text-[#1a1a1a]">Mesmo acesso completo</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#630091]/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-[#630091]" />
                  </div>
                  <span className="text-sm text-[#1a1a1a]">Melhor custo-benefício</span>
                </li>
              </ul>
            </div>

            {/* Footer text */}
            <div className="px-6 pt-4">
              <p className="text-xs text-[#6a6a6a] text-center">
                Ideal para quem quer crescer e construir sua comunidade no
                longo prazo.
              </p>
            </div>

            {/* CTA */}
            <div className="px-6 pb-8 pt-6">
              <motion.button
                onClick={() => handlePaymentClick("yearly")}
                className="w-full inline-flex items-center justify-center gap-2 text-white px-8 py-4 rounded-full font-semibold text-base"
                style={{
                  background:
                    "linear-gradient(135deg, #630091 0%, #d81e62 100%)",
                  boxShadow:
                    "0 10px 40px -10px rgba(99, 0, 145, 0.6), 0 4px 12px -2px rgba(216, 30, 98, 0.3)",
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                Escolher plano anual
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>

          {/* MONTHLY CARD — right on desktop, bottom on mobile */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="flex-1 flex flex-col bg-white rounded-3xl border border-[#1a1a1a]/10 shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-8 pb-4 text-center border-b border-[#1a1a1a]/5">
              <h3 className="font-display text-xl text-[#1a1a1a] mb-1">
                Plano Mensal
              </h3>
              <p className="text-xs text-[#6a6a6a]">Sem compromisso</p>
            </div>

            {/* Price */}
            <div className="px-6 py-6 text-center">
              <div className="flex items-baseline justify-center gap-0.5">
                <span className="text-lg text-[#6a6a6a]">R$</span>
                <span className="font-display text-5xl font-bold text-[#1a1a1a]">
                  127
                </span>
                <span className="text-base text-[#6a6a6a]">/mês</span>
              </div>
              <p className="text-sm text-[#6a6a6a] mt-2">
                Mesmo acesso completo. Sem compromisso.
              </p>
            </div>

            {/* Features */}
            <div className="px-6 pb-2 flex-1">
              <ul className="space-y-3">
                {features.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#630091]/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-[#630091]" />
                    </div>
                    <span className="text-sm text-[#1a1a1a]">{item}</span>
                  </li>
                ))}
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#630091]/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-[#630091]" />
                  </div>
                  <span className="text-sm text-[#1a1a1a]">Cancele quando quiser</span>
                </li>
              </ul>
            </div>

            {/* Footer text */}
            <div className="px-6 pt-4">
              <p className="text-xs text-[#6a6a6a] text-center">
                Ideal para quem deseja começar sem compromisso.
              </p>
            </div>

            {/* CTA */}
            <div className="px-6 pb-8 pt-6">
              <motion.button
                onClick={() => handlePaymentClick("monthly")}
                className="w-full inline-flex items-center justify-center gap-2 bg-white text-[#1a1a1a] border-2 border-[#1a1a1a]/10 hover:border-[#630091]/30 px-8 py-4 rounded-full font-semibold text-base transition-colors"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}