import React, { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";

interface CopyableCardProps {
  title?: string;
  subtitle?: string;
  meta?: string;
  copyContent: string;
  children: ReactNode;
  accentColor?: string;
}

const CopyableCard: React.FC<CopyableCardProps> = ({
  title,
  subtitle,
  meta,
  copyContent,
  children,
  accentColor = "from-[#1A1A2E] to-[#16213E]"
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyContent);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ translateY: -2 }}
      className={`relative rounded-2xl border border-white/10 bg-gradient-to-br ${accentColor} p-5 shadow-xl transition-all`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-slate-300">{subtitle}</p>}
          {meta && <p className="mt-2 text-xs uppercase tracking-widest text-slate-400">{meta}</p>}
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <div className="mt-4 space-y-3 text-sm text-slate-100">{children}</div>
    </motion.div>
  );
};

export default CopyableCard;
