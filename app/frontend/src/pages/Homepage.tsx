'use client';

import { useEffect } from 'react';
import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero';

const HOMEPAGE_MEDIA = {
  background: '/Mycelium.jpg.webp',
  media: '/nodes.jpg',
  title: 'MyCelium Nodal Network',
  date: 'Hack Canada 2026',
  scrollToExpand: 'Scroll to explore',
};

type Feature = {
  title: string;
  description: string;
  accent?: boolean;
  dark?: boolean;
};

const FEATURES: Feature[] = [
  {
    title: 'Farm optimization',
    description: 'Data-driven crop and quantity recommendations from plot and soil data.',
    accent: true,
  },
  {
    title: 'Nodal network',
    description: 'See every farm and hub on the live map. One view, one network.',
  },
  {
    title: 'Crop assignment',
    description: 'Get your bundle: crop name, quantity, grow weeks, and reason.',
  },
  {
    title: 'Hub coordination',
    description: 'Your harvest fits the network. No overplanting, no missed demand.',
    dark: true,
  },
  {
    title: 'Regional visibility',
    description: 'From single plot to full region. Cooperatives and buyers see capacity.',
  },
];

function HomepageContent() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 py-12 sm:py-16" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Section label + Hero-style intro (kit 01) */}
      <section className="mb-14">
        <div
          className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--ink-3)] pb-2.5 mb-4 border-b border-[var(--border)]"
          style={{ letterSpacing: '0.16em' }}
        >
          Platform
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)] mb-3">
          Farm optimization for growers & regional food systems
        </div>
        <h2
          className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold text-[var(--ink)] leading-tight tracking-tight mb-3"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
        >
          The farm optimization platform for growers, cooperatives, and regional food systems
        </h2>
        <p className="text-sm sm:text-base text-[var(--ink-2)] leading-relaxed max-w-[520px] mb-7">
          A data-driven platform that replaces guesswork with an optimization engine. Connect your farm to the nodal network—submit plot size, soil readings, tools, and budget, and get crop assignments that align with nearby hubs and regional demand.
        </p>
        <div className="flex flex-wrap gap-2.5 items-center">
          <a
            href="#register"
            className="inline-flex items-center justify-center gap-1.5 h-11 px-6 rounded-[var(--r-sm)] text-[13px] font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Register your farm
          </a>
          <a
            href="#network"
            className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-[var(--r-sm)] text-[13px] font-semibold bg-transparent text-[var(--ink-2)] hover:opacity-82 transition-opacity"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            See the network
          </a>
        </div>
      </section>

      {/* Icon cards (kit 02) — 4-col then 1 dark */}
      <section className="mb-14">
        <div
          className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--ink-3)] pb-2.5 mb-4 border-b border-[var(--border)]"
          style={{ letterSpacing: '0.16em' }}
        >
          Features
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURES.filter((f) => !f.dark).map((f) => (
            <div
              key={f.title}
              className={`rounded-[var(--r-md)] p-5 flex flex-col gap-3.5 transition-all hover:shadow-[var(--sh-md)] ${
                f.accent
                  ? 'bg-[var(--ink)] hover:bg-[#222]'
                  : 'bg-[var(--bg-card)] hover:bg-[var(--bg-elev)]'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-[var(--r-sm)] flex items-center justify-center shrink-0 ${
                  f.accent ? 'bg-white/10' : 'bg-[var(--accent-bg)] text-[var(--accent)]'
                }`}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-[18px] h-[18px]">
                  <circle cx="8" cy="6" r="3" />
                  <line x1="8" y1="1" x2="8" y2="3" />
                  <line x1="8" y1="9" x2="8" y2="15" />
                </svg>
              </div>
              <div>
                <h4
                  className={`text-sm font-semibold leading-snug ${
                    f.accent ? 'text-white' : 'text-[var(--ink)]'
                  }`}
                >
                  {f.title}
                </h4>
                <p
                  className={`text-xs leading-relaxed mt-1 ${
                    f.accent ? 'text-[#555]' : 'text-[var(--ink-3)]'
                  }`}
                >
                  {f.description}
                </p>
              </div>
            </div>
          ))}
          {/* Dark card (Hub coordination) */}
          <div className="rounded-[var(--r-md)] p-5 flex flex-col gap-3.5 bg-[var(--ink)] hover:bg-[#222] transition-all hover:shadow-[var(--sh-md)]">
            <div className="w-10 h-10 rounded-[var(--r-sm)] flex items-center justify-center shrink-0 bg-white/10 text-[#888]">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-[18px] h-[18px]">
                <path d="M2 8 L8 2 L14 8 L8 14 Z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold leading-snug text-white">
                Hub coordination
              </h4>
              <p className="text-xs leading-relaxed mt-1 text-[#555]">
                Your harvest fits the network. No overplanting, no missed demand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use case — wide panel dark (kit 05) */}
      <section>
        <div
          className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--ink-3)] pb-2.5 mb-4 border-b border-[var(--border)]"
          style={{ letterSpacing: '0.16em' }}
        >
          Use case
        </div>
        <div className="rounded-[var(--r-md)] bg-[var(--ink)] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <h3
              className="text-lg sm:text-xl font-bold text-white mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              From single plot to regional network
            </h3>
            <p className="text-xs text-[#888] leading-relaxed mb-4">
              Data-driven recommendations · Live Nodal map · One form, one API
            </p>
            <ul className="space-y-1.5 text-xs text-[#666] leading-relaxed">
              <li>· Data-driven crop and quantity recommendations for your plot and soil</li>
              <li>· Replace guesswork with an optimization engine that fits hub and market demand</li>
              <li>· See your node on the live Nodal map alongside every farm and hub</li>
              <li>· Works for one farm or many—single plot, cooperative, or full region</li>
            </ul>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <a
              href="#learn"
              className="inline-flex items-center justify-center h-9 px-5 rounded-[var(--r-sm)] text-[13px] font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
            >
              Learn more
            </a>
            <a
              href="#register"
              className="inline-flex items-center justify-center h-9 px-4 rounded-[var(--r-sm)] text-[13px] font-semibold bg-white/10 text-[#888] hover:bg-white/15 transition-colors border-0"
            >
              Register your farm
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Homepage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      <ScrollExpandMedia
        mediaType="image"
        mediaSrc={HOMEPAGE_MEDIA.media}
        bgImageSrc={HOMEPAGE_MEDIA.background}
        title={HOMEPAGE_MEDIA.title}
        date={HOMEPAGE_MEDIA.date}
        scrollToExpand={HOMEPAGE_MEDIA.scrollToExpand}
        textBlend
      >
        <HomepageContent />
      </ScrollExpandMedia>
    </div>
  );
}
