# github commit counter

This is a simple project that counts the number of commits made by a user in a github repository with the help of the basic Github crawler (yes, we don't need API key etc). Then it displays the number of commits made by the user in a year and the percentage of the target commits made by the user in that year with SVG format.

## Use Case

You can display in your github profile the commit progress with target commit count for a year.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Endpoint

`https://{YOUR_VERCEL_APP}.vercel.app/api/github-progress?username={YOUR_GITHUB_USERNAME}&year={TARGET_YEAR}&target={TARGET_COMMIT_COUNT}`

## Example
`![2024 Goals (Commits)](https://github-commit-counter.vercel.app/api/github-progress?username=relliv&year=2024&target=15000)`

## Preview

![2024 Goals (Commits)](https://github-commit-counter.vercel.app/api/github-progress?username=relliv&year=2024&target=15000)