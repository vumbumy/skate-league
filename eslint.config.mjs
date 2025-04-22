// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // ★ @typescript-eslint/no-explicit-any 규칙을 끄기 위한 설정 추가
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn", // 'off' 로 설정하여 규칙 비활성화
      // 만약 에러 대신 경고로 바꾸고 싶다면 "warn"으로 설정
      // "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
