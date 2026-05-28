# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Type-check with tsc then bundle with Vite
npm run preview  # Preview the production build locally
```

There is no test runner configured in this project.

## UI Conventions

- All in-game text must use `fontFamily: '"Comic Neue", "Comic Sans MS", cursive'`.

## Stack

- **Phaser 4** — 2D game engine (arcade physics, scene management, spritesheets)
- **TypeScript** — compiled via `tsc`, bundled by Vite
- **Vite** — dev server and production bundler

## Architecture

The game is a single-page Phaser app bootstrapped in [src/main.ts](src/main.ts) → [src/game/Game.ts](src/game/Game.ts).

**Scene flow:** `PreloadScene` → `MenuScene` → `MainScene` ↔ `PauseScene` → `GameOverScene` (or `CreditsScene` / `ShopScene` / `AchievementsScene` from the menu). Scenes are passed by key string (e.g. `'main-scene'`) when launching or transitioning.

**Entity pattern:** `Player`, `Enemy`, and `TouchControls` are plain TypeScript classes (not Phaser GameObjects) instantiated inside `MainScene.create()`. Each exposes an `update()` method called from `MainScene.update()`. They receive the Phaser `scene` in their constructor and own their internal sprites/physics bodies.

**Constants:** All tunable values (world size, gravity, platform gaps, scroll speed, enemy behavior) live in [src/game/config/constants.ts](src/game/config/constants.ts) as `as const` objects. Change gameplay feel here rather than in entity/scene code.

**Asset loading:** All assets are loaded in `PreloadScene.preload()` using the key names defined in `constants.ts` (e.g. `PLAYER.spriteKey`, `ENEMY.spriteKey`). The `'pixel'` texture (1×1 white square used for platforms and ground) is generated programmatically in `PreloadScene.create()` — it is not a file.

**Procedural platforms:** `MainScene` spawns platforms lazily ahead of the camera and destroys them when they scroll below the viewport. Platform layout is constrained by `PLATFORMS.maxHorizontalReach` to ensure reachability.

**Scroll system:** Camera scrolls upward automatically; speed increases over time up to `SCROLL.maxSpeed`. When the player is in the upper 40% of the screen, scroll speed gets an additional boost proportional to how high they are (`SCROLL.upperHalfBoostFactor`).

**Enemy (Pera):** Fixed to screen space (`setScrollFactor(0)`), bounces left/right, and throws trap projectiles aimed at the player's world position every `ENEMY.throwInterval` seconds. A glow sprite (additive blend mode) blinks before each throw as a visual warning.

**Touch controls:** `TouchControls` renders virtual buttons in screen space and exposes a `state: TouchState` object (`{ left, right, jump }`) consumed by `Player.update()`.

**Persistence (localStorage):** All cross-session state is stored via four manager classes in `src/game/utils/`:
- `CoinManager` — running coin total (`totalCoins` key); coins are the shop currency.
- `PurchaseManager` — JSON array of purchased item IDs (`purchases` key).
- `EquipManager` — single currently-equipped item ID (`equipped` key).
- `NotificationManager` — one-bit flag (`newItemNotification`) set when a purchase is made; cleared when the Inventory tab is opened.

**Items / Shop system:** `src/game/items/registry.ts` is the single source of truth for all purchasable and default items (`ITEM_REGISTRY: ShopItem[]`). Item types are `'shot'`, `'upgrade'`, `'shield'`, `'ability'`, or `'none'`. Adding a new item means adding an entry here — `PreloadScene` automatically loads spritesheets for `shot` items (via `shotConfig.spritesheet.path`), and `Player` registers animations for them automatically. `PlayerLoadout` resolves the active shot config at runtime: it picks the equipped shot item (falling back to the base shot from constants) then folds in any active `UpgradeEffect` multipliers.

**Achievements:** Defined in `src/game/achievements/achievements.ts` as height thresholds. `AchievementManager.checkHeight(height)` is called from `MainScene` during gameplay; it persists newly unlocked achievements to localStorage and returns the newly unlocked list for in-game notification.

**Scene transitions:** All entry/exit animations go through `src/game/utils/sceneTransitions.ts` (`dropIn`, `dropInFloat`, `exitTo`). New scenes should follow this pattern — build element list, call `dropIn` per element with staggered delay, call `exitTo` on navigation.

**UI helpers:** `src/game/utils/uiHelpers.ts` exports `addBackground` and `addCoinCounter` used at the top of every non-gameplay scene's `create()`.
