import type { DeliverableProject, DeliverableSource } from '@/types/domain';

const AGENT_MARKET_SOURCE: DeliverableSource = {
  title: 'Introducing NEAR AI Agent Market (NEAR AI blog)',
  url: 'https://near.ai/blog/introducing-near-ai-agent-market',
};

export const NEAR_AGENT_ECONOMY_PROJECTS: DeliverableProject[] = [
  {
    name: 'NEAR AI Agent Market',
    role: 'Marketplace where agents bid on posted jobs, execute them, and are paid in NEAR.',
    functions: [
      'Buyers post a task with a budget and requirements.',
      'Agents submit bids with a price and timeline, and the buyer picks one.',
      'Funds are held in escrow while the selected agent works.',
      'The agent submits its deliverable with a verification hash.',
      'A dispute agent reviews disagreements about delivered work.',
    ],
    strengths: [
      'Directly models the agent-to-agent job market this dossier is about.',
      'Escrow and dispute handling are built into the job flow.',
      'Announced compatibility with several agent frameworks lowers the barrier for agent builders.',
    ],
    weaknesses: [
      'Disputes are judged by an AI agent, so arbitration quality depends on that agent.',
      'The announcement describes features but publishes no volume, fee or completion data.',
    ],
    source: AGENT_MARKET_SOURCE,
  },
  {
    name: 'IronClaw',
    role: 'Always-on agent framework from NEAR AI for long-running autonomous work.',
    functions: [
      'Keeps persistent memory so agents can pick up work across sessions.',
      'Applies a guard to every action an agent takes.',
      'Recovers in-progress work after an interruption.',
    ],
    strengths: [
      'Persistent memory and interruption recovery suit multi-day jobs.',
      'A per-action guard supports safer autonomy than unrestricted tool use.',
    ],
    weaknesses: [
      'Benchmark leadership is claimed by the vendor, and this review did not reproduce those results.',
      'Long-running agents raise ongoing compute costs that the announcement does not quantify.',
    ],
    source: {
      title: 'Introducing IronClaw 1.0 (NEAR AI blog)',
      url: 'https://near.ai/blog/introducing-ironclaw-1-0',
    },
  },
  {
    name: 'OpenClaw on NEAR AI',
    role: 'Personal agent that runs on NEAR AI and can enter the Agent Market on a user’s behalf.',
    functions: [
      'Handles everyday digital tasks for its owner.',
      'Can be given a skill file that lets it post or take jobs on the Agent Market.',
    ],
    strengths: [
      'Gives non-developers a route into agent commerce.',
      'Connects personal intent to the marketplace without a separate integration.',
    ],
    weaknesses: [
      'Capability claims come from the vendor, and no independent task results were reviewed.',
      'Acting on a user’s behalf increases the impact of mistakes or misuse.',
    ],
    source: AGENT_MARKET_SOURCE,
  },
  {
    name: 'NEAR Intents',
    role: 'Intent-based protocol that routes cross-chain swaps from a stated outcome.',
    functions: [
      'Users describe the result they want instead of the exact transaction steps.',
      'The protocol handles routing and cross-chain liquidity.',
    ],
    strengths: [
      'Abstracts chain and liquidity details away from users and agents.',
      'Provides a settlement layer that agents can target for asset movement.',
    ],
    weaknesses: [
      'Execution depends on solvers and available liquidity.',
      'The vendor says natural-language intents are still being expanded beyond trading.',
    ],
    source: {
      title: 'NEAR Intents overview (NEAR Docs)',
      url: 'https://docs.near.org/chain-abstraction/intents/overview',
    },
  },
  {
    name: 'Shade Agents',
    role: 'Agent framework that runs inside trusted execution environments (TEEs) and uses NEAR Chain Signatures.',
    functions: [
      'Agents control accounts on several chains through chain signatures.',
      'Private keys are kept inside the TEE and are not exposed to operators.',
      'Agents can read off-chain data and use LLM-powered oracles.',
    ],
    strengths: [
      'Non-custodial design: the agent holds its own accounts without a single custodian.',
      'Multi-chain reach from one agent framework.',
    ],
    weaknesses: [
      'Trust rests on TEE hardware and attestation, which is a different trust model from on-chain verification.',
      'Developer tooling maturity was not assessed in this review.',
    ],
    source: {
      title: 'Shade Agents (Aurora Cloud Marketplace)',
      url: 'https://marketplace.auroracloud.dev/apps/shade-agents',
    },
  },
  {
    name: 'Mindshare Index AI Agent',
    role: 'Reference autonomous trading agent built on the Shade Agent stack.',
    functions: [
      'Pulls live mindshare data from a Kaito API feed.',
      'Makes trading decisions inside a TEE and settles through NEAR.',
    ],
    strengths: [
      'Concrete example of how a Shade Agent operates end to end.',
      'Uses live data rather than static inputs.',
    ],
    weaknesses: [
      'Autonomous trading carries market risk for any funds the agent controls.',
      'Depends on a single data provider for its core signal.',
    ],
    source: {
      title: 'Introducing the Mindshare Index AI Agent (NEAR blog)',
      url: 'https://www.near.org/blog/introducing-the-mindshare-index-ai-agent-autonomous-trading-powered-by-shade-agents',
    },
  },
  {
    name: 'NEAR AI Cloud confidential inference',
    role: 'Private model inference in TEEs, with attestation that the enclave ran as claimed.',
    functions: [
      'Runs model inference where the operator cannot read prompts.',
      'Pairs Intel TDX enclaves with Intel Trust Authority for independent attestation.',
    ],
    strengths: [
      'Verifiable privacy: the attestation can be checked without trusting the operator.',
      'Gives agent builders a private inference backend.',
    ],
    weaknesses: [
      'Security depends on the Intel TEE trust model and its update history.',
      'Pricing, latency and model choice were not benchmarked in this review.',
    ],
    source: {
      title: 'NEAR AI Cloud integrates Intel Trust Authority (NEAR AI blog)',
      url: 'https://near.ai/blog/near-ai-cloud-integrates-intel-trust-authority',
    },
  },
  {
    name: 'NEAR AI Staking',
    role: 'Staking program that funds private inference and always-on IronClaw agents.',
    functions: [
      'Holders stake NEAR to receive usage credits.',
      'Credits scale with the amount staked, with no credit card required.',
    ],
    strengths: [
      'Links token holders to the compute demand their stake supports.',
      'Lowers the entry cost for running agents.',
    ],
    weaknesses: [
      'Credit value depends on tokenomics that can change.',
      'Reward and lock-up terms were not reviewed in this dossier.',
    ],
    source: {
      title: 'Announcing Staking for NEAR AI (NEAR AI blog)',
      url: 'https://near.ai/blog/staking-for-near-ai',
    },
  },
  {
    name: 'OpenCode on private inference',
    role: 'Open-source coding agent connected to NEAR AI Cloud TEE inference.',
    functions: [
      'Runs open models inside a TEE with an attestation the user can verify.',
      'Connects in three setup steps described by the vendor.',
    ],
    strengths: [
      'Developers keep the coding tool they already use.',
      'Code stays inside a verifiable private inference environment.',
    ],
    weaknesses: [
      'Output quality depends on the open model the user selects.',
      'The setup flow was not tested independently.',
    ],
    source: {
      title: 'Pick your agent, then your model: OpenCode on private inference (NEAR AI blog)',
      url: 'https://near.ai/blog/opencode-private-inference',
    },
  },
  {
    name: 'Brave Leo on NEAR AI Cloud',
    role: 'Integration of NEAR AI private inference into the Brave Leo assistant.',
    functions: [
      'Routes Brave Leo requests to a private model with hardware-enforced enclaves.',
      'Offers an attestation that third parties can verify.',
    ],
    strengths: [
      'Shows a large browser distribution partner adopting private inference.',
      'Gives a repeatable pattern for third-party integrations.',
    ],
    weaknesses: [
      'It is an assistant integration, not an agent marketplace or job market.',
      'The evidence is a partner announcement rather than independent usage data.',
    ],
    source: {
      title: 'NEAR AI Cloud brings private inference to Brave Leo (NEAR AI blog)',
      url: 'https://near.ai/blog/near-ai-cloud-brings-private-inference-to-brave-leo',
    },
  },
];

export const NEAR_AGENT_ECONOMY_COMPARISON: string[] = [
  'Marketplace and execution layers (Agent Market, IronClaw, OpenClaw) are the closest to a working agent economy, but their evidence is mostly vendor-published.',
  'Trust and privacy layers (Shade Agents, NEAR AI Cloud, OpenCode, Brave Leo) compete on verifiable execution. Each depends on TEE attestation, so their trust assumptions are similar.',
  'Financial rails (NEAR Intents, NEAR AI Staking) move value for agents. Intents is the most mature rail on the evidence reviewed; staking terms need primary-source checks.',
  'Strongest overall fit for agent-to-agent jobs: NEAR AI Agent Market, because it combines bidding, escrow and disputes in one flow.',
];

export const NEAR_AGENT_ECONOMY_RECOMMENDATIONS: string[] = [
  'Pilot the Agent Market with a small, well-specified research job before routing larger budgets through it.',
  'Read the current escrow, fee and dispute terms from primary sources before treating any NEAR amount as committed.',
  'Check TEE attestation for any agent that will see sensitive briefs or hold keys.',
  'Ask for at least two independent data sources before relying on a research agent’s conclusions.',
  'Re-run this review in 30 days, because the projects and tokenomics are changing quickly.',
];
