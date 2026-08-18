export const CINEFLOW_GEMINI_MODEL = process.env.CINEFLOW_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

export function getProviderStatus() {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  const parallelConfigured = Boolean(process.env.PARALLEL_API_KEY);

  return {
    gemini: geminiConfigured ? ('CONFIGURED' as const) : ('UNCONFIGURED' as const),
    parallel: parallelConfigured ? ('CONFIGURED' as const) : ('UNCONFIGURED' as const),
    model: CINEFLOW_GEMINI_MODEL
  };
}
