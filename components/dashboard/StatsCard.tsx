// components/dashboard/StatsCard.tsx
interface StatsCardProps {
  title: string;
  value: number;
  icon: 'documents' | 'check' | 'clock' | 'pencil';
  color: 'blue' | 'green' | 'yellow' | 'gray';
}

export function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const icons = {
    documents: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4z" clipRule="evenodd" />
        <path d="M8 7h4v2H8V7zm0 4h4v2H8v-2z" />
      </svg>
    ),
    check: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    clock: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
    pencil: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    )
  };

  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300',
    gray: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
  };

  return (
    <div 
      className="rounded-lg p-6"
      style={{ 
        backgroundColor: 'var(--background)',
        border: '1px solid rgba(128, 128, 128, 0.2)'
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p 
            className="text-sm font-medium"
            style={{ color: 'var(--foreground)', opacity: 0.7 }}
          >
            {title}
          </p>
          <p className="text-2xl font-semibold mt-2" style={{ color: 'var(--foreground)' }}>
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          {icons[icon]}
        </div>
      </div>
    </div>
  );
}
