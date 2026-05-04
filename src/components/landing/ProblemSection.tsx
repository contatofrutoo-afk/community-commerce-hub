import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, Lock, BarChart3, Layers, Link2, Search } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const problems = [
  {
    icon: AlertTriangle,
    title: "Você depende do algoritmo",
    desc: "Seu alcance é controlado pela plataforma. A cada mudança de feed, menos pessoas veem seu conteúdo.",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: Link2,
    title: "Não consegue manter contato",
    desc: "Após publicar, não há como falar diretamente com quem te seguiu.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Layers,
    title: "Seguidores não viram clientes",
    desc: "Você tem atenção, mas converter em venda é difícil. O link no bio não é suficiente.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Lock,
    title: "Sua marca se perde no meio",
    desc: "No feed, sua marca compete com centenas de outras. É difícil se destacar.",
    color: "from-amber-500 to-orange-500"
  },
  {
    icon: Search,
    title: "Sem dados reais",
    desc: "Você não sabe quem é sua audiência de verdade. Não consegue medir retention.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: BarChart3,
    title: "Precisa de várias ferramentas",
    desc: "Você usa Instagram, WhatsApp, Calendly, Shopify. Tudo separado.",
    color: "from-indigo-500 to-purple-500"
  }
];

export default function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#630091]/3 via-[#d81e62]/2 to-[#630091]/3" />
      
      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#d81e62] font-semibold mb-4">
            O problema
          </div>
          <h2 className="font-display text-4xl sm:text-5xl text-balance max-w-2xl mx-auto mb-4 text-[#1a1a1a]">
            As redes sociais sabotam seu negócio.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Você está construindo a audiência de outra pessoa. A qualquer momento, as regras mudam e tudo pode desaparecer.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              className="group relative p-6 rounded-2xl bg-white border border-[#630091]/10 shadow-sm hover:shadow-xl transition-all duration-300"
              whileHover={{ y: -4 }}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${problem.color} opacity-0 group-hover:opacity-10 transition-opacity rounded-br-2xl`} />
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${problem.color} flex items-center justify-center mb-4`}>
                <problem.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-display text-lg mb-2 text-[#1a1a1a]">{problem.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{problem.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}