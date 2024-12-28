import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import terser from "@rollup/plugin-terser";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import sourcemaps from "rollup-plugin-sourcemaps";
import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";
import copy from "rollup-plugin-copy";
import postcss from "rollup-plugin-postcss";
import babel from "@rollup/plugin-babel";
import svgr from "@svgr/rollup";
import image from "@rollup/plugin-image";

const packageJson = require("./package.json");

export default function (arg) {
  const { watch } = arg;
  const isEnvDevelopment = watch;
  const isEnvProduction = !watch;
  const inputPath = isEnvProduction
    ? "src/index.ts"
    : isEnvDevelopment && "dev/index.js";

  const outputPath = isEnvProduction
    ? [
        {
          file: packageJson.main,
          format: "cjs",
          sourcemap: false,
          name: packageJson.name,
        },
        // {
        //   file: packageJson.module,
        //   format: "esm",
        //   sourcemap: false,
        // },
      ]
    : {
        file: packageJson.main,
        format: "iife",
        sourcemap: false,
        name: packageJson.name,
      };

  const watchConfigmaybe = isEnvProduction
    ? {}
    : {
        watch: {
          clearScreen: false, // Don't clear the console on rebuild
        },
      };

  const extrnalMaybe = isEnvProduction
    ? { external: ["react", "react-dom"] }
    : {};

  const getPlugins = () => {
    const plugins = [
      peerDepsExternal(),
      image(),
      postcss(),
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      svgr(),
      isEnvDevelopment && sourcemaps(), // Source maps only in development
      isEnvProduction && terser(), // Minify for production
      isEnvDevelopment &&
        serve({
          open: true,
          verbose: true,
          contentBase: ["", "public"],
          host: "localhost",
          port: 3001,
        }),
      isEnvDevelopment &&
        livereload({
          watch: "dist", // Watch the 'dist' folder for live reload
        }),
      isEnvDevelopment &&
        copy({
          targets: [
            { src: "dev/index.html", dest: "dist" }, // Copy index.html to dist
          ],
          verbose: true, // Optional: Logs the copy operation
        }),
      isEnvDevelopment &&
        babel({
          babelHelpers: "bundled",
          presets: ["@babel/preset-react", "@babel/preset-env"],
          exclude: "node_modules/**", // Exclude node_modules from transpiling
          extensions: [".js", ".jsx", ".ts", ".tsx"], // Transpile these file types
        }),
    ].filter(Boolean);
    return plugins;
  };

  const baseConfig = {
    input: inputPath,
    output: outputPath,
    plugins: getPlugins(),
    ...extrnalMaybe,
    ...watchConfigmaybe,
  };
  const config = isEnvProduction
    ? [
        baseConfig,
        // {
        //   input: inputPath,
        //   output: [{ file: packageJson.types }],
        //   plugins: [dts.default()],
        //   external: [/\.css$/],
        // },
      ]
    : baseConfig;

  return config;
}
