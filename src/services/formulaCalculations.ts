/**
 * Excel 数式から変換された具体的なゲームロジック
 * SimBaseBall.xml の複雑な数式を実装
 */

import { Player, PlayerStats, GameState } from '../types';

/**
 * 選手の打率を計算
 * 数式: TEXT([$選手データ.BE]/[$選手データ.BD], ".000")
 * BE = ヒット数、BD = 打席数
 */
export const calculateBattingAverage = (playerStats: PlayerStats): number => {
  const atBats = playerStats.atBats ?? 0;
  if (atBats === 0) return 0;
  const hits = playerStats.hits ?? 0;
  return hits / atBats;
};

/**
 * 投手の防御率を計算
 * 数式: TEXT(VLOOKUP(...BE.../...BD...*9, "0.00")
 * 防御率 = (失点 * 9) / 投球回数
 */
export const calculateERA = (playerStats: PlayerStats): number => {
  const pitchingInnings = playerStats.pitchingInnings ?? playerStats.inningsPitched ?? 0;
  if (pitchingInnings === 0) return 0;
  const earnedRuns = playerStats.earnedRuns ?? 0;
  return (earnedRuns * 9) / pitchingInnings;
};

/**
 * 長打率を計算
 * 数式: TEXT(...BE.../.BD...*9, "0.00")
 * 実質的には OPS 関連の計算
 */
export const calculateSluggingPercentage = (playerStats: PlayerStats): number => {
  const atBats = playerStats.atBats ?? 0;
  if (atBats === 0) return 0;
  const totalBases = (playerStats.singles ?? 0) +
                     (playerStats.doubles ?? 0) * 2 +
                     (playerStats.triples ?? 0) * 3 +
                     (playerStats.homeRuns ?? 0) * 4;
  return totalBases / atBats;
};

/**
 * 出塁率を計算
 * 数式: IF(VLOOKUP(...) <= ..., 分母はAT-BAT数)
 */
export const calculateOnBasePercentage = (playerStats: PlayerStats): number => {
  const atBats = playerStats.atBats ?? 0;
  const walks = playerStats.walks ?? 0;
  const hitByPitch = playerStats.hitByPitch ?? 0;
  const plateAppearances = atBats + walks + hitByPitch;
  if (plateAppearances === 0) return 0;
  const hits = playerStats.hits ?? 0;
  const onBase = hits + walks + hitByPitch;
  return onBase / plateAppearances;
};

/**
 * ランク計算
 * 数式: RANK([.IE2],[.IE:.IE],IF(AND([.C$47]=2,[.D$47]=1),1,0))
 * IE列の値に基づくランキング
 */
export const calculateRank = (values: number[], currentValue: number, ascending: boolean = false): number => {
  if (!values.includes(currentValue)) return 0;

  const sortedValues = [...new Set(values)]
    .sort((a, b) => ascending ? a - b : b - a);

  const rank = sortedValues.indexOf(currentValue) + 1;
  return rank;
};

/**
 * 条件付きランキング（複数条件）
 * 数式: IF(AND([.C$47]=2,[.D$47]=1),1,0)
 * 複数の条件に基づくランキングオプション
 */
interface RankingCondition {
  seasonMode: number;
  displayMode: number;
}

export const calculateConditionalRank = (
  values: number[],
  currentValue: number,
  condition: RankingCondition
): number => {
  if (condition.seasonMode === 2 && condition.displayMode === 1) {
    // 昇順ランキング
    const sortedValues = [...new Set(values)].sort((a, b) => a - b);
    return sortedValues.indexOf(currentValue) + 1;
  } else {
    // 降順ランキング
    const sortedValues = [...new Set(values)].sort((a, b) => b - a);
    return sortedValues.indexOf(currentValue) + 1;
  }
};

/**
 * VLOOKUP 相当：データテーブルからの検索
 * 数式: VLOOKUP([$選手データ.AM3],[.O$20:.P$25],2,FALSE())
 */
export interface LookupTable {
  keys: (string | number)[];
  values: (string | number)[][];
}

export const vlookup = (
  searchValue: string | number,
  table: LookupTable,
  columnIndex: number,
  exactMatch: boolean = true
): string | number | undefined => {
  const keyIndex = table.keys.indexOf(searchValue);

  if (keyIndex === -1) {
    if (exactMatch) return undefined;
    // 近似マッチの場合、最も近い値を返す
    if (typeof searchValue === 'number') {
      let closestIndex = 0;
      let closestDiff = Math.abs((table.keys[0] as number) - searchValue);

      for (let i = 1; i < table.keys.length; i++) {
        const diff = Math.abs((table.keys[i] as number) - searchValue);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestIndex = i;
        }
      }

      return table.values[closestIndex]?.[columnIndex - 1];
    }

    return undefined;
  }

  return table.values[keyIndex]?.[columnIndex - 1];
};

