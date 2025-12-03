import { Player, TeamId, NewsItem, Team } from '../types';
import { dbManager } from './databaseManager';

export class AwardManager {
  
  static async processSeasonAwards(season: number, currentDate: number): Promise<NewsItem[]> {
    const players = await dbManager.getInitialPlayers();
    const teams = await dbManager.getInitialTeams();
    const news: NewsItem[] = [];

    // リーグごとに処理
    const leagues = ['pacific', 'central'];
    
    for (const league of leagues) {
        const leagueTeams = teams.filter(t => t.league === league).map(t => t.id);
        const leaguePlayers = players.filter(p => leagueTeams.includes(p.team));
        
        // タイトルホルダー選出
        const titles = this.determineTitles(leaguePlayers, league, currentDate, teams);
        news.push(...titles);

        // ベストナイン
        const bestNine = this.determineBestNine(leaguePlayers, league);
        news.push(this.createAwardNews(league, 'ベストナイン', bestNine, currentDate, teams, true));

        // ゴールデングラブ
        const gg = this.determineGoldenGlove(leaguePlayers, league);
        news.push(this.createAwardNews(league, 'ゴールデングラブ賞', gg, currentDate, teams, false));

        // MVP
        const mvp = this.determineMVP(leaguePlayers, league);
        if (mvp) {
            news.push({
                id: `award_mvp_${league}_${currentDate}`,
                date: currentDate,
                title: `${league === 'pacific' ? 'パ・リーグ' : 'セ・リーグ'} MVP発表`,
                content: `MVP: ${mvp.name} (${teams.find(t => t.id === mvp.team)?.name})\n成績: ${this.formatMVPStats(mvp)}`,
                type: 'award',
                affectedTeams: [mvp.team]
            });
        }
    }

    return news;
  }

  private static determineTitles(players: Player[], league: string, currentDate: number, teams: Team[]): NewsItem[] {
      // 規定打席・規定投球回 (簡易的に143試合制として計算)
      // 実際には gameState.day 等から計算すべきだが、ここでは固定値または少なめに設定
      const REG_PA = 443;
      const REG_IP = 143;

      const news: NewsItem[] = [];
      const leagueName = league === 'pacific' ? 'パ・リーグ' : 'セ・リーグ';

      const getTeamName = (p: Player) => teams.find(t => t.id === p.team)?.name || '';

      // --- 野手タイトル ---
      const batters = players.filter(p => p.position !== 'P' && p.stats);
      const qualifiedBatters = batters.filter(p => (p.stats.plateAppearances || 0) >= REG_PA);

      // 首位打者
      const avg = qualifiedBatters.sort((a, b) => (b.stats.average || 0) - (a.stats.average || 0))[0];
      // 本塁打王
      const hr = batters.sort((a, b) => (b.stats.homeRuns || 0) - (a.stats.homeRuns || 0))[0];
      // 打点王
      const rbi = batters.sort((a, b) => (b.stats.rbi || 0) - (a.stats.rbi || 0))[0];
      // 盗塁王
      const sb = batters.sort((a, b) => (b.stats.stolenBases || 0) - (a.stats.stolenBases || 0))[0];
      // 最多安打
      const hits = batters.sort((a, b) => (b.stats.hits || 0) - (a.stats.hits || 0))[0];
      // 最高出塁率
      const obp = qualifiedBatters.sort((a, b) => (b.stats.obp || 0) - (a.stats.obp || 0))[0];

      let content = '';
      if (avg) content += `首位打者: ${avg.name} (${getTeamName(avg)}) .${(avg.stats.average || 0).toFixed(3)}\n`;
      if (hr) content += `本塁打王: ${hr.name} (${getTeamName(hr)}) ${hr.stats.homeRuns}本\n`;
      if (rbi) content += `打点王: ${rbi.name} (${getTeamName(rbi)}) ${rbi.stats.rbi}打点\n`;
      if (sb) content += `盗塁王: ${sb.name} (${getTeamName(sb)}) ${sb.stats.stolenBases}個\n`;
      if (hits) content += `最多安打: ${hits.name} (${getTeamName(hits)}) ${hits.stats.hits}本\n`;
      if (obp) content += `最高出塁率: ${obp.name} (${getTeamName(obp)}) .${(obp.stats.obp || 0).toFixed(3)}\n`;

      news.push({
          id: `award_batter_${league}_${currentDate}`,
          date: currentDate,
          title: `${leagueName} 打撃タイトル`,
          content: content.trim(),
          type: 'award',
          affectedTeams: []
      });

      // --- 投手タイトル ---
      const pitchers = players.filter(p => p.position === 'P' && p.stats);
      const qualifiedPitchers = pitchers.filter(p => (p.stats.inningsPitched || 0) >= REG_IP);

      // 最多勝
      const wins = pitchers.sort((a, b) => (b.stats.wins || 0) - (a.stats.wins || 0))[0];
      // 最優秀防御率
      const era = qualifiedPitchers.sort((a, b) => (a.stats.era || 99) - (b.stats.era || 99))[0];
      // 最多奪三振
      const so = pitchers.sort((a, b) => (b.stats.strikeOuts || 0) - (a.stats.strikeOuts || 0))[0];
      // 最多セーブ
      const saves = pitchers.sort((a, b) => (b.stats.saves || 0) - (a.stats.saves || 0))[0];
      // 最高勝率 (13勝以上)
      const wpPitchers = pitchers.filter(p => (p.stats.wins || 0) >= 13);
      const wp = wpPitchers.sort((a, b) => {
          const wa = (a.stats.wins || 0) / ((a.stats.wins || 0) + (a.stats.losses || 0) || 1);
          const wb = (b.stats.wins || 0) / ((b.stats.wins || 0) + (b.stats.losses || 0) || 1);
          return wb - wa;
      })[0];

      content = '';
      if (wins) content += `最多勝: ${wins.name} (${getTeamName(wins)}) ${wins.stats.wins}勝\n`;
      if (era) content += `最優秀防御率: ${era.name} (${getTeamName(era)}) ${(era.stats.era || 0).toFixed(2)}\n`;
      if (so) content += `最多奪三振: ${so.name} (${getTeamName(so)}) ${so.stats.strikeOuts}個\n`;
      if (saves) content += `最多セーブ: ${saves.name} (${getTeamName(saves)}) ${saves.stats.saves}S\n`;
      if (wp) {
          const rate = (wp.stats.wins || 0) / ((wp.stats.wins || 0) + (wp.stats.losses || 0));
          content += `最高勝率: ${wp.name} (${getTeamName(wp)}) .${rate.toFixed(3)}\n`;
      }

      news.push({
          id: `award_pitcher_${league}_${currentDate}`,
          date: currentDate,
          title: `${leagueName} 投手タイトル`,
          content: content.trim(),
          type: 'award',
          affectedTeams: []
      });

      return news;
  }

