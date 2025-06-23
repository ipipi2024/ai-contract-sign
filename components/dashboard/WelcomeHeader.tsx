// components/dashboard/WelcomeHeader.tsx
interface WelcomeHeaderProps {
  userName?: string | null;
}

export function WelcomeHeader({ userName }: WelcomeHeaderProps) {
  if (!userName) return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
        Welcome back, {userName}!
      </h2>
      <p style={{ color: 'var(--foreground)', opacity: 0.7 }}>
        Here's your contract overview
      </p>
    </div>
  );
}
