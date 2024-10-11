import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";
import babel from "@rollup/plugin-babel";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import image from "@rollup/plugin-image";
import postcss from "rollup-plugin-postcss";
import typescript from "@rollup/plugin-typescript";
import svgr from "@svgr/rollup";

const packageJson = require("./package.json");

export default {
  input: "dev-server/index.js",
  output: {
    file: packageJson.main,
    format: "iife",
    sourcemap: true,
  },
  plugins: [
    image(),
    postcss({
      extensions: [".css"],
    }),
    nodeResolve({
      extensions: [".js"],
    }),
    replace({
      "process.env.NODE_ENV": JSON.stringify("development"),
    }),
    svgr(),
    typescript({ tsconfig: "./tsconfig.json" }),
    babel({
      presets: ["@babel/preset-react"],
    }),
    commonjs(),
    serve({
      open: true,
      verbose: true,
      contentBase: ["", "public"],
      host: "localhost",
      port: 3001,
    }),
    livereload({ watch: "dist" }),
  ],
};
