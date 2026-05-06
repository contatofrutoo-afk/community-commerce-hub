import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

export default function ProblemSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-[#fafafa]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <AlertCircle className="h-12 w-12 text-[#d81e62] mx-auto mb-6" />
          
          <h2 className="font-display text-3xl md:text-4xl text-[#0a0a0a] mb-6">
            Muitos negócios dependem de redes sociais para se conectar com seus clientes.
          </h2>
          
          <p className="text-xl md:text-2xl text-[#4a4a4a] mb-8 leading-relaxed">
            Mas o alcance é limitado, o contato não é direto e a conversão é imprevisível.
          </p>
          
          <div className="text-2xl md:text-3xl font-display text-[#1a1a1a]">
            Você constrói audiência…{" "}
            <span className="text-gradient bg-gradient-to-r from-[#630091] to-[#d81e62] bg-clip-text text-transparent">
              mas não tem controle sobre ela.
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}