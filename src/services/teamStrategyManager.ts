import { Player, Position, TeamId } from '../types';
import { dbManager } from './databaseManager';

export interface PositionNeeds {
  [key: string]: number; // 0.0 ～ 2.0+ (1.0 が標準、>1.0 は補強必要度が高い)
}

export interface TeamAnalysis {
  teamId: string;
  needs: PositionNeeds;
  releaseCandidates: Player[];
  rosterCount: number;
}

export class TeamStrategyManager {
  
  /**
   * 全チームの補強ポイントと戦力外候補を分析する
   */
  static async analyzeAllTeams(): Promise<Record<string, TeamAnalysis>> {
    const teams = await dbManager.getInitialTeams();
    const analysis: Record<string, TeamAnalysis> = {};

    for (const team of teams) {
      analysis[team.id] = await this.analyzeTeam(team.id);
    }

    return analysis;
  }

  /**
   * 単一チームを分析する
   */
  static async analyzeTeam(teamId: string): Promise<TeamAnalysis> {
    const roster = await dbManager.getTeamRoster(teamId);
    
    const needs = this.calculateNeeds(roster);
    const releaseCandidates = this.identifyReleaseCandidates(roster);

    return {
      teamId,
      needs,
      releaseCandidates,
      rosterCount: roster.length
    };
  }

  /**
   * ロスターの厚みと質に基づいてドラフト補強ポイントを計算する
   */
  private static calculateNeeds(roster: Player[]): PositionNeeds {
    const needs: PositionNeeds = {
      'P': 1.0,
      'C': 1.0,
      '1B': 1.0, '2B': 1.0, '3B': 1.0, 'SS': 1.0,
      'LF': 1.0, 'CF': 1.0, 'RF': 1.0
    };

    // 選手をグループ化
    const grouped: Record<string, Player[]> = {
      'P': [], 'C': [],
      '1B': [], '2B': [], '3B': [], 'SS': [],
      'LF': [], 'CF': [], 'RF': []
    };

    roster.forEach(p => {
      let pos = p.position;
      if (pos === 'OF') pos = 'CF'; // 汎用OFは一旦CFとして扱うか分配する
      if (grouped[pos]) grouped[pos].push(p);
    });

    // 各ポジションを分析
    // 1. 投手
    const pitchers = grouped['P'];
    const pCount = pitchers.length;
    // 理想的な人数 ~30-35
    if (pCount < 30) needs['P'] += 0.5;
    if (pCount > 35) needs['P'] -= 0.5;
    if (pCount > 40) needs['P'] -= 1.0; // 40人以上いたらさらに抑制
    
    // 年齢構成/質をチェック
    const youngPitchers = pitchers.filter(p => p.age < 26);
    if (youngPitchers.length < 10) needs['P'] += 0.3;

    // 2. 捕手
    const catchers = grouped['C'];
    if (catchers.length < 4) needs['C'] += 1.0; // 最低4人は確保したい
    if (catchers.length > 7) needs['C'] -= 0.5;
    
    // 3. 内野手
    ['1B', '2B', '3B', 'SS'].forEach(pos => {
      const players = grouped[pos];
      if (players.length < 3) needs[pos] += 1.0; // 各ポジション3人は欲しい (レギュラー+控え+育成)
      if (players.length > 6) needs[pos] -= 0.4;
      
      // レギュラーの質をチェック (簡易チェック)
      const starter = players.sort((a, b) => (b.abilities.overall || 0) - (a.abilities.overall || 0))[0];
      if (!starter || (starter.abilities.overall || 0) < 40) needs[pos] += 0.4; // アップグレードが必要
      if (starter && starter.age > 33) needs[pos] += 0.3; // 後継者が必要
    });

    // 4. 外野手
    const outfielders = [...grouped['LF'], ...grouped['CF'], ...grouped['RF']];
    if (outfielders.length < 10) { // 外野全体で10人は欲しい
        needs['LF'] += 0.8; needs['CF'] += 0.8; needs['RF'] += 0.8;
    }
    if (outfielders.length > 16) {
        needs['LF'] -= 0.2; needs['CF'] -= 0.2; needs['RF'] -= 0.2;
    }

    return needs;
  }

