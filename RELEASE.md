# Releasing

Followin the same as: https://forum.obsidian.md/t/using-github-actions-to-release-plugins/7877

## Steps

1.  Increment version in `manifest.json`.
2.  Add an entry to the changelog in `README.md`
4.  Set Obsidian version that is supported in `version.json`.
5.  Push the `main` branch to Github.
6.  Set git tag with version: `git tag <version number>`.
7.  Push the new tag to Github with: `git push origin --tag`.

This should trigger the Github workflow to build a release with the specified latest tag.

