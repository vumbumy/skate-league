// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
// Import the Prettier plugin and recommended config
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended"; // ★ Prettier 플러그인 import

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"), // Next.js 및 TypeScript 기본 규칙 확장

  // 이전에 추가한 @typescript-eslint/no-explicit-any 규칙 비활성화 설정 (필요시 유지)
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // 'any' 타입 허용 (필요시 'warn' 등으로 변경)
      "eslint/no-unused-vars": "warn", // 사용되지 않는 변수는 경고로 표시 (에러로 하고 싶으면 "error")
      // @typescript-eslint 플러그인을 사용하면 보통 해당 플러그인의 no-unused-vars 규칙을 사용합니다.
      // "@typescript-eslint/no-unused-vars": "warn",
    },
  },

  // ★ Prettier 플러그인 및 추천 설정 추가
  // eslint-plugin-prettier/recommended는 eslint-config-prettier 설정도 함께 포함합니다.
  eslintPluginPrettierRecommended,

  // 필요하다면 추가적인 ESLint 규칙이나 설정을 여기에 추가
];

export default eslintConfig;
