// scripts/postinstall.js
const { existsSync } = require("fs");
const { spawnSync } = require("child_process");

// Solo corre prisma generate si existe prisma/schema.prisma
if (existsSync("./prisma/schema.prisma")) {
  const res = spawnSync("npx", ["-y", "prisma", "generate"], { stdio: "inherit" });
  process.exit(res.status ?? 0);
} else {
  console.log("Skipping prisma generate (no prisma/schema.prisma here).");
}
