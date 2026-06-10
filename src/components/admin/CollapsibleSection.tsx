import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

type Props = {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

const CollapsibleSection = ({ title, subtitle, defaultOpen = false, children }: Props) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <div>
          <h3 className="text-sm font-medium tracking-wider uppercase">{title}</h3>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="border-t border-border p-5">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;
