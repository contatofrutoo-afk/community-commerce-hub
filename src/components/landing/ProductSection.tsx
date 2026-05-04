import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Sparkles, MessageCircle, Calendar, BarChart3, ShoppingBag } from "lucide-react";

const products = [
  { icon: Sparkles, title: "Feed", desc: "Conteúdo vídeo-first com engajamento nativo" },
  { icon: MessageCircle, title: "Conversas", desc: "Comunidade e chat privado" },
  { icon: Calendar, title: "Agenda", desc: "Agendamentos e eventos" },
  { icon: ShoppingBag, title: "Loja", desc: "Produtos e serviços" },
  { icon: BarChart3, title: "Dados", desc: "Métricas e análise" },
];

export default function ProductSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <p className="text-brand text-xs uppercase tracking-[0.2em] mb-4">
            A experiência
          </p>
          <h2 className="font-display text-4xl sm:text-5xl text-balance max-w-3xl mx-auto mb-6">
            Tudo que você precisa. Em um só lugar.
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Feed, conversas, agenda, loja e dados — integrados e prontos para converter.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {products.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl bg-card border border-border hover:border-brand/30 transition-all text-center"
            >
              <div className="h-14 w-14 mx-auto mb-4 rounded-2xl bg-brand/10 flex items-center justify-center">
                <p.icon className="h-7 w-7 text-brand" />
              </div>
              <h3 className="font-display text-lg mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}