/**
 * HLOOKUP 相当：水平方向の検索
 */
export interface HorizontalLookupTable {
  headers: (string | number)[];
  rows: (string | number)[][];
}

export const hlookup = (
  searchValue: string | number,
  table: HorizontalLookupTable,
  rowIndex: number,
  exactMatch: boolean = true
): string | number | undefined => {
  const colIndex = table.headers.indexOf(searchValue);

  if (colIndex === -1) {
    if (exactMatch) return undefined;
    return undefined;
  }

  return table.rows[rowIndex - 1]?.[colIndex];
};

/**
 * CHOOSE 相当：複数条件分岐
 * 数式: CHOOSE([.D$47], option1, option2, option3, ...)
 */
export const choose = (index: number, ...options: any[]): any => {
  if (index < 1 || index > options.length) return undefined;
  return options[index - 1];
};

/**
 * LARGE 相当：n番目に大きい値を取得
 * 数式: LARGE([.IH:.IH], ROW()-1)
 */
export const large = (values: number[], k: number): number => {
  const sorted = [...values].sort((a, b) => b - a);
  return sorted[k - 1] || 0;
};

/**
 * TEXT 相当：テキストフォーマット
 * 数式: TEXT(..., ".000") / TEXT(..., "#")
 */
export const formatText = (value: number, format: string): string => {
  if (format === '.000') {
    return value.toFixed(3);
  }
  if (format === '.00') {
    return value.toFixed(2);
  }
  if (format === '#') {
    return Math.round(value).toString();
  }
  if (format === '0.00') {
    return value.toFixed(2);
  }
  if (format === '0000万円') {
    const millions = Math.floor(value / 10000);
    return `${millions}万円`;
  }
  if (format === '0億0000万円') {
    const billions = Math.floor(value / 100000000);
    const millions = Math.floor((value % 100000000) / 10000);
    return `${billions}億${millions}万円`;
  }
  return value.toString();
};

/**
 * 複雑なCHOOSE+IF+VLOOKUP の組み合わせ
 * 数式: CHOOSE(..., IF(...VLOOKUP(...) <= ..., ...), [...])
 * 
 * 打者の期待値：複数の条件に基づいて異なる統計値を返す
 */
export const calculateExpectedPlayerValue = (
  playerData: any,
  lookupTables: {
    positionTable: LookupTable;
    competitionTable: LookupTable;
  },
  modeSelector: number
): string => {
  // 選手の競技タイプを確認
  const positionLookup = vlookup(playerData.positionId, lookupTables.positionTable, 2);
  const isSpecialPosition = positionLookup !== undefined && (positionLookup as number) > 0;

  if (!isSpecialPosition) {
    return '';
  }

  // モード選択に基づいて異なる統計を返す
  switch (modeSelector) {
    case 1:
      // 投手用統計
      if (playerData.pitchingInnings > 0) {
        const era = calculateERA(playerData);
        const wins = playerData.wins || 0;
        const losses = playerData.losses || 0;
        const saves = playerData.saves || 0;
        return `${playerData.pitchingInnings}回 防御率${era.toFixed(2)} ${wins}勝${losses}敗${saves}S`;
      }
      return '出場なし';

    case 2:
      // 打者用統計
      if (playerData.atBats > 0) {
        const avg = calculateBattingAverage(playerData);
        const homeRuns = playerData.homeRuns || 0;
        const runs = playerData.runsScored || 0;
        const steals = playerData.stolenBases || 0;
        return `${playerData.atBats}打席 ${avg.toFixed(3)} ${homeRuns}本 ${runs}点 ${steals}盗`;
      }
      return '出場なし';

    default:
      return '';
  }
};

/**
 * 複雑な出場可否判定
 * 数式: IF(OR($選手データ.AJ3="",AND(NOT(.IR$12),LEN($選手データ.Z3)>1),...),,"")
 * 
 * 複数の除外条件をチェック
 */
export interface PlayerEligibilityRules {
  requiresMinLevel: boolean;
  requiresExperience: boolean;
  requiresSpecialQualification: boolean;
  ageMinimum?: number;
  experienceMinimum?: number;
}

export const isPlayerEligible = (player: Player, rules: PlayerEligibilityRules): boolean => {
  // 基本情報が未設定
  if (!player.id || player.id === '') return false;

  // 必須レベル確認
  if (rules.requiresMinLevel && (player.level || 0) < 1) return false;

  // 経験年数確認
  if (rules.requiresExperience && (player.yearsExperience || 0) < 1) return false;

  // 特別資格確認
  if (rules.requiresSpecialQualification && !player.specialQualification) return false;

  // 年齢制限
  if (rules.ageMinimum && (player.age || 0) < rules.ageMinimum) return false;

  return true;
};

