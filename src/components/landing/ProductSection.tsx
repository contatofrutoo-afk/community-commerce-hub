import { motion } from "framer-motion";
import { Brush, Video, Users, Store, Heart, Music } from "lucide-react";

const profiles = [
  { icon: Brush, title: "Profissionais da beleza", desc: "Cabeleireiros, nail artists, beauty entrepreneurs" },
  { icon: Video, title: "Criadores de conteúdo", desc: "YouTubers, influenciadores, criadores" },
  { icon: Users, title: "Comunidades locais", desc: "Grupos de bairro, associações" },
  { icon: Store, title: "Negócios de relacionamento", desc: " coaches, consultores, advisers" },
];

export default function ProductSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-[#fafafa]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] mb-4">
            Para marcas que querem <span className="text-[#630091]">mais do que seguidores.</span>
          </h2>
          <p className="text-xl text-[#4a4a4a] mb-10">
            Ideal para quem busca construir relacionamento real
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profiles.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#630091]/10 shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-[#630091]/10 flex items-center justify-center flex-shrink-0">
                <p.icon className="h-6 w-6 text-[#630091]" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[#1a1a1a]">{p.title}</h3>
                <p className="text-sm text-[#6a6a6a]">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}