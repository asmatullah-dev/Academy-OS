import { GraduationCap, BookOpen } from 'lucide-react';

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src="/logo.png" alt="Academy OS Logo" className="w-12 h-12 object-contain rounded-xl" />
      <div className="flex flex-col">
        <span className="font-black text-2xl tracking-tighter leading-none text-slate-900 dark:text-white">
          ACADEMY<span className="text-emerald-500">APP</span>
        </span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-none mt-1">
          Smart Management
        </span>
      </div>
    </div>
  );
}