  /**
   * 戦力外通告候補の選手を特定する
   */
  private static identifyReleaseCandidates(roster: Player[]): Player[] {
    const candidates: Player[] = [];
    const MAX_ROSTER = 70;
    
    // ポジションごとの最低人数を確保するためのガード
    const counts = {
        'P': roster.filter(p => p.position === 'P').length,
        'C': roster.filter(p => p.position === 'C').length,
        'IF': roster.filter(p => ['1B', '2B', '3B', 'SS'].includes(p.position)).length,
        'OF': roster.filter(p => ['LF', 'CF', 'RF', 'OF'].includes(p.position)).length
    };
    
    // "価値"でソート (低いほど戦力外の可能性が高い)
    // 価値 = 能力 + ポテンシャル(年齢係数)
    const scoredPlayers = roster.map(p => {
      const ability = this.calculateAbilityScore(p);
      // 年齢係数: 若手はブースト (ポテンシャル)
      // 18歳: +20, 25歳: +5, 30歳: 0, 35歳: -10
      const ageFactor = Math.max(0, 30 - p.age) * 1.5 - Math.max(0, p.age - 30) * 2;
      
      // ポジション過多の場合はスコアを下げる（放出されやすくする）
      let positionFactor = 0;
      if (p.position === 'P' && counts['P'] > 35) positionFactor = -10;
      
      return {
        player: p,
        score: ability + ageFactor + positionFactor
      };
    });

    // 昇順ソート (スコアが低い順)
    scoredPlayers.sort((a, b) => a.score - b.score);

    // 1. 枠制限によるカット
    // ロスターが70人を超える場合、放出が必要
    if (roster.length > MAX_ROSTER) {
      const cutCount = roster.length - MAX_ROSTER;
      let cut = 0;
      for (let i = 0; i < scoredPlayers.length; i++) {
          if (cut >= cutCount) break;
          
          const p = scoredPlayers[i].player;
          
          // 最低人数ガード: これ以上減らすと試合ができなくなる場合は放出しない
          if (p.position === 'P' && counts['P'] <= 28) continue;
          if (p.position === 'C' && counts['C'] <= 3) continue;
          if (['1B', '2B', '3B', 'SS'].includes(p.position) && counts['IF'] <= 10) continue;
          if (['LF', 'CF', 'RF', 'OF'].includes(p.position) && counts['OF'] <= 5) continue;

          candidates.push(p);
          
          // カウントを減らす
          if (p.position === 'P') counts['P']--;
          else if (p.position === 'C') counts['C']--;
          else if (['1B', '2B', '3B', 'SS'].includes(p.position)) counts['IF']--;
          else counts['OF']--;
          
          cut++;
      }
    }

    // 2. 成績/能力によるカット (オプション、現在は枠制限または非常に低いスコアのみ)
    // スコアが極端に低い場合（例：高齢で能力が低い）、枠内でも放出するか？
    // シンプルに: 閾値を下回る下位3-5名を放出候補とする
    const THRESHOLD = 20; // 任意の低いスコア
    for (let i = candidates.length; i < scoredPlayers.length; i++) {
      if (scoredPlayers[i].score < THRESHOLD) {
        candidates.push(scoredPlayers[i].player);
      }
    }

    // 重複を削除
    return Array.from(new Set(candidates));
  }

  private static calculateAbilityScore(p: Player): number {
    if (p.position === 'P') {
      // 投手スコア
      const spd = p.abilities.speed || 130;
      const con = p.abilities.control || 0;
      const sta = p.abilities.stamina || 0;
      // およそ0-100スケールに正規化
      // 球速: 130->0, 160->30
      const spdScore = Math.max(0, spd - 130);
      return spdScore + (con * 3) + (sta * 2);
    } else {
      // 野手スコア
      const con = p.abilities.contact || 0;
      const pow = p.abilities.power || 0;
      const spd = p.abilities.speed || 0;
      const def = (p.abilities.fielding || 0) + (p.abilities.arm || 0);
      return (con * 3) + (pow * 3) + (spd * 2) + def;
    }
  }
}
