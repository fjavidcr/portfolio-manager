# 🧹 Git History Cleanup Guide

When preparing to make a private repository public or transferring ownership, it's considered a best practice to ensure that the Git history is completely clean of any sensitive files, old configuration files, or temporary data that might have been committed accidentally in the past.

The recommended and officially supported tool for rewriting Git history stringently is **`git-filter-repo`**.

## Prerequisites (macOS)

Instead of using the deprecated `git filter-branch` command, install `git-filter-repo` via Homebrew:

```bash
brew install git-filter-repo
```

## How to permanently remove a file from the entire Git history

If you need to completely erase a specific file (e.g., an old `firebase_options.dart` file, a `.env` file, etc.) from all past commits and branches as if it never existed:

1. **Ensure you have a clean working tree** (commit or stash your current changes).
2. Run the filter command pointing exactly at the path of the file you want to purge:

```bash
git filter-repo --path <path_to_the_file_to_remove> --invert-paths
```

_Example: If you wanted to remove an old configuration file that was accidentally pushed months ago:_

```bash
git filter-repo --path portfolio_app/lib/firebase_options.dart --invert-paths
```

### ⚠️ Important Post-Cleanup Steps

Rewriting the Git history changes the cryptographic hash (`SHA`) of every commit that occurred _after_ the removed file was introduced. Your local history will no longer match the remote repository.

**To synchronize your changes with GitHub, you MUST perform a force push:**

```bash
git push origin --force --all
```

> **Warning:** Force pushing rewrites the remote history. If you have collaborators who have cloned the repository, they will need to delete their local clones and re-clone the repository from GitHub to avoid conflicts. Do this exclusively _before_ making the repository public or when working solo.
