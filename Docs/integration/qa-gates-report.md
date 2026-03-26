# QA Gates Report (Legacy-First Integration)

## Gate Status

- `smoke`: PASS
- `test:integration`: PASS
- `test:security`: PASS
- `test:e2e:battery` (core): PASS

## Environment Notes

- Compare backend (legacy Java): healthy on `18080/18081`.
- GPTsercop API: validated on `http://192.168.100.45:3080`.
- E2E full profile requires full local topology (API + DB + all portals and stable local routes).
- Hybrid/remote setups should use `test:e2e:battery` (core profile).

## Commands Used

- `npm run smoke -- "http://192.168.100.45:3080"`
- `INTEGRATION_BASE_URL="http://192.168.100.45:3080" npm run test:integration`
- `INTEGRATION_BASE_URL="http://192.168.100.45:3080" npm run test:security`
- `PLAYWRIGHT_API_URL="http://192.168.100.45:3080" npm run test:e2e:battery`

## Battery Profiles

- `test:e2e:battery` / `test:e2e:battery:core`: stable hybrid/remote profile.
- `test:e2e:battery:full`: full local topology profile.
- `test:e2e:battery:full:seed`: full profile with explicit seed before execution.

## Last Verified E2E Core Result

- `73 passed`
- `8 skipped`
- `0 failed`