  private static determineBestNine(players: Player[], league: string): Player[] {
      const REG_PA = 443;
      const positions = ['P', 'C', '1B', '2B', '3B', 'SS', 'OF', 'OF', 'OF'];
      if (league === 'pacific') positions.push('DH');

      const selected: Player[] = [];
      const usedIds = new Set<string | number>();

      // ポジションごとに最高評価の選手を選出
      // OFは3人選ぶ
      // 野手は規定打席到達者のみを対象とする
      const ofCandidates = players.filter(p => ['LF', 'CF', 'RF', 'OF'].includes(p.position) && (p.stats.plateAppearances || 0) >= REG_PA);
      const otherCandidates = players.filter(p => !['LF', 'CF', 'RF', 'OF'].includes(p.position));

      // OF選出 (OPS + タイトル系指標)
      const calculateBatterScore = (p: Player) => {
          return (p.stats.ops || 0) * 100 + (p.stats.homeRuns || 0) * 0.5 + (p.stats.rbi || 0) * 0.1 + (p.stats.stolenBases || 0) * 0.2;
      };

      ofCandidates.sort((a, b) => calculateBatterScore(b) - calculateBatterScore(a));
      for (let i = 0; i < 3; i++) {
          if (ofCandidates[i]) {
              selected.push(ofCandidates[i]);
              usedIds.add(ofCandidates[i].id);
          }
      }

      // その他ポジション
      ['P', 'C', '1B', '2B', '3B', 'SS'].forEach(pos => {
          let cands = otherCandidates.filter(p => p.position === pos);
          
          if (pos === 'P') {
              // 投手は勝利数 + セーブ + 防御率 + 奪三振で総合評価
              cands.sort((a, b) => {
                  const scoreA = (a.stats.wins || 0) * 10 + (a.stats.saves || 0) * 7 - (a.stats.era || 4) * 3 + (a.stats.strikeOuts || 0) * 0.05;
                  const scoreB = (b.stats.wins || 0) * 10 + (b.stats.saves || 0) * 7 - (b.stats.era || 4) * 3 + (b.stats.strikeOuts || 0) * 0.05;
                  return scoreB - scoreA;
              });
          } else {
              // 野手は規定打席到達者のみ
              cands = cands.filter(p => (p.stats.plateAppearances || 0) >= REG_PA);
              // 野手は総合スコア
              cands.sort((a, b) => calculateBatterScore(b) - calculateBatterScore(a));
          }
          if (cands[0]) {
              selected.push(cands[0]);
              usedIds.add(cands[0].id);
          }
      });

      // DH (パのみ)
      if (league === 'pacific') {
          const dhCands = players.filter(p => !usedIds.has(p.id) && p.position !== 'P' && (p.stats.plateAppearances || 0) >= REG_PA);
          dhCands.sort((a, b) => calculateBatterScore(b) - calculateBatterScore(a));
          if (dhCands[0]) selected.push(dhCands[0]);
      }

      return this.sortPlayersByPosition(selected);
  }

