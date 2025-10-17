interface LoadingSkeletonProps {
  className?: string
  type?: 'text' | 'card' | 'avatar' | 'button'
  lines?: number
}

export default function LoadingSkeleton({ 
  className = '', 
  type = 'text',
  lines = 1 
}: LoadingSkeletonProps) {
  const baseClass = 'animate-pulse bg-gray-300 dark:bg-gray-700 rounded'

  if (type === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClass} h-4 ${className}`}
            style={{ width: i === lines - 1 ? '80%' : '100%' }}
          />
        ))}
      </div>
    )
  }

  if (type === 'card') {
    return (
      <div className={`${baseClass} p-6 ${className}`}>
        <div className="h-6 bg-gray-400 dark:bg-gray-600 rounded w-1/3 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-400 dark:bg-gray-600 rounded w-full" />
          <div className="h-4 bg-gray-400 dark:bg-gray-600 rounded w-5/6" />
        </div>
      </div>
    )
  }

  if (type === 'avatar') {
    return <div className={`${baseClass} w-12 h-12 rounded-full ${className}`} />
  }

  if (type === 'button') {
    return <div className={`${baseClass} h-10 w-24 ${className}`} />
  }

  return <div className={`${baseClass} ${className}`} />
}
