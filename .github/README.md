# GitHub Actions CI/CD Setup

[![CI](https://github.com/rhofkens/mcp-quotes-server/workflows/CI/badge.svg)](https://github.com/rhofkens/mcp-quotes-server/actions/workflows/ci.yml)
[![Release](https://github.com/rhofkens/mcp-quotes-server/workflows/Release/badge.svg)](https://github.com/rhofkens/mcp-quotes-server/actions/workflows/release.yml)

This repository includes a comprehensive GitHub Actions CI/CD pipeline for the MCP Quotes Server project.

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:** Push to `main`, `master`, or `develop` branches, and pull requests to these branches.

**Jobs:**
- **Test**: Runs tests across Node.js versions 18.x, 20.x, and 22.x
- **Lint**: ESLint and Prettier format checking
- **Build**: TypeScript compilation and build verification
- **Security**: npm audit for vulnerability scanning
- **Type Check**: TypeScript type checking
- **Integration**: Basic integration tests (runs only on push to main/master)

### 2. Pull Request Pipeline (`.github/workflows/pr.yml`)

**Triggers:** Pull request events (opened, synchronized, reopened, ready_for_review)

**Features:**
- Smart change detection (only runs relevant checks based on changed files)
- Quick quality checks (lint, format, type check)
- Affected area testing
- Build size analysis
- Security scanning for dependency changes
- Comprehensive PR summary

### 3. Release Pipeline (`.github/workflows/release.yml`)

**Triggers:** 
- Push to tags matching `v*` pattern
- Manual workflow dispatch

**Features:**
- Release validation (tests, lint, build)
- Automatic changelog generation
- GitHub release creation with artifacts
- Optional Docker image building (currently disabled)

### 4. Dependency Management (`.github/dependabot.yml`)

**Features:**
- Weekly dependency updates for npm packages
- Weekly GitHub Actions updates
- Automatic PR creation with proper commit messages

## Environment Variables

The workflows use the following environment variables:

### Required
- `SERPER_API_KEY`: API key for Serper.dev service (set as repository secret)

### Optional Repository Secrets
- `CODECOV_TOKEN`: For code coverage reporting (not currently used)
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## Setup Instructions

1. **Set up Serper API Key:**
   ```bash
   # In your GitHub repository settings, add a secret:
   # Name: SERPER_API_KEY
   # Value: your-actual-serper-api-key
   ```

2. **Enable Actions:**
   - Go to your repository's Actions tab
   - Enable GitHub Actions if not already enabled

3. **Branch Protection (Recommended):**
   Follow these detailed steps to set up branch protection:

   **Step 1: Navigate to Branch Protection Settings**
   - Go to your GitHub repository
   - Click on **Settings** tab (top menu)
   - In the left sidebar, click **Branches**

   **Step 2: Add Branch Protection Rule**
   - Click **Add rule** button
   - In "Branch name pattern" field, enter: `main` (or `master` if that's your default branch)

   **Step 3: Configure Protection Settings**
   Check these boxes:
   - ✅ **Require a pull request before merging**
     - ✅ **Require approvals** (set to 1 or more reviewers)
     - ✅ **Dismiss stale PR approvals when new commits are pushed**
     - ✅ **Require review from code owners** (if you have a CODEOWNERS file)
   
   - ✅ **Require status checks to pass before merging**
     - ✅ **Require branches to be up to date before merging**
     - In the search box, add these status checks:
       - `Test (Node 20.x)` (or all Node versions if you prefer)
       - `Lint & Format Check`
       - `Build & Verify`
       - `TypeScript Type Check`
   
   - ✅ **Require conversation resolution before merging**
   - ✅ **Include administrators** (applies rules to repo admins too)

   **Step 4: Save Changes**
   - Click **Create** to save the branch protection rule

   **Step 5: Verify Setup**
   - Try creating a test PR to ensure the rules work correctly
   - You should see required status checks appear on the PR

   **Important Notes:**
   - Status check names appear after your first CI run, so push some code first
   - If you don't see the status checks in the search box, run the workflows once
   - You can always edit the branch protection rule later to add/remove checks

## Workflow Features

### Concurrency Control
- PR workflows cancel previous runs for the same PR to save resources
- Uses GitHub's concurrency groups for efficient resource usage

### Matrix Testing
- Tests across multiple Node.js versions (18.x, 20.x, 22.x)
- Ensures compatibility across different Node.js environments

### Smart Execution
- Change detection prevents unnecessary job execution
- Conditional steps based on file changes
- Fail-fast disabled for testing to see all results

### Security
- Automated security audits
- Dependency vulnerability scanning
- Safe secret handling

### Artifacts
- Build artifacts are uploaded and retained for 7 days
- Release artifacts are attached to GitHub releases

## Customization

To customize the workflows for your needs:

1. **Modify Node.js versions** in the matrix strategy
2. **Adjust security audit levels** in the security jobs
3. **Enable Docker builds** by setting the condition to `true` in release.yml
4. **Add additional checks** as needed for your project

## Troubleshooting

### Common Issues

1. **Tests failing due to missing API key:**
   - Ensure `SERPER_API_KEY` is set in repository secrets
   - Check that the secret name matches exactly

2. **Security audit failures:**
   - Review npm audit output
   - Update vulnerable dependencies
   - Consider using `--audit-level=high` for stricter checks

3. **Build failures:**
   - Check TypeScript compilation errors
   - Verify all dependencies are properly installed
   - Ensure dist/ directory is created correctly
