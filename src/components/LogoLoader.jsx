// Branded loading screen: floating logo with a light sweep, glow, and the tagline revealing word by word.
const WORDS = ['Rent,', 'Create,', 'Inspire.']

const LogoLoader = ({ label = 'Getting the gear ready…' }) => (
  <div className="flex flex-col items-center justify-center min-h-[68vh] px-6 select-none" role="status" aria-live="polite">
    <div className="relative" style={{ animation: 'lm-pop .5s ease-out both' }}>
      {/* glow behind the logo */}
      <div
        className="absolute -inset-8 rounded-full blur-2xl"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,.45), rgba(229,85,15,.35) 60%, transparent 75%)', animation: 'lm-glow 2.4s ease-in-out infinite' }}
      />
      {/* logo card */}
      <div
        className="relative rounded-3xl bg-white shadow-[0_20px_50px_rgba(26,26,46,0.22)] overflow-hidden px-6 py-4"
        style={{ animation: 'lm-float 2.4s ease-in-out infinite' }}
      >
        <img src="/logo.jpg" alt="Lens Men" className="h-[120px] md:h-[150px] w-auto object-contain" />
        {/* light sweep */}
        <div
          className="absolute inset-y-0 w-1/3 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.85), transparent)', animation: 'lm-shine 2.2s ease-in-out infinite' }}
        />
      </div>
    </div>

    {/* tagline */}
    <div className="flex items-center gap-2.5 mt-9 text-[18px] md:text-[22px] font-black tracking-tight text-[#1a1a2e]">
      {WORDS.map((w, i) => (
        <span key={w} style={{ animation: 'lm-word 2.4s ease-in-out infinite', animationDelay: `${i * 0.35}s`, opacity: 0 }}
          className={i === 2 ? 'text-[#E5550F]' : ''}>
          {w}
        </span>
      ))}
    </div>

    {/* progress sweep */}
    <div className="mt-5 w-44 h-1 rounded-full bg-gray-200 overflow-hidden">
      <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#E5550F]" style={{ animation: 'lm-bar 1.4s ease-in-out infinite' }} />
    </div>
    <p className="mt-3 text-[12px] text-gray-400 font-medium">{label}</p>
  </div>
)

export default LogoLoader