  private static determineGoldenGlove(players: Player[], league: string): Player[] {
      const REG_PA = 443;
      // 守備指標 (Fielding + Arm + Errors) で評価
      const selected: Player[] = [];
      
      // OF (規定打席到達者)
      const ofCandidates = players.filter(p => ['LF', 'CF', 'RF', 'OF'].includes(p.position) && (p.stats.plateAppearances || 0) >= REG_PA);
      ofCandidates.sort((a, b) => {
          const scoreA = (a.abilities.fielding || 0) + (a.abilities.arm || 0) - (a.stats.errors || 0) * 5;
          const scoreB = (b.abilities.fielding || 0) + (b.abilities.arm || 0) - (b.stats.errors || 0) * 5;
          return scoreB - scoreA;
      });
      for (let i = 0; i < 3; i++) {
          if (ofCandidates[i]) selected.push(ofCandidates[i]);
      }

      // Others
      ['P', 'C', '1B', '2B', '3B', 'SS'].forEach(pos => {
          let cands = players.filter(p => p.position === pos);
          
          // 野手は規定打席到達者のみ
          if (pos !== 'P') {
              cands = cands.filter(p => (p.stats.plateAppearances || 0) >= REG_PA);
          }

          cands.sort((a, b) => {
            const scoreA = (a.abilities.fielding || 0) + (a.abilities.arm || 0) - (a.stats.errors || 0) * 5;
            const scoreB = (b.abilities.fielding || 0) + (b.abilities.arm || 0) - (b.stats.errors || 0) * 5;
            return scoreB - scoreA;
          });
          if (cands[0]) selected.push(cands[0]);
      });

      return this.sortPlayersByPosition(selected);
  }

  private static sortPlayersByPosition(players: Player[]): Player[] {
      const getOrderIndex = (p: Player) => {
            if (p.position === 'P') return 0;
            if (p.position === 'C') return 1;
            if (p.position === '1B') return 2;
            if (p.position === '2B') return 3;
            if (p.position === '3B') return 4;
            if (p.position === 'SS') return 5;
            if (['LF', 'CF', 'RF', 'OF'].includes(p.position)) return 6;
            if (p.position === 'DH') return 7;
            return 8;
      };
      return players.sort((a, b) => getOrderIndex(a) - getOrderIndex(b));
  }

  private static determineMVP(players: Player[], league: string): Player | null {
      const REG_PA = 443;
      // シンプルにOPSまたは投手評価が最も高い選手
      // 本来は優勝チームから選出されることが多いが、ここではリーグ全体で最高評価
      let bestPlayer: Player | null = null;
      let maxScore = -9999;

      players.forEach(p => {
          let score = 0;
          if (p.position === 'P') {
              score = (p.stats.wins || 0) * 15 + (p.stats.saves || 0) * 10 - (p.stats.era || 4) * 10;
          } else {
              // 野手は規定打席到達者のみ
              if ((p.stats.plateAppearances || 0) < REG_PA) return;
              score = (p.stats.ops || 0) * 100 + (p.stats.rbi || 0) * 0.5;
          }
          
          if (score > maxScore) {
              maxScore = score;
              bestPlayer = p;
          }
      });

      return bestPlayer;
  }

  private static createAwardNews(league: string, title: string, players: Player[], date: number, teams: Team[], showStats: boolean = false): NewsItem {
      const leagueName = league === 'pacific' ? 'パ・リーグ' : 'セ・リーグ';
      const getTeamName = (p: Player) => teams.find(t => t.id === p.team)?.name || '';
      
      const content = players.map(p => {
          const pos = ['LF', 'CF', 'RF', 'OF'].includes(p.position) ? 'OF' : p.position;
          let line = `${pos}: ${p.name} (${getTeamName(p)})`;
          if (showStats) {
              line += `  ${this.formatAwardStats(p)}`;
          }
          return line;
      }).join('\n');
      
      return {
          id: `award_${title}_${league}_${date}`,
          date: date,
          title: `${leagueName} ${title}`,
          content,
          type: 'award',
          affectedTeams: []
      };
  }

  private static formatAwardStats(p: Player): string {
      if (p.position === 'P') {
          return `${p.stats.wins}勝${p.stats.losses}敗${p.stats.saves}S 防${(p.stats.era || 0).toFixed(2)}`;
      } else {
          return `率.${(p.stats.average || 0).toFixed(3)} ${p.stats.homeRuns}本 ${p.stats.rbi}打点`;
      }
  }

  private static formatMVPStats(p: Player): string {
      if (p.position === 'P') {
          return `${p.stats.wins}勝 ${p.stats.saves}S 防${(p.stats.era || 0).toFixed(2)}`;
      } else {
          return `率.${(p.stats.average || 0).toFixed(3)} ${p.stats.homeRuns}本 ${p.stats.rbi}打点`;
      }
  }
}
