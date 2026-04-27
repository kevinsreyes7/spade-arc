import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { articles } from '@/data/articles'

export function ArticleReader() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const article = articles.find((a) => a.id === Number(id))

  if (!article) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-textMuted">Article not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Cover image */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover opacity-70"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-bg/80 border border-border flex items-center justify-center"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-textPrimary">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="px-5 pb-16 -mt-6 relative z-10"
      >
        <h1 className="font-display text-3xl text-textPrimary tracking-wide leading-tight mb-4">
          {article.title}
        </h1>

        {/* Article body — each paragraph separated by blank line */}
        <div className="space-y-4">
          {article.content.split('\n\n').map((para, i) => (
            <p
              key={i}
              className="text-textMuted text-[15px] leading-relaxed font-body"
            >
              {para}
            </p>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
