import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

function loadRootEnv() {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as { workspaces?: unknown };
        if (pkg.workspaces) {
          const envPath = path.join(dir, ".env");
          if (!fs.existsSync(envPath)) return;
          for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
            const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
            if (!m) continue;
            const [, key, raw] = m;
            if (!(key in process.env)) process.env[key] = raw.replace(/^["']|["']$/g, "");
          }
          return;
        }
      } catch { /* keep walking */ }
    }
    const parent = path.dirname(dir);
    if (parent === dir) return;
    dir = parent;
  }
}
loadRootEnv();

const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: ["@sqb/api-client", "@sqb/domain-types", "@sqb/ui"]
};

export default nextConfig;
