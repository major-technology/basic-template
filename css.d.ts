// Next declares `*.module.css` only. Plain stylesheet side-effect imports need
// their own ambient module or TypeScript 7 rejects them (TS2882).
declare module "*.css";
