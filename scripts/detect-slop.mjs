#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";

const DETECTOR = ".agents/skills/impeccable/scripts/detect.mjs";
const UI_EXTS = /\.(html?|css|jsx?|tsx?|vue|svelte)$/i;

function parseArgs(argv) {
  const opts = { base: null, paths: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--base") opts.base = argv[++i];
    else if (argv[i] === "--all") opts.paths.push(".");
    else opts.paths.push(argv[i]);
  }
  return opts;
}

function changedFiles(base) {
  const out = spawnSync("git", ["diff", "--name-only", `${base}...HEAD`], {
    encoding: "utf8",
  });
  if (out.status !== 0) {
    console.error(`git diff failed: ${out.stderr}`);
    process.exit(1);
  }
  return out.stdout
    .split("\n")
    .filter(Boolean)
    .filter((p) => UI_EXTS.test(p) && existsSync(p));
}

function runDetector(paths) {
  const res = spawnSync("node", [DETECTOR, "--json", "--no-advisory", ...paths], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  let findings = [];
  try {
    const start = res.stdout.indexOf("[");
    if (start !== -1) findings = JSON.parse(res.stdout.slice(start));
  } catch {
    console.error("Failed to parse detector output:\n" + res.stdout + res.stderr);
    process.exit(1);
  }
  return findings;
}

function emitAnnotations(findings) {
  for (const f of findings) {
    const file = relative(process.cwd(), resolve(f.file));
    const level = f.severity === "error" ? "error" : "warning";
    const title = `${f.name} (${f.antipattern})`;
    const message = f.snippet ? `${f.description} — "${f.snippet}"` : f.description;
    console.log(
      `::${level} file=${file},line=${f.line || 1},title=${title}::${message}`
    );
  }
}

const opts = parseArgs(process.argv.slice(2));
const targets = opts.base ? changedFiles(opts.base) : opts.paths;

if (targets.length === 0) {
  console.log("No UI files to scan.");
  process.exit(0);
}

console.log(`Scanning ${targets.length} file(s) for design slop...`);
const findings = runDetector(targets);
emitAnnotations(findings);

console.log(
  findings.length === 0
    ? "No design slop found."
    : `Found ${findings.length} issue(s).`
);
process.exit(findings.length > 0 ? 1 : 0);