/**
 * 打席結果の確率計算
 * 数式: IF(LEN($選手データ.Z3)=1, VALUE(MID($選手データ.BT3,138,3)), 0)
 * 
 * 投手の投球スタイルに基づいた対打者結果の確率
 */
export interface PitchingStyleProbabilities {
  homeRun: number;
  triple: number;
  double: number;
  single: number;
  walk: number;
  strikeout: number;
  out: number;
}

export const calculateAtBatProbabilities = (
  pitcher: Player,
  batter: Player,
  style?: string
): PitchingStyleProbabilities => {
  // 能力値ベースの確率計算 (安定性重視)
  
  // 1. 基本打率の計算
  // 基準: Contact 10.0 = .200 (打高投低の是正のため .250 -> .200)
  const baseAvg = 0.210;
  const batterContact = batter.abilities.contact || 10.0;
  const pitcherControl = pitcher.abilities.control || 10.0;
  
  // 打者補正: Contact 1につき +0.010
  const batterFactor = (batterContact - 10.0) * 0.010;
  
  // 投手補正: Control 1につき -0.010
  const pitcherFactor = (pitcherControl - 10.0) * -0.010;

  // 変化球補正 (Master Data Integration)
  let breakingBallHitFactor = 0;
  let breakingBallKFactor = 0;
  let breakingBallHRFactor = 0;
  
  if (pitcher.abilities.pitchTypes && pitcher.abilities.pitchTypes.length > 0) {
    // マスタデータを読み込み
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pitchMasterData = require('../data/pitch_master.json');

    let totalWhiff = 0;
    let totalGround = 0;
    let totalValue = 0;

    pitcher.abilities.pitchTypes.forEach(p => {
        const master = pitchMasterData.find((m: any) => m.name === p.name);
        // 見つからない場合はデフォルト値（平均的な球種）を使用
        const whiff = master ? master.whiffMod : 5; 
        const ground = master ? master.groundBallMod : 5; 
        
        // 球種の質（Value）による重み付け
        // p.value はおよそ 0-150 のスケール（S-Gランク換算）を想定
        // 値を重みとして使用
        const weight = p.value || 10;
        
        totalWhiff += whiff * weight;
        totalGround += ground * weight;
        totalValue += weight;
    });

    if (totalValue > 0) {
        const avgWhiff = totalWhiff / totalValue; // 0-10 のスケール
        const avgGround = totalGround / totalValue; // 0-10 のスケール
        
        // 空振り率は奪三振率に影響
        // 基準値 5。5を超える1ポイントごとに奪三振率が 1% 上昇
        // 最大効果: (10-5)*0.01 = +0.05 (5%)
        breakingBallKFactor = (avgWhiff - 4) * 0.01;
        
        // ゴロ率は被安打率に影響（安打減少）
        // 基準値 5。5を超える1ポイントごとに被安打率が 0.5% 減少
        breakingBallHitFactor = (avgGround - 4) * -0.005;
        
        // ゴロ率は被本塁打率に影響（HR減少）
        // 基準値 5。5を超える1ポイントごとに被本塁打率が 1% 減少
        breakingBallHRFactor = (avgGround - 4) * -0.01;
    }
  }
  
  let hitProb = baseAvg + batterFactor + pitcherFactor + breakingBallHitFactor;
  hitProb = Math.max(0.100, Math.min(0.450, hitProb)); // .100 - .450 の範囲に収める

  // HR率維持のための計算 (元の基準 .250 を使用)
  const originalBaseAvg = 0.250;
  let originalHitProb = originalBaseAvg + batterFactor + pitcherFactor + breakingBallHitFactor;
  originalHitProb = Math.max(0.100, Math.min(0.450, originalHitProb));

  // 2. 長打率の計算 (ヒット内の内訳)
  const batterPower = batter.abilities.power || 10.0;
  const batterSpeed = batter.abilities.speed || 10.0;
  
  // HR率 (対ヒット)
  // Power 10 = 10%, Power 20 = 30%
  let hrRatio = Math.max(0.01, 0.10 + (batterPower - 10.0) * 0.03);
  hrRatio = Math.max(0.005, hrRatio + breakingBallHRFactor); // Apply ground ball factor

  // 2塁打・3塁打率 (Speed依存)
  const tripleRatio = Math.max(0.005, 0.02 + (batterSpeed - 10.0) * 0.005);
  const doubleRatio = Math.max(0.10, 0.20 + (batterSpeed - 10.0) * 0.01 + (batterPower - 10.0) * 0.005);
  
  // HR確率は元の打率基準で計算（本塁打率維持）
  const homeRunProb = originalHitProb * hrRatio;
  
  // 他のヒットは新しい（低い）打率基準で計算
  const tripleProb = hitProb * tripleRatio;
  const doubleProb = hitProb * doubleRatio;
  
  // シングルヒットで調整
  const singleProb = Math.max(0, hitProb - homeRunProb - tripleProb - doubleProb);

  // 3. 四球・三振の計算
  const outProbTotal = 1.0 - hitProb;
  
  // 四球率
  // 選球眼 (Eye) と 積極性 (Aggressiveness) を反映
  const batterEye = batter.abilities.eye !== undefined ? batter.abilities.eye : (batter.abilities.contact || 2.5);
  const batterAgg = batter.abilities.aggressiveness !== undefined ? batter.abilities.aggressiveness : 2.5;

  const baseWalkRate = 0.08;
  
  // Eye 1につき +0.5% (基準2.5, 数値が高いほど選球眼が良い)
  const eyeFactor = (batterEye - 2.5) * 0.005;
  
  // Aggressiveness 1につき -0.5% (基準3, 積極的なほど四球が減る)
  const aggFactor = (batterAgg - 2.5) * -0.005;
  
  // Control 1につき -0.5%
  const controlFactor = (10.0 - pitcherControl) * 0.005;

  const walkProb = Math.max(0.02, Math.min(0.25, baseWalkRate + eyeFactor + aggFactor + controlFactor));
  
  const remainingOut = Math.max(0, outProbTotal - walkProb);
  
  // 三振率
  // Pitcher Speed (球速) と Batter Contact
  const pitcherSpeed = pitcher.abilities.speed || 140.0; // km/h
  const baseKRate = 0.18;
  
  // 球速 146km/h 基準, +10km/h で +9%
  const speedFactor = (pitcherSpeed - 146.0) * 0.009;
  // Contact 10 基準, +10 で -5%
  const contactKFactor = (batterContact - 10.0) * -0.005;
  
  // Aggressiveness 1につき +0.5% (積極的なほど三振が減る)
  const aggKFactor = (batterAgg - 2.5) * -0.005;
  
  // Eye 1につき -0.5% (選球眼が良いほど三振が減る)
  const eyeKFactor = (batterEye - 2.5) * -0.005;

  let kRate = Math.max(0.05, Math.min(0.40, baseKRate + speedFactor + contactKFactor + breakingBallKFactor + aggKFactor + eyeKFactor));
  kRate = kRate * 0.9;

  const strikeoutProb = Math.min(remainingOut * 0.9, remainingOut * (kRate / (1-hitProb-walkProb))); // アウトの中での割合
  
  let normalOutProb = Math.max(0, remainingOut - strikeoutProb);

  // 三振以外のアウト確率を下げる (三振が取れない投手の価値を下げるため)
  // 減少分は単打(single)に加算する
  const outReductionFactor = 0.88; // 12%削減
  const reducedOutProb = normalOutProb * outReductionFactor;
  const diff = normalOutProb - reducedOutProb;
  
  normalOutProb = reducedOutProb;

  return {
    homeRun: homeRunProb,
    triple: tripleProb,
    double: doubleProb,
    single: singleProb + diff,
    walk: walkProb,
    strikeout: strikeoutProb,
    out: normalOutProb
  };
};

