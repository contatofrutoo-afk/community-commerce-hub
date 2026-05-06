import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, MessageCircle, Users } from "lucide-react";

const messages = [
  { text: "Novo membro entrou na comunidade", icon: UserPlus },
  { text: "Usuário solicitou acesso", icon: MessageCircle },
  { text: "Comunidade ativa agora", icon: Users },
  { text: "Novo comentário em post", icon: MessageCircle },
  { text: "Solicitação aprovada", icon: UserPlus },
];

export default function ComparisonSection() {
  const [currentMsg, setCurrentMsg] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMsg((prev) => (prev + 1) % messages.length);
        setIsVisible(true);
      }, 500);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  const msg = messages[currentMsg];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] mb-4">
            Comunidades ativas gerando resultado
          </h2>
        </motion.div>

        {/* Proof notifications */}
        <motion.div className="mt-10 inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-[#630091]/10 to-[#d81e62]/10 rounded-full border border-[#630091]/20">
          <AnimatePresence mode="wait">
            {isVisible && (
              <motion.div
                key={currentMsg}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <msg.icon className="h-4 w-4 text-[#630091]" />
                <span className="text-sm font-medium text-[#630091]">{msg.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { number: "2.5k+", label: "Comunidades ativas" },
            { number: "50k+", label: "Membros" },
            { number: "10k+", label: "Posts publicados" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#630091] to-[#d81e62] bg-clip-text text-transparent">
                {stat.number}
              </div>
              <div className="text-sm text-[#6a6a6a] mt-2">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}