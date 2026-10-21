# JRVX CAS interface enhancement

This is a bounded enhancement for the existing CAS 3.0.17 installation at
https://cas.jrvx.ru/. The retained HTML shell still loads the installed CAS
modules. This directory does not contain the entire older CAS application.

The enhancement adds an ecosystem navigation bar, an actual Russian/English game
search, clear empty results and reset, and keyboard access for club cards. Search
results invoke the existing mode button; they do not implement new game routes.
The lobby and 18+ notice use the ecosystem cream/forest palette. Game tables,
identity, saved profiles, currency and existing age acceptance remain unchanged.

Build `deploy/cas-ecosystem.zip` with `python package-reg.py`. It contains only
`index.html`, its service worker and the two new versioned UI assets. The worker
precaches those assets under a new shell cache name; it does not cache API calls.
Extract over the existing CAS
root; do not replace the complete modules directory. The previous root document
and service worker are retained in private recovery storage outside the repository.
To roll back, restore both files; the extra assets then remain unused.

The HTML snapshot was recovered from the public installation on 21 October 2026.
No payment, purchase, wager or game outcome is exercised by the enhancement
tests. This package does not change the application version or server API.
