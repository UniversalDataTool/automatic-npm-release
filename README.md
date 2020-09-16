# Automatic NPM Release

This cli allows you to quickly create a Github Actions workflow that will release your npm modules via the [semantic-release system](https://github.com/semantic-release/semantic-release).

## Usage

```
> npx automatic-npm-release

Creating .releaserc.js"...
Creating .github/workflows/release.yml...

Make sure to set NPM_TOKEN to "..." in your github repository

After merging this, your merges to master will automatically be published. Make sure to use the semantic versioning system in your commits. e.g. start a commit with "fix: ..." 
```
