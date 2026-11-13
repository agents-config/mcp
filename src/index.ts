import { defineCommand, runMain } from 'citty'
import pkg from '$/package.json' with { type: 'json' }

const main = defineCommand({
  meta: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
  },
  args: {
    global: {
      type: 'boolean',
      alias: 'g',
      description: 'Operate on global agent configuration (~/.agents/mcp.json)',
    },
    yes: {
      type: 'boolean',
      alias: 'y',
      description: 'Run non-interactively, accepting recommended defaults',
    },
    agents: {
      type: 'string',
      description: 'Comma-separated target agents to sync (e.g. cursor,vscode)',
    },
    dryRun: {
      type: 'boolean',
      description:
        'Simulate operations without writing changes to disk or state',
    },
  },
  run({ args }) {
    console.log(`${pkg.name} v${pkg.version}`)
  },
})

runMain(main)
