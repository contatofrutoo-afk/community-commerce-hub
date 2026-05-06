import { motion } from "framer-motion";
import { Check, DollarSign } from "lucide-react";

const handlePaymentClick = () => {
  // TODO: inserir link do Mercado Pago aqui
  console.log("Botão de pagamento conectado - link do Mercado Pago");
};

export default function PricingSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-[#fafafa]">
      <div className="max-w-xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
          <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] mb-4">
            Comece agora com um plano simples
          </h2>
          <p className="text-lg text-[#4a4a4a]">
            Ideal para quem quer criar e crescer desde o início
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl border-2 border-[#630091]/20 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#630091] to-[#d81e62] px-6 py-4 text-center">
            <span className="text-white font-semibold text-lg">Plano Fundador</span>
          </div>
          
          {/* Preço */}
          <div className="text-center py-8 px-6">
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl text-[#6a6a6a]">R$</span>
              <span className="font-display text-5xl md:text-6xl font-bold text-[#1a1a1a]">67</span>
              <span className="text-xl text-[#6a6a6a]">/mês</span>
            </div>
          </div>
          
          {/* Features */}
          <div className="px-6 pb-6">
            <p className="text-center text-[#4a4a4a] mb-6">
              Acesso completo à plataforma, sem limitações. Ideal para quem quer criar e crescer sua comunidade desde o início.
            </p>
            
            <ul className="space-y-3 mb-8">
              {[
                "Comunidade ilimitada",
                "Publicação de conteúdo",
                "Chat e conversas",
                "Agenda de eventos",
                "Métricas e analytics",
                "Suporte prioritário",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#630091]/10 flex items-center justify-center">
                    <Check className="h-3 w-3 text-[#630091]" />
                  </div>
                  <span className="text-[#1a1a1a]">{item}</span>
                </li>
              ))}
            </ul>
            
            {/* BOTÃO PRINCIPAL DE VENDA */}
            <motion.button
              id="pricing-payment-button"
              onClick={handlePaymentClick}
              className="w-full inline-flex items-center justify-center gap-2 text-white px-8 py-4 rounded-full font-semibold text-lg"
              style={{
                background: "linear-gradient(135deg, #630091 0%, #d81e62 100%)",
                boxShadow: "0 10px 40px -10px rgba(99, 0, 145, 0.5)",
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <DollarSign className="h-5 w-5" />
              Assinar agora
            </motion.button>
            
            <p className="text-center text-xs text-[#6a6a6a] mt-4">
              Cancele quando quiser. Sem taxa de setup.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}