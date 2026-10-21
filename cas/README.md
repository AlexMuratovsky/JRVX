# JRVX CAS interface and game reliability

This release updates the existing CAS 3.0.17 installation at
https://cas.jrvx.ru/. The retained HTML shell still loads the installed CAS
modules. This directory contains the modified public bundles and UI modules;
it does not contain the entire older CAS application or its server backend.

The enhancement adds an ecosystem navigation bar, an actual Russian/English game
search, clear empty results and reset, and keyboard access for club cards. Search
results invoke the existing mode button; they do not implement new game routes.
The original dark CAS lobby and 18+ notice are restored, with navy and gold
styling for the ecosystem additions and account dialog.

The roulette table now occupies one viewport in portrait, landscape and desktop
layouts. All 37 numbers, outside bets, group selectors, amount, repeat/double/
clear and spin remain accessible without page scrolling. Large duplicate
readouts are replaced by a compact result, history strip and motion indicator.
Existing selection handlers remain in use; no odds, payouts or server game
rules are changed.

A new generated photographic wheel supplies the wood rim and brass spindle;
the numbered pockets and moving ball remain deterministic canvas geometry.
See `ROULETTE_ART.md` for provenance and the generation prompt.

All six blackjack actions occupy separate grid cells. Disabled actions remain
visible, insurance appears in its own cell, and status messages are readable.
Bet input and quick chips freeze during pending actions; fractional values are
rejected before sending. The poker statistics strip no longer takes the table's
grid row, and the table header fits its available width.

The new account entry intercepts obsolete login handlers and starts CAS's own
OIDC handshake at `/auth/jrvx/start`, using the server's validated configuration.
It returns to CAS in the same tab. Session refresh no longer submits an empty
token. Network failures release the account controls and show a retry message.

Poker and blackjack animate only new or revealed cards. Repeated server renders
keep existing cards still. Roulette uses a shorter presentation and honors the
animation preference while preserving the server-confirmed pocket; stale
animations stop after an account change. Sound and supported install controls
are restored in the rebuilt lobby header, with keyboard access to the sound
dialog.

Blackjack and roulette keep pending action identifiers across uncertain network
failures, enforce bounded requests, and send no new action when the browser
cannot durably save its identifier. Rejected blackjack actions clear the proper
pending key. Progress events stay queued when the transport rejects a send.
Identity, saved profiles, currency and age acceptance retain their existing
contracts.

Build `deploy/cas-ecosystem.zip` with `python package-reg.py`. It contains only
13 public files: `index.html`, its service worker, the versioned UI assets and
the modified client bundles. The worker
precaches those assets under a new shell cache name; it does not cache API calls.
Extract over the existing CAS
root; do not replace the complete modules directory. The previous root document
and service worker are retained in private recovery storage outside the repository.
To roll back, restore the previous root document and service worker; the old
versioned assets remain installed. New assets then remain unused.

The HTML snapshot was recovered from the public installation on 21 October 2026.
Validation includes 32 Node checks, 185 wheel-pocket simulations, DOM
checks and isolated browser layout checks at 320×568, 360×640, 390×844,
844×390 and 1000×720. All roulette and blackjack controls are in bounds and
uncovered at those sizes. The tests use simulated requests and display fixtures;
they do not place live wagers, purchase currency or change live game records.
This package does not change the server API.
