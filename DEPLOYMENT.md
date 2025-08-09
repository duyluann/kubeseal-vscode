# Deployment Guide

This document explains how to set up automatic deployment and publishing of the Kubeseal VSCode extension using semantic-release.

## GitHub Actions Workflow

### Release and Publish Extension (`release.yaml`)

This single workflow automatically handles:
- ✅ **Builds the extension** using TypeScript
- ✅ **Packages the extension** into VSIX format
- ✅ **Uses semantic-release** for automatic versioning
- ✅ **Creates GitHub releases** with changelog
- ✅ **Uploads VSIX files** to GitHub releases
- ✅ **Publishes to VS Code Marketplace** (if PAT configured)
- ✅ **Provides detailed notifications** with links

**Triggers:**
- Manual dispatch (from GitHub Actions tab)
- Push to `main` branch

## Semantic Versioning

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) for automatic versioning based on commit messages.

### Commit Message Format

Use conventional commit messages to trigger automatic releases:

```bash
# Patch release (0.1.0 -> 0.1.1)
git commit -m "fix: resolve login button issue"

# Minor release (0.1.0 -> 0.2.0)
git commit -m "feat: add new encryption feature"

# Major release (1.0.0 -> 2.0.0)
git commit -m "feat!: breaking change in API"
git commit -m "BREAKING CHANGE: new API structure"
```

### Commit Types

- `feat`: New feature (minor version bump)
- `fix`: Bug fix (patch version bump)
- `docs`: Documentation changes (no version bump)
- `style`: Code style changes (no version bump)
- `refactor`: Code refactoring (no version bump)
- `test`: Adding tests (no version bump)
- `chore`: Maintenance tasks (no version bump)

## Setup Instructions

### 1. Create Personal Access Token (PAT)

1. Go to [Azure DevOps](https://dev.azure.com)
2. Create or select your organization
3. Go to User Settings → Personal Access Tokens
4. Click "New Token"
5. Configure:
   - **Name**: `VS Code Marketplace PAT`
   - **Organization**: All accessible organizations
   - **Expiration**: Set as needed
   - **Scopes**: Custom defined → Marketplace → Manage
6. Copy the token (you won't see it again!)

### 2. Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `MARKETPLACE_PAT`
5. Value: Paste your Azure DevOps PAT
6. Click "Add secret"

### 3. Release Process

The workflow automatically handles versioning and releases:

```bash
# Make changes and commit with semantic message
git add .
git commit -m "feat: add new kubeseal feature"
git push origin main

# Workflow automatically:
# 1. Determines version bump based on commit messages
# 2. Updates package.json version
# 3. Creates GitHub release with changelog
# 4. Uploads VSIX file
# 5. Publishes to VS Code Marketplace (if PAT configured)
```

### 4. Manual Release

To manually trigger a release:

1. Go to Actions tab in GitHub
2. Select "Release and Publish Extension"
3. Click "Run workflow"
4. Choose branch and click "Run workflow"

## Workflow Features

### Automatic Version Management
- Uses semantic-release for intelligent versioning
- Analyzes commit messages to determine version bumps
- Automatically updates package.json and creates git tags
- Generates changelog from commit history

### Conditional Publishing
- Only publishes when semantic-release creates a new version
- If no version bump needed: Skips release and marketplace publishing
- If version bump needed: Creates release and publishes to marketplace

### Marketplace Publishing
- Only publishes if `MARKETPLACE_PAT` is configured
- Uses publisher ID: `devops4life`
- Extension ID: `devops4life.kubeseal-vscode`
- Gracefully skips if no PAT is available

### Release Assets
- VSIX file automatically uploaded to GitHub releases
- Changelog generated from commit messages
- Direct links to VS Code Marketplace included
- Success notifications with all relevant URLs

## Workflow Steps

1. **Checkout** - Gets the latest code
2. **Setup Node.js** - Installs Node.js 20 with npm caching
3. **Install dependencies** - Runs `npm ci` for clean install
4. **Install vsce** - Installs VS Code extension packaging tool
5. **Build extension** - Compiles TypeScript to JavaScript
6. **Package extension** - Creates VSIX file
7. **Semantic Release** - Analyzes commits and creates release
8. **Get released version** - Determines if new version was published
9. **Upload VSIX** - Attaches VSIX file to release (if new version)
10. **Login to Marketplace** - Authenticates with PAT (if new version)
11. **Publish to Marketplace** - Publishes to VS Code Marketplace (if new version)
12. **Notify success** - Provides detailed success information

## Configuration Files

### .releaserc.json
The semantic-release configuration is defined in `.releaserc.json`:

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git",
    "@semantic-release/github"
  ]
}
```

## Troubleshooting

### Common Issues

1. **No Release Created**
   - Check commit messages follow conventional format
   - Ensure commits are on main branch
   - Verify semantic-release configuration

2. **PAT Authentication Failed**
   - Ensure PAT has "Marketplace (Manage)" scope
   - Check PAT hasn't expired
   - Verify organization access

3. **Build Failures**
   - Check Node.js version compatibility (requires Node.js 20+)
   - Ensure all dependencies are installed
   - Verify TypeScript compilation

4. **Marketplace Publishing Skipped**
   - Check if `MARKETPLACE_PAT` secret is configured
   - Verify PAT has correct permissions
   - Check workflow logs for authentication errors

### Debugging

- Check workflow logs in GitHub Actions
- Verify secrets are properly configured
- Test locally with `vsce package` and `vsce publish`
- Look for success notifications in workflow output
- Check semantic-release logs for version determination

## Security Notes

- Never commit PAT tokens to the repository
- Use repository secrets for sensitive data
- Regularly rotate PAT tokens
- Limit PAT scope to minimum required permissions
- Workflow gracefully handles missing PAT (skips marketplace publishing)
