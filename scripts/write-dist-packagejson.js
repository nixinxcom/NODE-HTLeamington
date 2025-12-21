// scripts/write-dist-packagejson.js
const fs = require("fs");
const path = require("path");

const rootPkg = require("../package.json");

const distDir = path.join(process.cwd(), "dist");
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

// Ajusta aquí lo que realmente usa tu runtime en el NX
const pkg = {
  name: rootPkg.name,
  version: rootPkg.version,
  private: false,
  publishConfig: rootPkg.publishConfig,

  main: "./index.js",
  types: "./index.d.ts",

  exports: {
    ".": {
      types: "./index.d.ts",
      import: "./index.js",
      require: "./index.js",
      default: "./index.js",
    },
    "./styles/core-globals.css": "./app/globals.css",
  },

  sideEffects: ["**/*.css"],

  // CLAVE: el host (NX) aporta estas versiones, NO el core
  peerDependencies: {
    next: rootPkg.dependencies.next,
    react: rootPkg.dependencies.react,
    "react-dom": rootPkg.dependencies["react-dom"],
  },

  // Runtime real que sí debe instalar el NX (ajusta si algo no aplica)
  dependencies: {
    clsx: rootPkg.dependencies.clsx,
    "class-variance-authority": rootPkg.dependencies["class-variance-authority"],
    "lucide-react": rootPkg.dependencies["lucide-react"],
    "tailwind-merge": rootPkg.dependencies["tailwind-merge"],
    "tailwindcss-animate": rootPkg.dependencies["tailwindcss-animate"],
    "react-intl": rootPkg.dependencies["react-intl"],
    firebase: rootPkg.dependencies.firebase,

    // pagos/client:
    "@stripe/stripe-js": rootPkg.dependencies["@stripe/stripe-js"],
    "@paypal/react-paypal-js": rootPkg.dependencies["@paypal/react-paypal-js"],

    // si los usas en UI:
    "react-player": rootPkg.dependencies["react-player"],
    "react-share": rootPkg.dependencies["react-share"],
    "react-social-icons": rootPkg.dependencies["react-social-icons"],
    "mapbox-gl": rootPkg.dependencies["mapbox-gl"],
  },

  // Evita forzar al NX a instalar server libs si no las usa
  optionalDependencies: {
    // server-only / tools
    openai: rootPkg.dependencies.openai,
    ai: rootPkg.dependencies.ai,
    stripe: rootPkg.dependencies.stripe,
    "firebase-admin": rootPkg.dependencies["firebase-admin"],
    "firebase-functions": rootPkg.dependencies["firebase-functions"],
    googleapis: rootPkg.dependencies.googleapis,
    undici: rootPkg.dependencies.undici,
    "@capacitor/core": rootPkg.dependencies["@capacitor/core"],
  },

  engines: rootPkg.engines,
};

fs.writeFileSync(path.join(distDir, "package.json"), JSON.stringify(pkg, null, 2));
console.log("dist/package.json written");
