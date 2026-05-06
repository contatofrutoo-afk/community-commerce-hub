import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export default function SolutionSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-3xl md:text-4xl text-[#0a0a0a] mb-6">
            A solução é ter sua própria comunidade.
          </h2>
          
          <p className="text-xl md:text-2xl text-[#4a4a4a] leading-relaxed">
            Com a Weaze, você cria um ambiente exclusivo para sua marca, onde seus clientes podem interagir, consumir conteúdo e comprar —{" "}
            <span className="font-semibold text-[#630091]">tudo dentro da sua própria plataforma.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}