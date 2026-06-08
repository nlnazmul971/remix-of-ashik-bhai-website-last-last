import { useState, ReactNode } from 'react';
import { HelpCircle, ChevronDown, ExternalLink } from 'lucide-react';

type Step = { text: string; link?: { label: string; href: string } };

type Props = {
  title: string;
  steps: Step[];
  tips?: string[];
  defaultOpen?: boolean;
};

/**
 * Sundor collapsible help box — proti SEO field er pashe deya hobe.
 * Step-by-step Bangla + English instructions + direct links.
 */
const SEOHelp = ({ title, steps, tips, defaultOpen = false }: Props) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-primary">
          <HelpCircle size={14} />
          {title}
        </span>
        <ChevronDown size={14} className={`text-primary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 text-[11px] text-foreground/80 leading-relaxed">
          <ol className="space-y-1.5 list-decimal pl-4">
            {steps.map((s, i) => (
              <li key={i}>
                {s.text}
                {s.link && (
                  <>
                    {' '}
                    <a href={s.link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary underline">
                      {s.link.label} <ExternalLink size={9} />
                    </a>
                  </>
                )}
              </li>
            ))}
          </ol>
          {tips && tips.length > 0 && (
            <div className="pt-2 mt-2 border-t border-primary/15">
              <p className="text-[10px] font-semibold text-primary mb-1">💡 Tips</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SEOHelp;
export const HelpWrap = ({ children }: { children: ReactNode }) => <div className="mt-1.5">{children}</div>;
