interface StarRatingProps {
  value: number
  onChange?: (val: number) => void
  size?: number
  readonly?: boolean
}

export function StarRating({ value, onChange, size = 20, readonly = false }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`transition-transform active:scale-110 ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
          style={{ width: size, height: size }}
          aria-label={`${star} star`}
        >
          <svg
            viewBox="0 0 24 24"
            fill={star <= value ? '#c8d4f0' : 'none'}
            stroke={star <= value ? '#c8d4f0' : '#4a5568'}
            strokeWidth={1.5}
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        </button>
      ))}
    </div>
  )
}
