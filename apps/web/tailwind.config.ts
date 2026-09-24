import type { Config } from "tailwindcss";

/**
 * Tailwind is used ONLY for layout/spacing gaps in HireX — never to override
 * Cloudscape component internals (see docs/ENGINEERING_GUIDELINES.md §11).
 *
 * - `preflight` is disabled so Tailwind's CSS reset does not fight Cloudscape's
 *   own global styles / design tokens.
 * - Utilities are namespaced with the `tw-` prefix so it is always obvious in
 *   markup which classes are ours vs. Cloudscape's, and so we cannot
 *   accidentally clobber a Cloudscape class name.
 */
const config: Config = {
  prefix: "tw-",
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
