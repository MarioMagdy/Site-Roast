# Security

## Reporting a vulnerability

Please don't open a public issue. Use GitHub's private vulnerability reporting
(**Security → Report a vulnerability** on this repository) and include steps to reproduce.

## Scope

Site Roast runs a headless browser against URLs you give it and writes files under `runs/`. Relevant
reports include: a crafted website that makes the capture write outside `runs/`, execute code on the
host, or leak data from one run into another; and anything that makes the security checks do more than
passively observe.

## What Site Roast does to the sites it reviews

It loads pages the way a visitor's browser does, scrolls, resizes, clicks things like menu and modal
buttons when a finding needs a screenshot of them, and fetches public files (`robots.txt`,
`sitemap.xml`, `/.well-known/security.txt`, `llms.txt`) plus one random URL to see how missing pages are
handled. It does not submit forms, log in, brute-force paths or scan for vulnerabilities.

Secrets that it finds in a site's client-side code are stored redacted (first and last few characters only).
