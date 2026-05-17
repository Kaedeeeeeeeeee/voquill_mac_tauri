#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const tauriArgs = process.argv.slice(2);

run("tauri", tauriArgs, process.env);

function run(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env,
    shell: true,
  });

  if (result.status !== 0) {
    const rendered = [command, ...args].join(" ");
    process.stderr.write(
      `[tauri-sidecar] Command failed (${result.status ?? "unknown"}): ${rendered}\n`,
    );
    process.exit(result.status ?? 1);
  }
}
