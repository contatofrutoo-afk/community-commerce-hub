import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Sparkles, Users, TrendingUp } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const steps = [
  {
    step: "01",
    title: "Crie seu espaço",
    desc: "Escolha o nome da sua comunidade, defina as cores, carregue seu logo. Em minutos, você tem um ambiente 100% personalizado com a cara da sua marca. Pronto para recibir sua gente.",
    icon: Sparkles
  },
  {
    step: "02",
    title: "Convide sua audiência",
    desc: "Compartilhe o link da sua comunidade com quem já te segue no Instagram, WhatsApp, Telegram. Quem entrar vai receber conteúdo, mensagens e ofertas direto — sem intermediary.",
    icon: Users
  },
  {
    step: "03",
    title: "Engaje e converta",
    desc: "Publique posts, faça lives, configure agenda de atendimentos. Cada membro que interage vaiSee seu conteúdo. Cada venda acontece ali mesmo. Sem link externo.",
    icon: TrendingUp
  }
];

export default function HowItWorksSection() {
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
            Como funciona
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-balance">
            Pronto em minutos. Resultados em semanas.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className="relative p-6 rounded-xl bg-background border border-border"
            >
              <div className="absolute top-4 right-6 text-muted-foreground/30 font-display text-5xl">
                {s.step}
              </div>
              <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center mb-4">
                <s.icon className="h-5 w-5 text-brand" />
              </div>
              <h3 className="font-display text-xl mb-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}