import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ScrollText, MessageSquare, Calendar, ShoppingBag, BarChart3 } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const features = [
  { icon: ScrollText, title: "Feed", desc: "Conteúdo em vídeo e texto" },
  { icon: MessageSquare, title: "Mensagens", desc: "Chat com sua galera" },
  { icon: Calendar, title: "Agenda", desc: "Agendamentos" },
  { icon: ShoppingBag, title: "Loja", desc: "Vendas integradas" },
  { icon: BarChart3, title: "Dados", desc: "Métricas reais" },
];

export default function ProductSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            O que você ganha
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-balance max-w-2xl mx-auto mb-4">
            Tudo que precisa. Num só lugar.
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Feed, mensagens, agenda, loja e dados — pronto para usar.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
              className="p-4 rounded-xl bg-muted/30 text-center"
            >
              <div className="h-10 w-10 mx-auto mb-3 rounded-lg bg-background flex items-center justify-center">
                <f.icon className="h-5 w-5 text-brand" />
              </div>
              <h3 className="font-medium text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}