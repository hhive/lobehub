---
name: using-superpowers
description: Use when starting a conversation or when any skill may apply - ensures the agent checks and uses the most relevant superpowers skill before answering
---

# Using Superpowers

Use this skill to decide whether another superpowers skill should be used first.

## Core rule

If there is a reasonable chance that a task should use `brainstorming`, `writing-plans`, `executing-plans`, or `using-git-worktrees`, activate that skill before taking action or answering.

## Priority

1. Process skills first, such as brainstorming or execution workflow.
2. Then implementation workflow skills.
3. User instructions always win when they conflict.

## Notes

- Check for a skill before clarifying questions when the task might benefit from one.
- If no superpowers skill fits, continue normally.
