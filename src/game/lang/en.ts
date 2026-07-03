const en: Record<string, string> = {
  // ── Menu ────────────────────────────────────────────────────────────────────
  normal: 'Normal',
  endless: 'Endless',
  shop: 'Shop',
  inventory: 'Inventory',
  achievements: 'Achievements',
  credits: 'Credits',
  ranking: 'Ranking',
  home: 'Home',

  // ── Ranking ───────────────────────────────────────────────────────────────────
  ranking_title: 'Ranking',
  ranking_loading: 'Loading...',
  ranking_empty: 'No scores yet.\nBe the first!',
  ranking_unconfigured: 'Online ranking is\nunavailable right now.',
  top3_title: 'Global',

  // ── Shop UI ─────────────────────────────────────────────────────────────────
  shop_title: 'Items',
  tab_shop: 'Shop',
  tab_inventory: 'Inventory',
  buy: 'Buy',
  upgrade: 'Upgrade',
  no_coins: 'No coins',
  owned: 'owned',
  selected: 'Selected',
  equipped_slots: 'Equipped',
  max_level: 'Max level',
  level: 'Level {0}  {1}',

  // ── Chinela inventory chatter ─────────────────────────────────────────────────
  cat_line_1: 'Items marked 🎯 are shots, and 🛡 ones are secondary!',
  cat_line_2: "You can't equip 2 shot items 🎯 at the same time!",
  cat_line_3: 'Meow meow meow',
  cat_line_4: 'You can make your items stronger in the shop',
  cat_empty: "It's a bit empty here. You need to buy new items in the shop",
  inventory_full: 'You need to free up an inventory slot to equip a new item',

  // ── Achievements ────────────────────────────────────────────────────────────
  achievements_title: 'Achievements',
  close: 'Close',
  locked_name: '???',
  locked_desc: 'Achievement locked',

  // ── Game Over ───────────────────────────────────────────────────────────────
  height: 'Height: {0}',
  new_record: 'New record: {0}!',
  record: 'Your record: {0}',
  new_record_title: 'New record!',
  enter_name: 'Enter your name for\nthe ranking:',
  submit: 'Submit',
  skip: 'skip',
  play_again: 'Play again',
  space_hint: 'Press any key to play again',
  achievement_unlocked: 'Achievement unlocked!',
  see: 'see ›',
  shop_tutorial_title: 'Buy an upgrade',
  shop_tutorial_body: 'Go to the shop and buy the Pomodoro',
  go_to_shop: 'Go to Shop →',

  // ── Main Scene HUD ──────────────────────────────────────────────────────────
  shield_ready: 'Shield: ready',
  shield_cooldown: 'Shield: {0}s',
  wings_ready: 'Wings: ready',
  wings_cooldown: 'Wings: {0}s',
  victory_msg: 'Congrats!\nYou defeated the mothership.\n\nNow you can play\nEndless mode to get\nhigher scores.\n\nThank you for playing <3',

  // ── Pause ───────────────────────────────────────────────────────────────────
  paused: 'PAUSED',
  continue: 'Continue',
  volume: 'Volume',
  quit_confirm: 'Quit to Home?',
  progress_lost: 'Current progress will be lost.',
  quit: 'Quit',
  cancel: 'Cancel',

  // ── Credits ─────────────────────────────────────────────────────────────────
  credits_title: 'Credits',
  credits_dev: 'Made by Deustavo. Follow my github for more projects <3',
  credits_music_label: '♫ Music',
  credits_caption: 'the protagonists are these crazy cats',

  // ── Stage Select ────────────────────────────────────────────────────────────
  normal_mode: 'Normal Mode',
  stage_1: 'Stage 1',
  stage_2: 'Stage 2',
  stage_3: 'Stage 3',
  stage_1_sub: 'Starts at height 0',
  stage_2_sub: 'Starts at height 1000',
  stage_3_sub: 'Starts at height 2000',
  blocked: 'Locked',

  // ── Tutorial ────────────────────────────────────────────────────────────────
  tutorial_buy: 'Select the Pomodoro\nand click Buy!',
  tutorial_equip: 'Now open Inventory\nand equip the Pomodoro!',
  tutorial_done: 'Perfect! Pomodoro equipped!',

  // ── Misc ────────────────────────────────────────────────────────────────────
  music_credit: '♫ Jeremy Black - Helios ♪',

  // ── Items ───────────────────────────────────────────────────────────────────
  'item.nada.name': 'Nothing',
  'item.nada.desc': '',

  'item.pomodoro-shot.name': 'Pomodoro',
  'item.pomodoro-shot.desc': 'Giant shot!\nStuns Pera for 3s',
  'item.pomodoro-shot.stat.0': 'Cooldown: 4s',
  'item.pomodoro-shot.stat.1': 'Cooldown: 3.5s',
  'item.pomodoro-shot.stat.2': 'Cooldown: 3s',

  'item.shield.name': 'Second chance',
  'item.shield.desc': 'Shield absorbs 1 shot',
  'item.shield.stat.0': 'Cooldown: 12s',
  'item.shield.stat.1': 'Cooldown: 10s',
  'item.shield.stat.2': 'Cooldown: 8s',

  'item.anjo-caido.name': 'Fallen Angel',
  'item.anjo-caido.desc': 'Double jump!\nWings appear on 2nd jump',
  'item.anjo-caido.stat.0': 'Cooldown: 4s',
  'item.anjo-caido.stat.1': 'Cooldown: 2s',
  'item.anjo-caido.stat.2': 'No cooldown',

  'item.hermes-sandals.name': 'Hermes Sandals',
  'item.hermes-sandals.desc': '+speed, -gravity\nUpgrades increase speed',
  'item.hermes-sandals.stat.0': 'Speed: +20%',
  'item.hermes-sandals.stat.1': 'Speed: +40%',
  'item.hermes-sandals.stat.2': 'Speed: +60%',

  'item.incandescente-shot.name': 'Incandescente',
  'item.incandescente-shot.desc': 'Pierces projectiles!',
  'item.incandescente-shot.stat.0': 'Cooldown: 4s',
  'item.incandescente-shot.stat.1': 'Cooldown: 3s',
  'item.incandescente-shot.stat.2': 'Cooldown: 2s',

  'item.special-shot.name': 'Bolimbolacho',
  'item.special-shot.desc': 'Faster and bigger shot',
  'item.special-shot.stat.0': 'Normal',
  'item.special-shot.stat.1': 'Bigger',
  'item.special-shot.stat.2': 'HUGE',

  // ── Achievements ────────────────────────────────────────────────────────────
  'achievement.height_100.name': 'First Jumps',
  'achievement.height_100.desc': 'Reach height 100',
  'achievement.height_500.name': 'Height Legend',
  'achievement.height_500.desc': 'Reach height 500',
  'achievement.height_1000.name': 'Space Master',
  'achievement.height_1000.desc': 'Defeat the mothership and reach height 1000',
  'achievement.height_2000.name': 'Touch the Stars',
  'achievement.height_2000.desc': 'Defeat the mothership twice and reach height 2000',
  'achievement.height_3000.name': 'Beyond the Skies',
  'achievement.height_3000.desc': 'Defeat all motherships and reach height 3000',
}

export default en
