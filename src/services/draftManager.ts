import { Player, Position, TeamId } from '../types';
import { dbManager } from './databaseManager';
import { RandomUtils } from '../utils/randomUtils';

export class DraftManager {
  
  /**
   * Generates a list of draft candidates
   * @param count Number of candidates to generate
   */
  static generateDraftCandidates(count: number): Player[] {
    const candidates: Player[] = [];
    
    // Roughly 50% Pitchers, 50% Fielders
    const pitcherCount = Math.floor(count / 2);
    const fielderCount = count - pitcherCount;

    for (let i = 0; i < pitcherCount; i++) {
      candidates.push(this.generatePitcher(i));
    }

    for (let i = 0; i < fielderCount; i++) {
      candidates.push(this.generateFielder(pitcherCount + i));
    }

    return candidates;
  }

  private static generatePitcher(index: number): Player {
    const name = dbManager.generateRandomName();
    const age = RandomUtils.weightedChoice([18, 22, 24], [0.45, 0.45, 0.1]);
    
    let origin: "High School" | "University" | "Industrial" | "Foreign" | "Unknown" = "Unknown";
    if (age === 18) origin = "High School";
    else if (age === 22) origin = "University";
    else if (age >= 24) origin = "Industrial";

    const handedness = RandomUtils.chance(0.7) ? 'R' : 'L';
    
    // Speed: Normal distribution around 146km/h
    const speed = Math.round(RandomUtils.normal(146, 5));
    
    // Control: Normal around 6 (scale 0-15)
    // Rookies should be lower, maybe 3-9.
    const control = parseFloat(RandomUtils.clampedNormal(6, 2.5, 1, 15).toFixed(1));
    
    // Stamina: Normal around 7 (scale 0-15)
    const stamina = parseFloat(RandomUtils.clampedNormal(7, 3, 1, 15).toFixed(1));

    // Pitch Types
    const pitchTypesList = [
      "スライダー", "カットボール", "カーブ", "ドロップカーブ", 
      "フォーク", "SFF", "チェンジアップ", "サークルチェンジ", 
      "シュート", "高速シュート", "シンキングファスト", "高速シンカー"
    ];
    
    const numPitches = RandomUtils.weightedChoice([1, 2, 3, 4], [0.3, 0.4, 0.2, 0.1]);
    const selectedPitches: { name: string; value: number }[] = [];
    
    // Shuffle and pick
    const shuffled = [...pitchTypesList].sort(() => 0.5 - Math.random());
    for (let i = 0; i < numPitches; i++) {
      // Value: Normal around 100? (JSON had 126)
      // Let's say 50-150 range.
      const val = Math.round(RandomUtils.clampedNormal(100, 20, 40, 200));
      selectedPitches.push({ name: shuffled[i], value: val });
    }

    return {
      id: `draft_p_${Date.now()}_${index}`,
      name,
      position: 'P',
      handedness,
      age,
      origin,
      team: 'unknown' as any, // Not assigned yet
      stats: {
        average: 0, homeRuns: 0, rbi: 0, stolenBases: 0, obp: 0,
        hits: 0, atBats: 0, era: 0, wins: 0, losses: 0, saves: 0,
        inningsPitched: 0, strikeOuts: 0, earnedRuns: 0, walks: 0
      },
      abilities: {
        contact: 0, power: 0, speed: speed, arm: 0, fielding: 0,
        control, stamina,
        pitchTypes: selectedPitches,
        // Pitcher specific
        starterAptitude: RandomUtils.float(0, 5),
        relieverAptitude: RandomUtils.float(0, 5),
        closerAptitude: RandomUtils.float(0, 5),
        stuff: RandomUtils.float(0, 10),
        pitchingForm: "オーバースロー", // Simplified
        correctedPower: 0,
        correctedContact: 0,
        overall: 0 // To be calculated
      },
      contract: { salary: 500, yearsRemaining: 1, totalYears: 1, expirationYear: 1 },
      careerStats: { average: 0, homeRuns: 0, rbi: 0, stolenBases: 0, obp: 0, hits: 0, atBats: 0, era: 0, wins: 0, losses: 0, saves: 0, inningsPitched: 0, strikeOuts: 0, earnedRuns: 0, walks: 0 },
      recentForm: [],
      injuryStatus: 'healthy',
      morale: 50
    };
  }

  private static generateFielder(index: number): Player {
    const name = dbManager.generateRandomName();
    const age = RandomUtils.weightedChoice([18, 22, 24], [0.45, 0.45, 0.1]);

    let origin: "High School" | "University" | "Industrial" | "Foreign" | "Unknown" = "Unknown";
    if (age === 18) origin = "High School";
    else if (age === 22) origin = "University";
    else if (age >= 24) origin = "Industrial";

    const handedness = RandomUtils.weightedChoice(['R', 'L', 'B'], [0.6, 0.3, 0.1]) as "R" | "L" | "B";
    
    // Position
    const positions: Position[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
    const mainPos = RandomUtils.weightedChoice(positions, [0.1, 0.1, 0.15, 0.1, 0.15, 0.15, 0.1, 0.15]);

    // Stats (Scale 0-15)
    // Pros are ~10. Rookies ~4-8.
    const genStat = () => parseFloat(RandomUtils.clampedNormal(5, 2.5, 1, 15).toFixed(1));

    const contact = genStat();
    const power = genStat();
    const speed = genStat();
    const defense = genStat(); // Fielding
    const arm = genStat();
    const eye = genStat();

    // Aptitudes
    const aptitudes = {
      catcher: 0, first: 0, second: 0, third: 0, short: 0, outfield: 0
    };

    // Set main position aptitude
    const setApt = (pos: Position, val: number) => {
      if (pos === 'C') aptitudes.catcher = val;
      if (pos === '1B') aptitudes.first = val;
      if (pos === '2B') aptitudes.second = val;
      if (pos === '3B') aptitudes.third = val;
      if (pos === 'SS') aptitudes.short = val;
      if (['LF', 'CF', 'RF', 'OF'].includes(pos)) aptitudes.outfield = val;
    };

    setApt(mainPos, 10); // Main position is max aptitude

    // Random secondary aptitudes
    positions.forEach(p => {
      if (p !== mainPos && RandomUtils.chance(0.2)) {
        setApt(p, RandomUtils.float(0, 5));
      }
    });

    return {
      id: `draft_f_${Date.now()}_${index}`,
      name,
      position: mainPos,
      handedness,
      age,
      origin,
      team: 'unknown' as any,
      stats: {
        average: 0, homeRuns: 0, rbi: 0, stolenBases: 0, obp: 0,
        hits: 0, atBats: 0, era: 0, wins: 0, losses: 0, saves: 0,
        inningsPitched: 0, strikeOuts: 0, earnedRuns: 0, walks: 0
      },
      abilities: {
        contact, power, speed, arm, fielding: defense,
        defense, eye,
        bunt: genStat(),
        aggressiveness: genStat(),
        steal: genStat(),
        trajectory: RandomUtils.int(1, 4),
        experience: 0,
        pinchHitter: 0,
        rosterSlot: '',
        overall: 0
      },
      aptitudes,
      contract: { salary: 500, yearsRemaining: 1, totalYears: 1, expirationYear: 1 },
      careerStats: { average: 0, homeRuns: 0, rbi: 0, stolenBases: 0, obp: 0, hits: 0, atBats: 0, era: 0, wins: 0, losses: 0, saves: 0, inningsPitched: 0, strikeOuts: 0, earnedRuns: 0, walks: 0 },
      recentForm: [],
      injuryStatus: 'healthy',
      morale: 50
    };
  }
}
