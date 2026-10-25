# JRVX CAS interface and game reliability

The current repository package is an **unpublished v329 global client update**.
It adds a game hub with account-scoped favorites/recent choices, a truthful connection
center, contextual rules/control guides and shared accessible panels. It includes the
v328 history filters, recovery, profile, admin, audio and keyboard fixes unchanged.
Validation: **482 client tests, 41 JavaScript syntax checks**, a 45-file overlay,
35 unchanged v328 payloads, 26 unchanged production payloads and 12 responsive
game-layout configurations. See `GLOBAL_UPDATE_V329_20261024.md` for the new features,
evidence and limits; `IMPROVEMENTS_V328_20261024.md` records the earlier candidate.

**Production runs v327**, published on 24 October 2026 after explicit owner approval.
All 33 v327 package files match live HTTP; all 161 precache resources are available,
and the previous active assets remain intact for rollback. Its client/backend,
Service Worker and layout validation is recorded in `FULL_AUDIT_20261024.md`.
The backend and live game data were not changed by that publication. v329 requires
separate publication approval and has not been installed on cas.jrvx.ru.
The sections below also describe earlier published releases and their checks.

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

The approved roulette photograph supplies the stationary wooden case. Its
off-centre, incorrectly numbered photographed rotor is replaced by a cached,
concentric Canvas disc with the exact European 37-pocket order. The live ball
follows the server-confirmed spin plan. See `ART_V323.md` for the original asset
provenance and `FULL_AUDIT_20261023.md` for the correction and measurements.

The larger field picker mirrors all existing selection handlers and shows covered
numbers, chip markers, straight/pair/street/corner modes, outside bets, dozens and
columns. It performs no wager; the existing SPIN action remains separate.

Blackjack's original reference photograph and red card backs are restored. All
six live actions retain their responsive, uncovered grid. The lobby has one
sticky header with a server-backed online status and one account entry; obsolete
extra navigation and ghost artwork layers are removed. Profile, leaderboard,
news, tutorial and mode cards use consistent dedicated photographic backgrounds.

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
45 public files: `index.html`, its service worker, the versioned UI assets and
the modified client bundles. The worker
precaches those assets under a new shell cache name; it does not cache API calls.
Extract over the existing CAS
root; do not replace the complete modules directory. The previous root document
and service worker are retained in private recovery storage outside the repository.
To roll back, restore the previous root document and service worker; the old
versioned assets remain installed. New assets then remain unused.

The HTML snapshot was recovered from the public installation on 21 October 2026.
Validation includes 109 Node checks, 185 wheel-pocket simulations, DOM
checks and isolated browser layout checks at 320×568, 360×640, 390×844,
844×390 and 1100×820. All roulette, large picker and blackjack controls are in bounds and
uncovered at those sizes. The tests use simulated requests and display fixtures;
they do not place live wagers, purchase currency or change live game records.
This package does not change the server API.

The v324 bug-fix release binds poker ALL-IN confirmations and queued automatic
actions to their exact owner, table, hand, currency and action snapshot. Its
confirmation interceptor runs before the older action lock so an immediate
confirmation works once. Blackjack ignores snapshots from a previous login
epoch. Failed server logout keeps a visible retry, roulette Repeat restores split
orientation (including older saved bets), and optional account/render failures
cannot turn an already confirmed roulette result into a retry prompt. Picker
controls update their disabled attributes only when the value changes, avoiding
a MutationObserver/frame feedback loop during a spin.
An asynchronous canvas drawing error also leaves the verified spin timeline and
its single completion callback running.

`public/modules/poker/runtime/poker-pro-v324.js` retains the installed public
module (source SHA-256 bbb931ee611f0405347e5e86afa986cf75425f2f55ad71fe7b2f747eeca4edb7)
with these action-guard fixes. Old versioned assets remain available for rollback.

The v325 lobby fix keeps mode cards absolutely centred inside the real v120
carousel, overriding the generic decorative card position. Cards fit the stage
at narrow widths; mobile arrows have their own row. Only the selected card's
controls enter keyboard navigation, and named dots expose its current state.
The obsolete second connection status is hidden in the header.

The release also rejects foreign-owner poker frames before writing local hand
history, reports production connection status from identity and handshake state,
and clears failed join correlation so valid reconnect snapshots are not dropped.
Legacy network, lifecycle and poker-history modules are retained unchanged.

The carousel regression was checked with the actual v108 and v120 controller
code and the live lobby DOM: 42 browser checks covered all five modes, cyclic
arrows, dots and keyboard navigation at 320×568, 390×844, 679×811, 963×700 and
1280×820. Each active card remained centred and within the stage, the Play button
was hit-testable, and current dots and keyboard tab stops matched the selection.

The published v326 release repairs the roulette asset geometry and legacy CSS
perspective, keeps a fixed logical canvas world across DPR/resize, and caches a
correct 37-pocket disc. It also hardens acknowledged blackjack results, durable
currency exchange, spectator intent, poker minimum bets and the local heads-up
engine. Portrait poker controls grow without overlapping automatic actions.

Current checks: 198 CAS tests, 31 local identity/gateway tests, 46 exact backend
tests against synthetic SQLite data, nine-angle pixel measurements and fifteen
browser layout configurations. Fourteen additional full Miniflare/D1/DO groups
passed with synthetic users and a local Identity provider. The 32-file overlay
and separate owner-guard server patch were published after user authorization;
all 161 precache resources are available and all package bytes match live HTTP. See
`FULL_AUDIT_20261023.md` for scope, evidence, remaining checks and release status.
