const pt: Record<string, string> = {
  // ── Menu ────────────────────────────────────────────────────────────────────
  normal: 'Normal',
  endless: 'Sem Fim',
  shop: 'Loja',
  inventory: 'Inventário',
  achievements: 'Conquistas',
  credits: 'Créditos',
  home: 'Início',

  // ── Shop UI ─────────────────────────────────────────────────────────────────
  shop_title: 'Itens',
  tab_shop: 'Loja',
  tab_inventory: 'Inventário',
  buy: 'Comprar',
  upgrade: 'Melhorar',
  no_coins: 'Sem moedas',
  owned: 'adquirido',
  selected: 'Selecionado',
  equipped_slots: 'Equipados',
  max_level: 'Nível máx.',
  level: 'Nível {0}  {1}',

  // ── Chinela inventory chatter ─────────────────────────────────────────────────
  cat_line_1: 'Os itens com ícone 🎯 são tiros, e os 🛡 são secundários!',
  cat_line_2: 'Você não pode equipar 2 itens de tiro 🎯 ao mesmo tempo!',
  cat_line_3: 'Miau miau miau',
  cat_line_4: 'Você pode deixar seus itens mais fortes na loja',
  cat_empty: 'Está meio vazio aqui. Você precisa comprar novos itens na loja',

  // ── Achievements ────────────────────────────────────────────────────────────
  achievements_title: 'Conquistas',
  close: 'Fechar',
  locked_name: '???',
  locked_desc: 'Conquista bloqueada',

  // ── Game Over ───────────────────────────────────────────────────────────────
  height: 'Altura: {0}',
  new_record: 'Novo recorde: {0}!',
  record: 'Recorde: {0}',
  play_again: 'Jogar novamente',
  space_hint: 'Pressione ESPAÇO para jogar novamente',
  achievement_unlocked: 'Conquista desbloqueada!',
  see: 'ver ›',
  shop_tutorial_title: 'Compre um aprimoramento',
  shop_tutorial_body: 'Vá à loja e compre o Pomodoro',
  go_to_shop: 'Ir à Loja →',

  // ── Main Scene HUD ──────────────────────────────────────────────────────────
  shield_ready: 'Escudo: pronto',
  shield_cooldown: 'Escudo: {0}s',
  wings_ready: 'Asas: prontas',
  wings_cooldown: 'Asas: {0}s',
  victory_msg: 'Parabéns!\nVocê conseguiu eliminar a nave mãe.\n\nAgora você pode jogar o modo\nSem Fim para pegar\npontuações mais altas.\n\nObrigado por jogar <3',

  // ── Pause ───────────────────────────────────────────────────────────────────
  paused: 'PAUSADO',
  continue: 'Continuar',
  volume: 'Volume',
  quit_confirm: 'Sair para o Início?',
  progress_lost: 'O progresso atual será perdido.',
  quit: 'Sair',
  cancel: 'Cancelar',

  // ── Credits ─────────────────────────────────────────────────────────────────
  credits_title: 'Créditos',
  credits_dev: 'Feito por Deustavo. Siga meu github para mais projetos <3',
  credits_music_label: '♫ Música',
  credits_caption: 'as protagonistas são essas gatas endeotas',

  // ── Stage Select ────────────────────────────────────────────────────────────
  normal_mode: 'Modo Normal',
  stage_1: 'Estágio 1',
  stage_2: 'Estágio 2',
  stage_3: 'Estágio 3',
  stage_1_sub: 'Começa na altura 0',
  stage_2_sub: 'Começa na altura 1000',
  stage_3_sub: 'Começa na altura 2000',
  blocked: 'Bloqueado',

  // ── Tutorial ────────────────────────────────────────────────────────────────
  tutorial_buy: 'Selecione o Pomodoro\ne clique em Comprar!',
  tutorial_equip: 'Agora abra o Inventário\ne equipe o Pomodoro!',
  tutorial_done: 'Perfeito! Pomodoro equipado!',

  // ── Misc ────────────────────────────────────────────────────────────────────
  music_credit: '♫ Jeremy Black - Helios ♪',

  // ── Items ───────────────────────────────────────────────────────────────────
  'item.nada.name': 'Nada',
  'item.nada.desc': '',

  'item.pomodoro-shot.name': 'Pomodoro',
  'item.pomodoro-shot.desc': 'Tiro gigante!\nAtordoa a Pera por 3s',
  'item.pomodoro-shot.stat.0': 'Cooldown: 4s',
  'item.pomodoro-shot.stat.1': 'Cooldown: 3,5s',
  'item.pomodoro-shot.stat.2': 'Cooldown: 3s',

  'item.shield.name': 'Segunda chance',
  'item.shield.desc': 'Escudo absorve 1 tiro\n(recarga 10s)',
  'item.shield.stat.0': 'Recarga: 12s',
  'item.shield.stat.1': 'Recarga: 10s',
  'item.shield.stat.2': 'Recarga: 8s',

  'item.anjo-caido.name': 'Anjo Caído',
  'item.anjo-caido.desc': 'Pulo duplo!\nAsas aparecem no 2º salto',
  'item.anjo-caido.stat.0': 'Recarga: 4s',
  'item.anjo-caido.stat.1': 'Recarga: 2s',
  'item.anjo-caido.stat.2': 'Sem recarga',

  'item.hermes-sandals.name': 'Sandálias de Hermes',
  'item.hermes-sandals.desc': '+velocidade, -gravidade\nUpgrades aumentam a velocidade',
  'item.hermes-sandals.stat.0': 'Velocidade: +20%',
  'item.hermes-sandals.stat.1': 'Velocidade: +40%',
  'item.hermes-sandals.stat.2': 'Velocidade: +60%',

  'item.incandescente-shot.name': 'Incandescente',
  'item.incandescente-shot.desc': 'Atravessa projeteis!',
  'item.incandescente-shot.stat.0': 'Cooldown: 4s',
  'item.incandescente-shot.stat.1': 'Cooldown: 3s',
  'item.incandescente-shot.stat.2': 'Cooldown: 2s',

  'item.special-shot.name': 'Bolimbolacho',
  'item.special-shot.desc': 'Cooldown pela metade',
  'item.special-shot.stat.0': 'Normal',
  'item.special-shot.stat.1': 'Maiorzinho',
  'item.special-shot.stat.2': 'GRANDÃO',

  // ── Achievements ────────────────────────────────────────────────────────────
  'achievement.height_100.name': 'Primeiros pulos',
  'achievement.height_100.desc': 'Alcance altura 100',
  'achievement.height_500.name': 'Lenda das Alturas',
  'achievement.height_500.desc': 'Alcance altura 500',
  'achievement.height_1000.name': 'Mestre do espaço',
  'achievement.height_1000.desc': 'Derrote a nave mãe e alcance altura 1000',
  'achievement.height_2000.name': 'Tocar as Estrelas',
  'achievement.height_2000.desc': 'Derrote a nave mãe duas vezes e alcance altura 2000',
  'achievement.height_3000.name': 'Além dos Céus',
  'achievement.height_3000.desc': 'Vença todas as nave mães e alcance altura 3000',
}

export default pt
