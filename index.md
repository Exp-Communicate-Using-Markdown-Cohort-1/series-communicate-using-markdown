# Name
Donoavn Kilpela 🐐
![Image of Yaktocat](https://octodex.github.com/images/yaktocat.png)

```yaml annotate
# The name of the workflow as it will appear in the "Actions" tab of the GitHub repository.
name: Post welcome comment
# The `on` keyword lets you define the events that trigger when the workflow is run.
on:
  # Add the `pull_request` event, so that the workflow runs automatically
  # every time a pull request is created.
  pull_request:
    types: [opened]
# Modifies the default permissions granted to `GITHUB_TOKEN`.
permissions:
  pull-requests: write
# Defines a job with the ID `build` that is stored within the `jobs` key.
jobs:
  build:
    name: Post welcome comment
    # Configures the operating system the job runs on.
    runs-on: ubuntu-latest
    # The `run` keyword tells the job to execute a command on the runner.
    steps:
      - run: gh pr comment $PR_URL --body "Welcome to the repository!"
        env:
          GH_TOKEN: $
          PR_URL: $
```

- [ ] Turn on GitHub Pages
- [ ] Outline my portfolio
- [ ] Introduce myself to the world
