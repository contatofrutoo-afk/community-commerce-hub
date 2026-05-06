import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, DollarSign } from "lucide-react";

const handlePaymentClick = () => {
  // TODO: inserir link do Mercado Pago aqui
  console.log("CTA Final - botão de pagamento");
};

export default function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] mb-6">
            Pare de depender de algoritmos.
            <br />
            <span className="text-[#630091]">Comece a construir sua própria comunidade hoje.</span>
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <motion.button
                className="inline-flex items-center justify-center gap-2 text-white px-8 py-4 rounded-full font-semibold"
                style={{
                  background: "linear-gradient(135deg, #630091 0%, #d81e62 100%)",
                  boxShadow: "0 10px 40px -10px rgba(99, 0, 145, 0.5)",
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Começar agora
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </Link>
            
            <motion.button
              onClick={handlePaymentClick}
              className="inline-flex items-center justify-center gap-2 bg-white text-[#630091] border-2 border-[#630091] hover:bg-[#630091]/5 px-8 py-4 rounded-full font-medium"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <DollarSign className="h-5 w-5" />
              Assinar acesso
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}