import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import plugin from "tailwindcss/plugin";

/**
 * Theme-aware palette. The app is written with literal `zinc-*` / `text-white` / `text-indigo-300`
 * classes for the dark theme; these shades are routed through CSS variables so `html.light`
 * can flip them without touching every component.
 */
const ZINC = {
  50: "250 250 250",
  100: "244 244 245",
  200: "228 228 231",
  300: "212 212 216",
  400: "161 161 170",
  500: "113 113 122",
  600: "82 82 91",
  700: "63 63 70",
  800: "39 39 42",
  900: "24 24 27",
  950: "9 9 11",
} as const;

/** Accent hues whose light-on-dark text shades (200/300/400) need darkening on a light surface. */
const ACCENTS = {
  indigo: { 200: "199 210 254", 300: "165 180 252", 400: "129 140 248", 600: "79 70 229", 700: "67 56 202", 800: "55 48 163" },
  emerald: { 200: "167 243 208", 300: "110 231 183", 400: "52 211 153", 600: "5 150 105", 700: "4 120 87", 800: "6 95 70" },
  amber: { 200: "253 230 138", 300: "252 211 77", 400: "251 191 36", 600: "217 119 6", 700: "180 83 9", 800: "146 64 14" },
  red: { 200: "254 202 202", 300: "252 165 165", 400: "248 113 113", 600: "220 38 38", 700: "185 28 28", 800: "153 27 27" },
  sky: { 200: "186 230 253", 300: "125 211 252", 400: "56 189 248", 600: "2 132 199", 700: "3 105 161", 800: "7 89 133" },
  fuchsia: { 200: "245 208 254", 300: "240 171 252", 400: "232 121 249", 600: "192 38 211", 700: "162 28 175", 800: "134 25 143" },
  pink: { 200: "251 207 232", 300: "249 168 212", 400: "244 114 182", 600: "219 39 119", 700: "190 24 93", 800: "157 23 77" },
  orange: { 200: "254 215 170", 300: "253 186 116", 400: "251 146 60", 600: "234 88 12", 700: "194 65 12", 800: "154 52 18" },
  cyan: { 200: "165 243 252", 300: "103 232 249", 400: "34 211 238", 600: "8 145 178", 700: "14 116 144", 800: "21 94 117" },
  violet: { 200: "221 214 254", 300: "196 181 253", 400: "167 139 250", 600: "124 58 237", 700: "109 40 217", 800: "91 33 182" },
} as const;

const SHADE_FLIP = { 200: 800, 300: 700, 400: 600 } as const;
const ZINC_STEPS = Object.keys(ZINC).map(Number) as (keyof typeof ZINC)[];

const withAlpha = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const accentColors = Object.fromEntries(
  Object.keys(ACCENTS).map((hue) => [
    hue,
    Object.fromEntries(([200, 300, 400] as const).map((s) => [s, withAlpha(`--${hue}-${s}`)])),
  ]),
);

const themeVars = plugin(({ addBase }) => {
  const dark: Record<string, string> = { "--c-white": "255 255 255" };
  const light: Record<string, string> = { "--c-white": "9 9 11" };

  for (const step of ZINC_STEPS) {
    dark[`--zinc-${step}`] = ZINC[step];
    // Invert the scale: 50↔950, 100↔900, … 500 stays.
    light[`--zinc-${step}`] = ZINC[(1000 - step) as keyof typeof ZINC];
  }

  for (const [hue, shades] of Object.entries(ACCENTS)) {
    for (const s of [200, 300, 400] as const) {
      dark[`--${hue}-${s}`] = shades[s];
      light[`--${hue}-${s}`] = shades[SHADE_FLIP[s] as keyof typeof shades];
    }
  }

  addBase({ ":root": dark, "html.light": light });
});

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        white: withAlpha("--c-white"),
        zinc: Object.fromEntries(ZINC_STEPS.map((s) => [s, withAlpha(`--zinc-${s}`)])),
        ...accentColors,
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both",
        float: "float 5s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.6s cubic-bezier(0.2, 0.6, 0.4, 1) infinite",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [animate, themeVars],
};

export default config;
