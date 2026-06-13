export default function Avatar({ name = '?', color = '#6366f1', size = 32 }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '33', border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 600, color, flexShrink: 0,
      fontFamily: 'var(--font-mono)', letterSpacing: '0.05em'
    }}>
      {initials}
    </div>
  );
}
