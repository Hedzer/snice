# Release Process

This project uses semantic-release for automated version management and npm publishing.

## Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature (minor version bump)
- `fix:` Bug fix (patch version bump)
- `docs:` Documentation changes (no release)
- `style:` Code style changes (no release)
- `refactor:` Code refactoring (no release)
- `perf:` Performance improvements (patch version bump)
- `test:` Test changes (no release)
- `chore:` Build process or auxiliary tool changes (no release)

Breaking changes:
- Add `BREAKING CHANGE:` in the commit body or
- Add `!` after the type (e.g., `feat!:`)

## Local Release

### Prerequisites

1. Ensure you're on the `main` branch
2. Set your npm token for publishing:
   ```bash
   npm login
   ```

### Dry Run (Test Release)

To see what would be released without actually publishing:

```bash
npm run release:dry
```

### Actual Release

To create a new release and publish to npm:

```bash
npm run release
```

This command will:
1. Build the project
2. Run tests
3. Analyze commits since the last release
4. Determine the version bump based on commit messages
5. Generate changelog
6. Update package.json version
7. Create a git tag
8. Publish to npm
9. Push changes and tags to git

## GitLab CI/CD (Optional)

If you have GitLab CI/CD available, the `.gitlab-ci.yml` file is configured to automatically release on push to `main` branch.

You'll need to set these CI/CD variables in your GitLab project settings:
- `NPM_TOKEN`: Your npm authentication token
- `GL_TOKEN` or `GITLAB_TOKEN`: GitLab personal access token with api and write_repository scopes

## Manual Version Bump (Not Recommended)

If you need to manually set a version without semantic-release:

```bash
npm version patch  # or minor, major
npm publish
git push --follow-tags
```

However, using semantic-release is recommended for consistency.