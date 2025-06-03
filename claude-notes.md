# Claude Code Session Notes

## Session Information
- Start commit: 5ae9180 Initial commit
- Session commits: (will be tracked here)
- Current model: Opus 4/Sonnet 4 (Default model setting)

## Current Feature: ZK-Tweet Whistleblowing Platform
- Status: Step 1 - Requirements Gathering
- Progress: Understanding requirements for Twitter-based whistleblowing service

## App Requirements (from LessWrong post)
- **Core**: Anonymous posting to Twitter bots for companies/organizations
- **Verification**: Zero-knowledge proofs using email domains (ZK Email technology)
- **Target users**: Employees/members who want to whistleblow or share gossip safely
- **Key flows**: 
  1. Prove ownership of company email without revealing identity
  2. Post anonymously to company-specific Twitter bot
  3. Moderation system to prevent abuse
- **MVP goal**: Build trust through regular "gossip" use, enable safe whistleblowing

## Verification Method: GitHub SSH Keys
- **Chosen approach**: Ring signatures using GitHub SSH keys
- **How it works**: Prove ownership of one SSH key from a defined group (e.g., company repo contributors) without revealing which specific key
- **Target groups**: Repository contributors, organization members

## Next Steps
1. Remove template instructions from CLAUDE.md
2. Plan MVP implementation architecture
3. Research GitHub SSH key ring signature libraries
4. Implement core ZK verification and posting system

## Context
- Building on existing ZK Email / Proof of Organization concepts
- Need to balance convenience vs privacy
- Moderation system needed to prevent bot bans