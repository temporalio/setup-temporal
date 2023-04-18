# Setup Temporal Action

This GitHub Action installs the [Temporal CLI](https://github.com/temporalio/cli) on a GitHub Actions runner.

## Usage

To use this action, add the following step to your GitHub Actions workflow:

```yaml
steps:
  - name: Install Temporal CLI
    uses: temporalio/setup-temporal@v0

  - name: Start a local Temporal server
    shell: bash
    run: temporal server start-dev --headless &
```

By default, the action installs the latest version of the Temporal CLI. You can specify the version of the Temporal CLI to install using the version input:

```yaml
steps:
  - name: Install Temporal CLI
    uses: temporalio/setup-temporal@v0
    with:
      version: 0.7.0
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
