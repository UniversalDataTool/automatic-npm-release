module.exports = ({ testsOn = false, buildsOn = false } = {}) =>
  `
name: Release
on:
  push:
    branches:
      - master
      - "releasetest/**"
jobs:
  release:
    if: "!contains(github.event.head_commit.message, 'skip ci')"
    name: Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v1
      - name: Setup Node.js
        uses: actions/setup-node@v1
        with:
          node-version: 12
      - name: Install dependencies
        run: npm install${
          buildsOn
            ? `\n
      - name: Build
        run: npm run build`
            : ""
        }${
    testsOn
      ? `\n
      - name: Run Tests
        run: npm run test`
      : ""
  }
      - name: Release
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: \${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
`.trim()
