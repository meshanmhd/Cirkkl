import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["@supabase/*"],
              message: "Direct imports from @supabase/* are restricted outside of utils/supabase and lib/auth.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "utils/supabase/**",
      "lib/auth/**",
      "**/utils/supabase/**",
      "**/lib/auth/**",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
]);

export default eslintConfig;
