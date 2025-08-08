# 🛠️ GitHub Repo Template

Welcome to the Template Repository on GitHub! This repository is designed to serve as a starting point for creating new Git repositories with best practices and configurations already set up. Below is a brief overview of the structure and the purpose of each file and directory in this repository.

## 📁 Repository Structure

```text
.
├── .editorconfig                       # 🖊️ Configuration for consistent coding styles
├── .github                             # 🛠️ GitHub-specific configurations
│   ├── ISSUE_TEMPLATE                  # 📝 GitHub issue template
│   │   └── issue_template.md           # 📝 Issue template file
│   ├── dependabot.yml                  # 🤖 Dependabot configuration
│   ├── pull_request_template.md        # 📝 Pull request template
│   └── workflows                       # ⚙️ GitHub Actions workflows
│       ├── deps-review.yaml            # 📋 Dependency review workflow
│       ├── lint-pr.yaml                # 🧹 Linting workflow for pull requests
│       ├── pre-commit-auto-update.yaml # 🔄 Pre-commit hook auto-update workflow
│       ├── release.yaml                # 🚀 Release workflow
│       ├── stale.yaml                  # ⏳ Stale issue management workflow
│       └── template-repo-sync.yaml     # 🔄 Template repository sync workflow
├── .gitignore                          # 🚫 Files and directories to be ignored by Git
├── .pre-commit-config.yaml             # 🛠️ Pre-commit hooks configuration
├── .releaserc.json                     # 🚀 Semantic release configuration
├── .vscode                             # 🖥️ VSCode-specific configurations
│   └── extensions.json                 # 🛠️ Recommended extensions for VSCode
├── CHANGELOG.md                        # 📝 Change log of the project
├── CODEOWNERS                          # 👥 Defines the code owners for the repository
├── LICENSE                             # ⚖️ License for the project
└── README.md                           # 📖 Project documentation (this file)
```
## ⚙️ Semantic Commit Messages
This project uses [Semantic Commit Messages](https://www.conventionalcommits.org/) to ensure meaningful and consistent commit history. The format is as follows:

```php
<type>(<scope>): <subject>
```

### Types

- `feat`: A new feature (e.g., `feat: add login functionality`).
- `fix`: A bug fix (e.g., `fix: resolve login button issue`).
- `docs`: Documentation changes (e.g., `docs: update API documentation`).
- `style`: Code style changes (formatting, missing semi-colons, etc.) without changing logic (e.g., `style: fix indentation`).
- `refactor`: Code changes that neither fix a bug nor add a feature (e.g., `refactor: update user controller structure`).
- `test`: Adding or updating tests (e.g., `test: add unit tests for login service`).
- `chore`: Changes to build process, auxiliary tools, or libraries (e.g., `chore: update dependencies`).

### Scope

Optional: The part of the codebase affected by the change (e.g., `feat(auth): add OAuth support`)

### Subject

A brief description of the change, using the imperative mood (e.g., `fix: resolve issue with user authentication`).

## 🚀 Semantic Release

This project is configured with [Semantic Release](https://semantic-release.gitbook.io/semantic-release) to automate the release process based on your commit messages.

### How It Works

1. Analyze commits: Semantic Release inspects commit messages to determine the type of changes in the codebase.
2. Generate release version: Based on the commit type, it will automatically bump the version following semantic versioning:
- fix → Patch release (e.g., 1.0.1)
- feat → Minor release (e.g., 1.1.0)
- BREAKING CHANGE → Major release (e.g., 2.0.0)
3. Create release notes: It generates a changelog from the commit messages and includes it in the release.
4. Publish: It automatically publishes the new version to the repository (and any other configured registries, e.g., npm).

## 🤝 Contributing

If you find any issues or have suggestions for improving this template repository, please feel free to open an issue or submit a pull request. Contributions are always welcome!

## 📜 License

This repository is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
