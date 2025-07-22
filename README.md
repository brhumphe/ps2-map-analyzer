# PS2MapState

## Development Setup

### Prerequisites

- Python 3.13 or higher
- [uv](https://github.com/astral-sh/uv) for package management

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/PS2MapState.git
   cd PS2MapState
   ```

2. Install dependencies:

   ```
   uv pip install -e .
   uv pip install -e ".[dev]"
   ```

3. Set up pre-commit hooks:
   ```
   pre-commit install
   ```

## Code Quality

This project uses [pre-commit](https://pre-commit.com/) with [ruff](https://github.com/astral-sh/ruff) to maintain code quality. The pre-commit hooks will run automatically when you commit changes, checking your code against the configured rules.

### Pre-commit Configuration

The pre-commit hooks are configured in `.pre-commit-config.yaml`. The hooks will:

- Run ruff to check for linting issues
- Run ruff-format to check for formatting issues

If any issues are found, the commit will be blocked until they are fixed.

### Running Manually

You can run the pre-commit hooks manually on all files:

```
pre-commit run --all-files
```

Or on specific files:

```
pre-commit run --files path/to/file.py
```

### Ruff Configuration

Ruff is configured in `ruff.toml`. The configuration includes:

- Target Python version: 3.13
- Enabled rules: All rules are enabled by default
- Line length: 100 characters
- Specific rule ignores for test files

## Project Structure

- `backend/`: Backend Python code
  - `analysis/`: Computations on tactical state of the map
  - `services/`: Service modules
  - `shared/`: Shared modules and models
- `frontend/`: Frontend code
- `tests/`: Test files
- `docs/`: Documentation
