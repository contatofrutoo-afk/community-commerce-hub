import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  }
};

const audiences = [
  { title: "Creators", desc: "Transforme seguidores em membros pagantes" },
  { title: "E-commerces", desc: "Clientes fieis geram recompra" },
  { title: "Coaches", desc: "Acompanhamento completo" },
  { title: "Cursos", desc: "Alunos mais engajados" },
  { title: "Serviços", desc: "Agenda e histórico facilitado" },
  { title: "Comunidades", desc: "Network orgânico" }
];

export default function WhoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#d81e62]/5 via-white to-[#630091]/5" />
      
      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#d81e62] font-semibold mb-4">
            Para quem é
          </div>
          <h2 className="font-display text-4xl sm:text-5xl text-balance max-w-2xl mx-auto mb-4 text-[#1a1a1a]">
            Para marcas que levam relacionamento a sério.
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
            Qualquer pessoa ou marca que quer construir algo que dura, sem depender de plataformas.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {audiences.map((audience, i) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              className="group p-5 rounded-2xl bg-white text-center border border-[#630091]/10 shadow-md hover:shadow-xl hover:border-[#d81e62]/30 transition-all duration-300"
              whileHover={{ scale: 1.03 }}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#630091] to-[#d81e62] flex items-center justify-center mb-3 mx-auto">
                <span className="font-display text-xl font-bold text-white">{i + 1}</span>
              </div>
              <h3 className="font-display font-semibold mb-1 text-[#1a1a1a]">{audience.title}</h3>
              <p className="text-xs text-muted-foreground">{audience.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}