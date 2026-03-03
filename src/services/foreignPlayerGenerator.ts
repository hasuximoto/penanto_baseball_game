import { Player, Position, TeamId } from '../types';
import { RandomUtils } from '../utils/randomUtils';
import FOREIGN_NAME_MASTER from '../data/foreignNameMaster.json';
import { CONTRACT_BALANCE_CONSTANTS } from '../utils/constants';

export class ForeignPlayerGenerator {

  // Katakana names for more realism in a Japanese game context
  static generateRandomForeignNameKatakana(): string {
    const lastNames = FOREIGN_NAME_MASTER.lastNames;
    const firstNames = FOREIGN_NAME_MASTER.firstNames;
    
    // Usually only Last Name is shown in lists, or "F.Last".
    // Let's use "First・Last" format.
    const last = RandomUtils.choice(lastNames);
    const first = RandomUtils.choice(firstNames);
    return `${first}・${last}`;
  }

  static generateCandidates(count: number): Player[] {
    const candidates: Player[] = [];
    
    // Ratio: 40% Pitcher, 60% Fielder (Foreigners are often power hitters)
    const pitcherCount = Math.floor(count * 0.4);
    const fielderCount = count - pitcherCount;

    for (let i = 0; i < pitcherCount; i++) {
        candidates.push(this.generatePitcher(candidates.length));
    }

    for (let i = 0; i < fielderCount; i++) {
        candidates.push(this.generateFielder(candidates.length));
    }

    return candidates;
  }

  private static generatePitcher(index: number): Player {
    const name = this.generateRandomForeignNameKatakana();
    const age = RandomUtils.int(24, 34);
    const throwHand = RandomUtils.chance(0.7) ? 1 : 2;
    const batHand = RandomUtils.weightedChoice([1, 2, 3], [0.7, 0.25, 0.05]) as 1 | 2 | 3;
    
    // High velocity - simplify to integer range to avoid normal distribution issues
    const speed = RandomUtils.int(148, 162);
    
    // Control varies wildy
    const control = parseFloat(RandomUtils.clampedNormal(5, 3, 1, 15).toFixed(1)); // Usually lower control
    const stamina = parseFloat(RandomUtils.clampedNormal(8, 3, 1, 15).toFixed(1));
    
    const role = RandomUtils.weightedChoice(['starter', 'reliever', 'closer'], [0.4, 0.4, 0.2]);

    // Pitch Types
    const pitchTypesList = [
      "スライダー", "カットボール", "カーブ", "ドロップカーブ", 
      "フォーク", "SFF", "チェンジアップ", "サークルチェンジ", 
      "シュート", "高速シュート", "シンキングファスト", "高速シンカー"
    ];
    
    // Foreign players often have fewer but stronger pitches or specific breaking balls
    // Ensure at least 1 pitch
    const numPitches = RandomUtils.int(2, 4);
    const selectedPitches: { name: string; value: number }[] = [];
    
    // Shuffle and pick
    const shuffled = [...pitchTypesList].sort(() => 0.5 - Math.random());
    for (let i = 0; i < numPitches; i++) {
        // Value between 50 and 200
        const val = RandomUtils.int(80, 180);
        selectedPitches.push({ name: shuffled[i], value: val });
    }
    
    if (selectedPitches.length === 0) {
        selectedPitches.push({ name: "スライダー", value: 130 });
    }

    // DEBUG LOG
    console.log(`Generating Foreign Pitcher: ${name}, Speed: ${speed}, Pitches: ${selectedPitches.length}`);

    // Abilities (Ensure pitchTypes is explicitly set)
    const stats: any = {};
    const abilities = {
        contact: 0, power: 0, speed: speed, arm: 0, fielding: 0,
        control, stamina,
        speedFielder: 0, trajectory: 0,
        overall: 0,
        pitchTypes: [...selectedPitches], // Copy to be safe
        starterAptitude: role === 'starter' ? RandomUtils.float(3, 5) : RandomUtils.float(0, 3),
        relieverAptitude: role === 'reliever' ? RandomUtils.float(3, 5) : RandomUtils.float(0, 3),
        closerAptitude: role === 'closer' ? RandomUtils.float(3, 5) : RandomUtils.float(0, 3),
        stuff: RandomUtils.float(5, 10),
        pitchingForm: "オーバースロー",
        correctedPower: 0,
        correctedContact: 0
    };

    // Calculate Salary based on ability (rough estimate)
    const baseSalary = 5000; // 50 million yen
    const performanceBonus = (speed - 150) * 500 + (control * 200) + (role === 'starter' ? 2000 : 0);
    const salary = Math.max(3000, Math.round(baseSalary + performanceBonus));

    const id = `foreign_p_${Date.now()}_${index}`;

    return {
        id,
        name,
        position: 'P',
        throwHand,
        batHand,
        age,
        team: 'free_agent',
        origin: 'Foreign',
        isForeign: true,
        stats,
        abilities,
        scoutInfo: {
            speed: speed,
            control: control, // Assuming perfect info for foreign players for now, or add noise if needed
            stamina: stamina
        },
        contract: {
            salary,
            yearsRemaining: 0,
            totalYears: 0,
            expirationYear: 0
        },
        careerStats: {} as any,
        recentForm: [],
        injuryStatus: 'healthy',
        morale: 50,
        teamLoyalty: CONTRACT_BALANCE_CONSTANTS.DEFAULT_TEAM_LOYALTY,
        pitcherRole: role as any
    };
  }

