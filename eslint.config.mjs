import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    ".next/**",
    ".next.preclean-*/**",
    ".debug-journal.md",
    ".preview-logs/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
]);
