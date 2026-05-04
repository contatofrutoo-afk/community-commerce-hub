import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ScrollText, MessageSquare, Calendar, ShoppingBag, BarChart3, Users, Bell, Globe } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const features = [
  { icon: ScrollText, title: "Feed", desc: "Posts, vídeos, carrosséis. Seu conteúdo, suas regras. Sem algoritmo." },
  { icon: MessageSquare, title: "Mensagens", desc: "Chat público e privado. Comunidade e atendimento num só lugar." },
  { icon: Calendar, title: "Agenda", desc: "Agendamentos, eventos, disponibilidade. Sem ferramenta externa." },
  { icon: ShoppingBag, title: "Loja", desc: "Productos, serviços, cursos. Venda direto,sem link externo." },
  { icon: BarChart3, title: "Dados", desc: "Métricas, funil, retention. Dados que te ajudam a decidir." },
  { icon: Users, title: "Membros", desc: "Lista de membros, filtros, busca. Quem é sua audiência." },
  { icon: Bell, title: "Notificações", desc: "Push, email. Matenha todo mundo informado." },
  { icon: Globe, title: "Domínio", desc: "Seu domínio, seuapp.seudominio.com. Total white-label." }
];

export default function ProductSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-28 bg-muted/30">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
            O que você ganha
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-balance max-w-2xl mx-auto mb-4">
            Tudo que precisa. Num só lugar.
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Feed, mensagens, agenda, loja, dados — integrado e funcionando. Sem mensalidade por usuário. Sem limites escondidos.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.03 * i, duration: 0.3 }}
              className="p-4 rounded-xl bg-background border border-border"
            >
              <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center mb-3">
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