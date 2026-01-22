export default function Badge({ children, variant = 'default', isDark = true }) {
    const darkVariants = {
      default: 'bg-white/5 text-slate-200 ring-white/10',
      success: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
      warning: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
      info: 'bg-[#7BAFD4]/10 text-[#7BAFD4] ring-[#7BAFD4]/20',
      violet: 'bg-violet-500/10 text-violet-400 ring-violet-500/20',
    };
    
    const lightVariants = {
      default: 'bg-slate-100 text-slate-700 ring-slate-200',
      success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      warning: 'bg-amber-50 text-amber-700 ring-amber-200',
      info: 'bg-[#7BAFD4]/10 text-[#0B1F3A] ring-[#7BAFD4]/30',
      violet: 'bg-violet-50 text-violet-700 ring-violet-200',
    };
  
    const variants = isDark ? darkVariants : lightVariants;
  
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${variants[variant]}`}>
        {children}
      </span>
    );
  }