  private static generateFielder(index: number): Player {
    const name = this.generateRandomForeignNameKatakana();
    const age = RandomUtils.int(24, 34);
    const throwHand = RandomUtils.weightedChoice([1, 2], [0.7, 0.3]) as 1 | 2;
    const batHand = RandomUtils.weightedChoice([1, 2, 3], [0.6, 0.3, 0.1]) as 1 | 2 | 3;
    
    const position = RandomUtils.weightedChoice(
        ['1B', '3B', 'LF', 'RF', 'DH', '2B', 'OF'], 
        [0.3, 0.2, 0.2, 0.2, 0.05, 0.05, 0.0]
    ) as Position;

    // Power hitter stats
    const power = parseFloat(RandomUtils.clampedNormal(10, 2.5, 5, 15).toFixed(1));
    const contact = parseFloat(RandomUtils.clampedNormal(5, 2.5, 1, 12).toFixed(1));
    const speed = parseFloat(RandomUtils.clampedNormal(6, 2, 1, 15).toFixed(1));
    const defense = parseFloat(RandomUtils.clampedNormal(5, 2, 1, 12).toFixed(1)); // Fielding

    const stats: any = {};
    const abilities = {
        contact, power, speed, arm: defense + 1, fielding: defense,
        control: 0, stamina: 0,
        eye: parseFloat(RandomUtils.clampedNormal(5, 2, 1, 10).toFixed(1)),
        bunt: 2, // Usually low
        trajectory: 3 + (power > 10 ? 1 : 0),
        overall: 0,
        pitchTypes: []
    };

     // Calculate Salary
    const baseSalary = 5000;
    const performanceBonus = (power * 500) + (contact * 300);
    const salary = Math.max(3000, Math.round(baseSalary + performanceBonus));

    const id = `foreign_f_${Date.now()}_${index}`;

    return {
        id,
        name,
        position,
        throwHand,
        batHand,
        age,
        team: 'free_agent',
        origin: 'Foreign',
        isForeign: true,
        stats,
        abilities,
        contract: {
            salary,
            yearsRemaining: 0,
            totalYears: 0,
            expirationYear: 0
        },
        careerStats: {} as any,
        recentForm: [],
        injuryStatus: 'healthy',
        morale: 50,
        teamLoyalty: CONTRACT_BALANCE_CONSTANTS.DEFAULT_TEAM_LOYALTY
    };
  }
}
