import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Play, Users, Zap, DollarSign, MessageCircle, Calendar, BarChart3 } from "lucide-react";
import heroMockup from "@/assets/landing-hero-mockup.jpg";

const handlePaymentClick = () => {
  // TODO: inserir link do Mercado Pago aqui
  console.log("Botão de pagamento clicado - conectar com Mercado Pago");
};

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-16 pb-12 overflow-hidden bg-white">
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute -top-40 -right-40 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[#630091]/15 via-[#d81e62]/10 to-transparent blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-[#d81e62]/15 via-[#630091]/10 to-transparent blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: "linear-gradient(#630091 1px, transparent 1px), linear-gradient(90deg, #630091 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <div className="relative mx-auto max-w-6xl px-6 py-12 w-full">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* LEFT - conteúdo */}
          <div>
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#630091]/10 to-[#d81e62]/10 border border-[#630091]/15">
                <Users className="h-3.5 w-3.5 text-[#d81e62]" />
                <span className="text-xs font-medium text-[#630091] tracking-wide">Plataforma de comunidades</span>
              </span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="font-display text-4xl sm:text-5xl lg:text-5xl leading-tight text-[#0a0a0a] mb-6">
              Sua comunidade, no seu controle.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#630091] to-[#d81e62]">
                Sem depender de redes sociais.
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-xl sm:text-2xl text-[#4a4a4a] mb-4 leading-relaxed">
              Crie um espaço próprio para seus clientes, com conteúdo, conexão e conversão em um único lugar.
            </motion.p>

            <motion.p variants={fadeInUp} className="text-base text-[#6a6a6a] mb-8 leading-relaxed">
              A Weaze transforma sua audiência em comunidade ativa, com ferramentas prontas para engajar, organizar e vender.
            </motion.p>

            {/* Botões */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link to="/auth">
                <motion.button
                  className="group relative inline-flex items-center justify-center gap-2 text-white px-8 py-4 rounded-full font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #630091 0%, #d81e62 100%)",
                    boxShadow: "0 10px 40px -10px rgba(99, 0, 145, 0.5)",
                  }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10">Começar agora</span>
                  <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </motion.button>
              </Link>

              <motion.button
                id="cta-payment"
                onClick={handlePaymentClick}
                className="inline-flex items-center justify-center gap-2 bg-white text-[#630091] border-2 border-[#630091] hover:bg-[#630091]/5 px-8 py-4 rounded-full font-medium transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <DollarSign className="h-5 w-5" />
                Assinar acesso
              </motion.button>
            </motion.div>

            {/* Sociais */}
            <motion.div variants={fadeInUp} className="flex items-center gap-4 pt-4 border-t border-[#1a1a1a]/8">
              <div className="flex -space-x-2">
                {["from-[#630091] to-[#8b2091]", "from-[#8b2091] to-[#d81e62]", "from-[#d81e62] to-[#ff5a8a]", "from-[#630091] to-[#d81e62]"].map((g, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} ring-2 ring-white`} />
                ))}
              </div>
              <div className="text-sm">
                <div className="font-semibold text-[#1a1a1a]">Marcas ativas</div>
                <div className="text-[#6a6a6a] text-xs">Criadores, coaches ecommerces</div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT - Mockup */}
          <motion.div className="relative mt-8 lg:mt-0">
            <motion.div className="absolute -inset-8 rounded-[3rem] opacity-50 blur-2xl" style={{
              background: "linear-gradient(135deg, rgba(99,0,145,0.3), rgba(216,30,98,0.3))",
            }} />

            <motion.div
              className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/40 bg-white mx-auto max-w-[260px] sm:max-w-sm lg:max-w-none"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <img src={heroMockup} alt="App Weaze" width={520} height={650} className="w-full h-auto" />
            </motion.div>

            {/* Floating cards */}
            <motion.div className="absolute -left-4 top-8 bg-white rounded-xl shadow-lg border border-[#630091]/10 px-3 py-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[#630091]" />
                <span className="text-xs font-medium text-[#1a1a1a]">Conversas ativas</span>
              </div>
            </motion.div>

            <motion.div className="absolute -right-4 bottom-24 bg-white rounded-xl shadow-lg border border-[#d81e62]/10 px-3 py-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }}>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#d81e62]" />
                <span className="text-xs font-medium text-[#1a1a1a]">Eventos</span>
              </div>
            </motion.div>

            <motion.div className="absolute -right-8 top-1/2 bg-white rounded-xl shadow-lg border border-[#630091]/10 px-3 py-2 hidden sm:block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#630091]" />
                <span className="text-xs font-medium text-[#1a1a1a]">Métricas</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}