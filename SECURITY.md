# Security policy

Zykit’s core promise is that your files and text never leave your browser. We take anything that breaks that promise, or puts users at risk, seriously.

## Supported versions

Only the live site (<https://zykit.vercel.app>) and the latest `main` branch are supported. Fixes are not backported.

## Reporting a vulnerability

**Please don’t open a public issue for security problems.**

Report privately through GitHub: go to the repository’s **Security** tab and choose **Report a vulnerability**. Include:

- what is affected (tool, page or file) and the impact
- steps or a proof of concept to reproduce it
- the browser and version you used

You can expect an acknowledgement within 7 days and an update on the fix within 30 days. Once it is fixed, we are happy to credit you in the release notes unless you prefer to stay anonymous.

## In scope

- Data leaving the browser: any network request that carries file contents, file names or derived data
- Bypasses of the Content Security Policy
- Cross-site scripting, including through crafted files, JWTs, JSON, diffs or code run in the JS Runner
- Parser bugs that let a crafted file crash the page, hang it or read out of bounds
- Metadata the Clean Image tool claims to remove but leaves in the output

## Out of scope

- Denial of service against the hosting provider
- Missing security headers that the CSP or other headers already cover
- Issues that require a compromised browser, extension or device
