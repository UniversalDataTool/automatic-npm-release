#!/usr/bin/env node

const chalk = require("chalk")
const boxen = require("boxen")
const child_process = require("child_process")
const Confirm = require("prompt-confirm")

const greeting = chalk.white.bold(`automatic-npm-release
version: 1.0.0`)

const boxenOptions = {
  padding: 1,
  margin: 1,
  borderStyle: "round",
  borderColor: "green",
}
const msgBox = boxen(greeting, boxenOptions)

const path = require("path")
const fs = require("fs")
const { exec } = require("child_process")

const destinationPath = process.cwd()

const installSemanticRelease = () => {
  return new Promise((resolve, reject) => {
    console.log(chalk`Installing {blue.bold @semantic-release/git} ...`)
    exec(
      "yarn add --dev @semantic-release/git",
      { cwd: destinationPath },
      (err, stdout, stderr) => {
        if (err) {
          console.log("Error installing @semantic-release/git")
          console.log(chalk`Error installing {red.bold @semantic-release/git}`)
          console.error(err)
          return reject(err)
        }
        console.log(chalk`{green.bold @semantic-release/git} installed !`)
        console.log()
        return resolve()
      }
    )
  })
}

const copyReleaseRc = (destinationPath) => {
  return new Promise((resolve, reject) => {
    console.log(chalk`Creating {blue.bold .releaserc.js} file ...`)
    const destinationReleasercPath = path.join(destinationPath, "/releaserc.js")
    const sourceReleasercPath = path.join(
      path.dirname(fs.realpathSync(__filename)),
      "../.releaserc.js"
    )
    fs.copyFile(sourceReleasercPath, destinationReleasercPath, (err) => {
      if (err) {
        console.log(chalk`Error creating {red.bold .releaserc.js} file !`)
        return reject(err)
      }
      console.log(chalk`{green.bold .releaserc.js} file created !`)
      console.log()
      return resolve()
    })
  })
}

const copyReleaseYML = (destinationPath) => {
  return new Promise((resolve, reject) => {
    console.log(
      chalk`Creating {blue.bold .github/workflows/release.yml} file ...`
    )
    const destinationReleaseYMLPath = path.join(
      destinationPath,
      "/.github/workflows/release.yml"
    )
    const destinationGithubFolder = path.join(destinationPath, "/.github")
    const destinationWorkflowsFolder = path.join(
      destinationPath,
      "/.github/workflows"
    )
    const sourceReleaseYMLPath = path.join(
      path.dirname(fs.realpathSync(__filename)),
      "../.github/workflows/release.yml"
    )

    if (!fs.existsSync(destinationGithubFolder)) {
      fs.mkdirSync(destinationGithubFolder)
    }

    if (!fs.existsSync(destinationWorkflowsFolder)) {
      fs.mkdirSync(destinationWorkflowsFolder)
    }

    fs.copyFile(sourceReleaseYMLPath, destinationReleaseYMLPath, (err) => {
      if (err) {
        console.log(
          chalk`Error creating {red.bold .github/workflows/release.yml} file !`
        )
        return reject(err)
      }
      console.log(
        chalk`{green.bold .github/workflows/release.yml} file created !`
      )
      console.log()
      return resolve()
    })
  })
}

const generateNPMToken = async () => {
  if (
    await new Confirm(
      "Do you want to generate an npm token now? (using `npm create token`)"
    ).run()
  ) {
    child_process.spawn("npm", ["create", "token"], {
      stdio: "inherit",
      shell: true,
    })
  }
}

async function main() {
  await installSemanticRelease(destinationPath)
  await copyReleaseYML(destinationPath)
  console.log(chalk`After merging this, your merges to master will automatically be published.
  Make sure to use the semantic versioning system in your commits.
  e.g. start a commit with "fix: ..."`)
  console.log(
    chalk`Make sure to set {bold NPM_TOKEN} in your github repository secrets !`
  )
  await generateNPMToken()
}

main().catch((e) => {
  console.log(`Installation failed with error: ${e.toString()}`)
  process.exit(1)
})
