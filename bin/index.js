#!/usr/bin/env node

const chalk = require("chalk")
const boxen = require("boxen")
const Confirm = require("prompt-confirm")
const opn = require("opn")
const getReleaseYml = require("../src/get-release-yml.js")
const getReleaseRc = require("../src/get-release-rc.js")

const greeting = chalk.white.bold(`automatic-npm-release
version: ${require("../package.json").version}`)

const boxenOptions = {
  padding: 1,
  margin: 1,
  borderStyle: "round",
  borderColor: "green",
}
boxen(greeting, boxenOptions)

const path = require("path")
const fs = require("fs")
const { spawnSync } = require("child_process")

const destinationPath = process.cwd()

const installSemanticRelease = () => {
  return new Promise((resolve, reject) => {
    console.log(chalk`Installing {blue.bold @semantic-release/git} ...`)
    try {
      let spawnArgs
      if (fs.existsSync(path.resolve(destinationPath, "yarn.lock"))) {
        spawnArgs = ["yarn", ["add", "--dev", "@semantic-release/git"]]
      } else {
        spawnArgs = ["npm", ["install", "--save-dev", "@semantic-release/git"]]
      }
      spawnSync(...spawnArgs, {
        cwd: destinationPath,
        stdio: "inherit",
        shell: true,
      })
    } catch (err) {
      console.log("Error installing @semantic-release/git")
      console.log(chalk`Error installing {red.bold @semantic-release/git}`)
      console.error(err)
      return reject(err)
    }
    console.log(chalk`{green.bold @semantic-release/git} installed !`)
    console.log()
    return resolve()
  })
}

const installReleaseRc = (destinationPath) => {
  return new Promise((resolve, reject) => {
    console.log(chalk`Creating {blue.bold .releaserc.js} file ...`)
    const destinationReleasercPath = path.join(
      destinationPath,
      "/.releaserc.js"
    )
    const content = getReleaseRc()
    try {
      fs.writeFileSync(destinationReleasercPath, content)
    } catch (e) {
      console.log(chalk`Error creating {red.bold .releaserc.js} file !`)
      reject(e)
    }
    console.log(chalk`{green.bold .releaserc.js} file created !`)
    resolve()
  })
}

const installReleaseYML = (destinationPath) => {
  return new Promise((resolve, reject) => {
    let packageJSON
    try {
      packageJSON = JSON.parse(
        fs.readFileSync(path.join(destinationPath, "package.json"))
      )
    } catch (e) {
      return reject(e)
    }
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

    const sourceReleaseYML = getReleaseYml({
      testsOn: Boolean(packageJSON.scripts.test),
      buildsOn: Boolean(packageJSON.scripts.build),
    })

    if (!fs.existsSync(destinationGithubFolder)) {
      fs.mkdirSync(destinationGithubFolder)
    }

    if (!fs.existsSync(destinationWorkflowsFolder)) {
      fs.mkdirSync(destinationWorkflowsFolder)
    }

    fs.writeFileSync(destinationReleaseYMLPath, sourceReleaseYML)

    console.log(
      chalk`{green.bold .github/workflows/release.yml} file created !`
    )

    return resolve()
  })
}

const generateNPMToken = async () => {
  if (
    await new Confirm(
      "Do you want to generate an npm token now? (using `npm token create`) You'll need to add a token to Github"
    ).run()
  ) {
    spawnSync("npm", ["token", "create"], {
      stdio: "inherit",
      shell: true,
    })
  }
}

const openGithubSecretsPage = async () => {
  const packageJSON = JSON.parse(
    fs.readFileSync(path.resolve(destinationPath, "package.json"))
  )
  if (!packageJSON.repository) return
  const repoUrl =
    typeof packageJSON.repository === "string"
      ? packageJSON.repository
      : packageJSON.repository.url

  let repo
  if (repoUrl.includes("github.com")) {
    repo = repoUrl.match(/github.com\/([a-zA-Z0-9-]+\/[a-zA-Z0-9-]+)/)[1]
  } else if (repoUrl.includes("github:")) {
    repo = repoUrl.match(/github:([a-zA-Z0-9/-]+)/)[1]
  }
  if (repo && (await new Confirm("Open your github secrets page?").run())) {
    opn(`https://github.com/${repo}/settings/secrets/new`)
  }
}

async function main() {
  await installSemanticRelease(destinationPath)
  await installReleaseYML(destinationPath)
  await installReleaseRc(destinationPath)
  await generateNPMToken().catch((e) => {
    console.log(e.toString())
  })
  await openGithubSecretsPage().catch((e) => {
    console.log(e.toString())
  })
  console.log(chalk`After merging this, your merges to master will automatically be published.
  Make sure to use the semantic versioning system in your commits.
  e.g. start a commit with "fix: ..."`)
  console.log(
    chalk`Make sure to set {bold NPM_TOKEN} in your github repository secrets !`
  )
}

main().catch((e) => {
  console.log(`Installation failed with error: ${e.toString()}`)
  process.exit(1)
})