/**
 * 複合スコア計算：複数の要因を組み合わせたランキング
 * 数式: 1-ROW()/1000+CHOOSE(...)
 * 
 * ソート用のスコア：行番号、モード、複数の統計値を組み合わせ
 */
export const calculateCompositeScore = (
  playerData: Player & PlayerStats,
  rowNumber: number,
  modeChoice: number,
  modeMultiplier: number = 1
): number => {
  // ベーススコア：行番号ペナルティを含む
  const baseScore = 1 - (rowNumber / 1000);

  // モード別ボーナス
  let modeBonus = 0;
  switch (modeChoice) {
    case 1: // 投手
      modeBonus = calculateERA(playerData) * modeMultiplier;
      break;
    case 2: // 打者
      modeBonus = (calculateBattingAverage(playerData) + calculateSluggingPercentage(playerData)) * modeMultiplier;
      break;
    case 3: // 守備力
      modeBonus = (playerData.abilities?.fielding || 0) * modeMultiplier;
      break;
    case 4: // スピード
      modeBonus = (playerData.abilities?.speed || 0) * modeMultiplier;
      break;
    default:
      break;
  }

  return baseScore + modeBonus;
};

/**
 * 日付と曜日の表示フォーマット
 * 数式: ="年"&MONTH(...)&"月"&DAY(...)&"日"&CHOOSE(WEEKDAY(...),...)
 */
export const formatGameDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekDay = weekDays[date.getDay()];

  // 時間帯判定（試合の時間）
  const hour = date.getHours();
  const period = hour < 12 ? '午前' : '午後';

  return `${year}年${month}月${day}日(${weekDay}) ${period}`;
};
