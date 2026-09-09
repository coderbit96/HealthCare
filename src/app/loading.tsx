export default function Loading() {
  return (
    <main className="grid min-h-[60vh] place-items-center bg-canvas px-5" aria-busy="true" aria-live="polite">
      <div className="flex max-w-xs flex-col items-center text-center">
        <div className="relative grid size-20 place-items-center">
          <span className="absolute inset-0 rounded-[1.75rem] bg-brand-soft motion-safe:animate-ping" aria-hidden="true" />
          <div className="relative grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-bright to-brand-strong text-white shadow-xl shadow-brand/25">
            <svg className="size-9" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M24 38S9 29.7 9 17.7C9 12.3 12.8 9 17.5 9c2.8 0 5.2 1.3 6.5 3.5C25.3 10.3 27.7 9 30.5 9 35.2 9 39 12.3 39 17.7 39 29.7 24 38 24 38Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14.5 23.5h5.7l2.5-4.3 3.5 8 2.4-3.7h5" stroke="#A7FFF2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="absolute -right-1 -top-1 size-5 rounded-full border-[3px] border-canvas border-t-accent border-r-accent border-b-transparent border-l-transparent motion-safe:animate-spin" aria-hidden="true" />
        </div>
        <p className="mt-7 font-display text-2xl font-semibold text-ink">Preparing your care experience</p>
        <p className="mt-2 text-sm leading-6 text-ink-muted">Just a moment while we get everything ready for you.</p>
        <span className="mt-6 h-1 w-32 overflow-hidden rounded-full bg-brand-soft" aria-hidden="true"><span className="block h-full w-1/2 rounded-full bg-gradient-to-r from-brand to-brand-bright motion-safe:animate-pulse" /></span>
        <span className="sr-only">Loading page content</span>
      </div>
    </main>
  );
}
