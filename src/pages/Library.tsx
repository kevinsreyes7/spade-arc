import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { articles } from '@/data/articles'

export function Library() {
  const navigate = useNavigate()

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="font-display text-4xl text-accent tracking-widest">LIBRARY</h1>
          <p className="text-textMuted text-sm mt-0.5">The science behind the program</p>
        </motion.div>

        {/* Article cards */}
        <div className="space-y-4">
          {articles.map((article, i) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              onClick={() => navigate(`/library/${article.id}`)}
              className="cursor-pointer"
            >
              <div className="bg-card border border-border rounded-2xl overflow-hidden card-hover active:scale-[0.99] transition-transform duration-100">
                {/* Cover image */}
                <div className="h-44 overflow-hidden">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover opacity-80"
                    loading="lazy"
                  />
                </div>

                {/* Text */}
                <div className="p-4">
                  <h2 className="font-display text-xl text-textPrimary tracking-wide leading-tight mb-2">
                    {article.title}
                  </h2>
                  <p className="text-textMuted text-sm leading-relaxed line-clamp-2">
                    {article.teaser}
                  </p>
                  <div className="flex items-center gap-1.5 mt-3">
                    <span className="text-accent text-xs font-medium tracking-wider">READ MORE</span>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 text-accent">
                      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </Layout>
  )
}
