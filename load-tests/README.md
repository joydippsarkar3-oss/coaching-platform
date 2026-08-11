# CompuTrain Load Tests

k6-based load test suite for the CompuTrain coaching platform.

## Install k6

```bash
# macOS
brew install k6

# Windows
choco install k6

# Docker (no install needed)
docker pull grafana/k6
```

## Running the Tests

All scripts read configuration from environment variables. At minimum set `BASE_URL`.

### 1. Exam concurrent load (2,000 VUs)

```bash
BASE_URL=https://staging.computrain.io \
TEST_EXAM_ID=42 \
k6 run load-tests/exam-concurrent.js
```

### 2. Certificate verify page

```bash
BASE_URL=https://staging.computrain.io \
k6 run load-tests/verify-page.js
```

### 3. API baseline (read/write mix)

```bash
BASE_URL=https://staging.computrain.io \
AUTH_TOKEN=<your-token> \
k6 run load-tests/api-baseline.js
```

### Docker equivalent

```bash
docker run --rm -i grafana/k6 run - <load-tests/api-baseline.js \
  -e BASE_URL=https://staging.computrain.io \
  -e AUTH_TOKEN=<your-token>
```

## Environment Variables

| Variable | Default | Used by |
|---|---|---|
| `BASE_URL` | `http://localhost:3000` | all scripts |
| `TEST_EXAM_ID` | `1` | exam-concurrent.js |
| `AUTH_TOKEN` | `test-token` | api-baseline.js |

## Interpreting Output

k6 prints a summary after each run. Key metrics:

- `http_req_duration` — end-to-end HTTP request time. Look at `p(95)` (95th percentile). Each script has a threshold that must pass.
- `http_req_failed` — fraction of requests that received a non-2xx response or a network error. Should stay near 0.
- `vus` / `vus_max` — virtual users active during the test.
- Custom trends (e.g. `exam_attempt_duration`, `read_req_duration`, `write_req_duration`) — end-to-end scenario timings tracked separately from raw HTTP.

A green `✓` next to a threshold means it passed; a red `✗` means it failed and the exit code will be non-zero (useful for CI gating).

Example passing output:

```
✓ http_req_duration.........: p(95)=742ms
✓ http_req_failed...........: 0.00%
```

## CI Integration (GitHub Actions)

The repository ships a manual-trigger workflow at `.github/workflows/load-test.yml`.
Trigger it from the Actions tab or via the CLI:

```bash
gh workflow run load-test.yml \
  -f staging_url=https://staging.computrain.io \
  -f auth_token=$AUTH_TOKEN
```

To add the baseline test to an existing CI pipeline, add this step after your deploy step:

```yaml
- name: Run API baseline load test
  uses: grafana/k6-action@v0.3.1
  with:
    filename: load-tests/api-baseline.js
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
    AUTH_TOKEN: ${{ secrets.STAGING_AUTH_TOKEN }}
```

Fail the pipeline on threshold breach by checking the exit code — k6 exits with code `99` when any threshold fails.

## File Layout

```
load-tests/
  exam-concurrent.js       2,000-VU exam flow
  verify-page.js           500-VU certificate verify page
  api-baseline.js          100-VU read/write baseline
  fixtures/
    cert-numbers.json      100 test certificate numbers
  README.md                this file
.github/workflows/
  load-test.yml            manual-trigger GitHub Actions workflow
```
