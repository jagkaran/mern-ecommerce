#!/usr/bin/env node
/**
 * SDLC Orchestrator -- mern-ecommerce
 * Runs all agents in order: security → dev → quality → test → coverage → perf → critic → readme
 * Critical agents abort the pipeline on failure; non-critical agents log and continue.
 */

"use strict";
const { execSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const AGENTS = [
  { name: "security",  file: "security-agent.js",  critical: true  },
  { name: "dev",       file: "dev-agent.js",        critical: true  },
  { name: "quality",   file: "quality-agent.js",    critical: false },
  { name: "test",      file: "test-agent.js",       critical: true  },
  { name: "coverage",  file: "coverage-agent.js",   critical: false },
  { name: "perf",      file: "perf-agent.js",       critical: false },
  { name: "critic",    file: "critic-agent.js",     critical: false },
  { name: "readme",    file: "readme-agent.js",     critical: false },
];

// Allow selective run: node orchestrator.js --agents=security,test,critic
const args = process.argv.slice(2);
const filterArg = args.find((a) => a.startsWith("--agents="));
const selected  = filterArg ? filterArg.split("=")[1].split(",") : null;
const agents    = selected ? AGENTS.filter((a) => selected.includes(a.name)) : AGENTS;

console.log("\n🚀  SDLC Orchestrator starting");
console.log("   Agents to run: " + agents.map((a) => a.name).join(" → ") + "\n");

const results = [];

for (const agent of agents) {
  const agentPath = path.join(__dirname, agent.file);
  console.log(`⏳  Running [${agent.name}] ...`);
  const start = Date.now();
  try {
    execSync(`node "${agentPath}"`, { cwd: ROOT, stdio: "inherit" });
    const ms = Date.now() - start;
    console.log(`\n✅  [${agent.name}] passed (${ms}ms)\n`);
    results.push({ name: agent.name, status: "✅", ms });
  } catch (_e) {
    const ms = Date.now() - start;
    if (agent.critical) {
      console.error(`\n❌  [${agent.name}] FAILED (${ms}ms)`);
      console.error("   ⛔  Critical agent failed — aborting pipeline.\n");
      results.push({ name: agent.name, status: "❌", ms });
      printSummary(results);
      process.exit(1);
    } else {
      console.warn(`\n❌  [${agent.name}] FAILED (${ms}ms)`);
      console.warn("   ⚠️  Non-critical — continuing...\n");
      results.push({ name: agent.name, status: "❌", ms });
    }
  }
}

printSummary(results);

function printSummary(res) {
  console.log("\n─────────────────────────────────────────");
  console.log("  SDLC Pipeline Summary");
  console.log("─────────────────────────────────────────");
  for (const r of res) {
    console.log(`  ${r.status}  ${r.name.padEnd(12)} ${r.ms}ms`);
  }
  console.log("─────────────────────────────────────────\n");
}
