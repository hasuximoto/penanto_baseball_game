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
  hitByPitch: number; // 追加
  strikeout: number;
  out: number;
}

export const calculateAtBatProbabilities = (
  pitcher: Player,
  batter: Player,
  style?: string
): PitchingStyleProbabilities => {
  // 能力値ベースの確率計算 (安定性重視)
  
  // 再々々々々々々調整: バランス仕上げ
  // 再々々々々々々々調整: 最終微調整
  // 現状: AVG .267 / ERA 3.79 / HR 1.10 / BB 3.21
  // 目標: AVG .262 / ERA 3.70-3.75 / HR 1.00 / BB 3.20
  // 対策: 
  // 1. 打率微減: .183 -> .181 (AVG .267 -> .262付近へ)
  // 2. HR係数微減: 1.10 -> 1.00へ (0.028 -> 0.026)
  // 3. これでERAが少し下がるが、3.70台ならOK
  const baseAvg = 0.181; 
  const batterContact = batter.abilities.contact || 10.0;
  
  // 打者補正: Contact 1につき +0.010 (基準8.0)
  const batterFactor = (batterContact - 8.0) * 0.010;
  
  // 投手補正: Control 1につき -0.007 (少し影響を戻す、四球と被安打抑制)
  const pitcherControl = pitcher.abilities.control || 10.0;
  const pitcherFactor = (pitcherControl - 10.0) * -0.007;

  // リリーフ適正補正 (中継ぎ・抑えは全力投球で能力以上の数字が出やすい)
  let reliefFactor = 0;
  // リリーフ補正を削除 (ERA改善のため、リリーフも平等に打たれるようにする)
  // if (pitcher.pitcherRole === 'reliever' || pitcher.pitcherRole === 'closer') {
  //     // 被打率を 1.5% 下げる
  //     reliefFactor = -0.015;
  // }

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

  // 投手球速による被安打率・被長打率抑制 (球威)
  const pitcherSpeed = pitcher.abilities.speed || 140.0;
  // 145km/h基準、+10km/hでヒット率-1%
  const speedHitFactor = (pitcherSpeed - 145.0) * -0.001;
  
  let hitProb = baseAvg + batterFactor + pitcherFactor + breakingBallHitFactor + speedHitFactor + reliefFactor;
  hitProb = Math.max(0.100, Math.min(0.450, hitProb)); // .100 - .450 の範囲に収める

  // HR率維持のための計算 (元の基準 .250 を使用)
  const originalBaseAvg = 0.250;
  let originalHitProb = originalBaseAvg + batterFactor + pitcherFactor + breakingBallHitFactor;
  originalHitProb = Math.max(0.100, Math.min(0.450, originalHitProb));

  // 2. 長打率の計算 (ヒット内の内訳)
  const batterPower = batter.abilities.power || 10.0;
  const batterSpeed = batter.abilities.speed || 10.0;
  const batterTrajectory = batter.abilities.trajectory || 2; // 弾道 1-4 (デフォルト2)

  // 長打率アップ: 得点力不足の解消
  let trajectoryHRMod = 0;
  let trajectoryDoubleMod = 0;
  
  if (batterTrajectory >= 3) {
      // 弾道3,4はHRが出やすいが、二塁打もものすごく出やすくする
      trajectoryHRMod = 0.06 + (batterTrajectory - 3) * 0.04;
      trajectoryDoubleMod = 0.31; // Double Mod adjusted again (.29 -> .31)
  } else if (batterTrajectory === 1) {
      // グラウンダーはHRが出にくい
      trajectoryHRMod = -0.05; 
      trajectoryDoubleMod = 0.00;
  } else {
      // ライナーは二塁打が出やすい
      trajectoryDoubleMod = 0.21; // Double Mod adjusted again (.20 -> .21)
  }

  // 球速によるホームラン抑制 (140km基準、+10kmでHR率-2%)
  const speedHREffect = Math.max(0, (pitcherSpeed - 140.0) * 0.002);

  // HR率 (対ヒット)
  // Power 10 = 10%, Power 20 = 30%
  let hrRatio = Math.max(0.01, 0.10 + (batterPower - 10.0) * 0.026); // 係数微減 .028 -> .026
  hrRatio = Math.max(0.005, hrRatio + breakingBallHRFactor + trajectoryHRMod - speedHREffect); 

  // 2塁打・3塁打率 (Speed依存)
  const tripleRatio = Math.max(0.005, 0.02 + (batterSpeed - 10.0) * 0.005);
  // 弾道が高いとフライが増えて2塁打も増える傾向
  let doubleRatio = Math.max(0.10, 0.20 + (batterSpeed - 10.0) * 0.01 + (batterPower - 10.0) * 0.005);
  doubleRatio += trajectoryDoubleMod;
  
  // HR確率は元の打率基準で計算（本塁打率維持）
  const homeRunProb = originalHitProb * hrRatio;
  
  // 他のヒットは新しい（低い）打率基準で計算
  const tripleProb = hitProb * tripleRatio;
  const doubleProb = hitProb * doubleRatio;
  
  // シングルヒットで調整
  let singleProb = Math.max(0, hitProb - homeRunProb - tripleProb - doubleProb);
  
  // 弾道1の場合はゴロ安打が増えるので単打を少し増やす
  if (batterTrajectory === 1) {
      singleProb *= 1.1; // 10%増
  }

  // 3. 四球・三振の計算
  const outProbTotal = 1.0 - hitProb;
  
  // 四球率
  // 選球眼 (Eye) と 積極性 (Aggressiveness) を反映
  const batterEye = batter.abilities.eye !== undefined ? batter.abilities.eye : (batter.abilities.contact || 2.5);
  const batterAgg = batter.abilities.aggressiveness !== undefined ? batter.abilities.aggressiveness : 2.5;

  // 近年の傾向に合わせて少し上げる (.08 -> .085)
  // ランナーを増やしてERAを少し悪化させる狙い
  // BB/9 (3.31) を少しだけ落ち着かせる: .079 -> .077
  const baseWalkRate = 0.077;
  
  // Eye 1につき +0.5% (基準2.5, 数値が高いほど選球眼が良い)
  const eyeFactor = (batterEye - 2.5) * 0.005;
  
  // Aggressiveness 1につき -0.5% (基準3, 積極的なほど四球が減る)
  const aggFactor = (batterAgg - 2.5) * -0.005;
  
  // Control 1につき -0.5%
  const controlFactor = (10.0 - pitcherControl) * 0.005;

  const walkProb = Math.max(0.02, Math.min(0.25, baseWalkRate + eyeFactor + aggFactor + controlFactor));
  
  // 死球率 (四球率の約7%程度と仮定して独立計算)
  // Controlが悪いと増え、Aggressivenessが高いと増える傾向
  const hbpProb = Math.max(0.001, (walkProb * 0.05) + ((20 - pitcherControl) * 0.0005));

  const remainingOut = Math.max(0, outProbTotal - walkProb - hbpProb);
  
  // 三振率
  // Pitcher Speed (球速) と Batter Contact
  const baseKRate = 0.19; // .18 -> .19 アップ
  
  // 球速 146km/h 基準, +10km/h で +9%
  const speedFactor = (pitcherSpeed - 146.0) * 0.009;
  // Contact 10 基準, +10 で -10% (コンタクトの影響を強める：三振調整)
  const contactKFactor = (batterContact - 10.0) * -0.010;
  
  // Aggressiveness 1につき +0.5% (積極的なほど三振が減る)
  const aggKFactor = (batterAgg - 2.5) * -0.005;
  
  // Eye 1につき -0.5% (選球眼が良いほど三振が減る)
  const eyeKFactor = (batterEye - 2.5) * -0.005;

  let kRate = Math.max(0.05, Math.min(0.40, baseKRate + speedFactor + contactKFactor + breakingBallKFactor + aggKFactor + eyeKFactor));
  kRate = kRate * 0.9;

  const strikeoutProb = Math.min(remainingOut * 0.9, remainingOut * (kRate / (1-hitProb-walkProb-hbpProb))); // アウトの中での割合
  
  let normalOutProb = Math.max(0, remainingOut - strikeoutProb);

  // 三振以外のアウト確率を下げる (インプレー打球のヒット化リスク)
  // 投手の球速(球威)に基づいて係数を変動させる
  // 158km/h以上ならリスク小(0.96)、130km/h以下ならリスク大(0.88)
  // 球が遅いと、バットに当てられたときに凡打がヒットになりやすい
  // 打高化対応: 少し係数を上げる（ヒットになりやすくする）
  const minSpeedLimit = 130.0;
  const maxSpeedLimit = 158.0; 
  
  let speedRatio = (pitcherSpeed - minSpeedLimit) / (maxSpeedLimit - minSpeedLimit);
  speedRatio = Math.max(0, Math.min(1.0, speedRatio));

  // 再々々々々々々調整: BABIP適正化
  // ヒット率: 16-8% -> 15-7% に戻さないとAVG.274は高すぎる
  // しかしERA維持のためにはヒットが必要。
  // -> 二塁打率を上げたので、単打(ここ)は少し絞る。
  // ユーザー要望: BABIP .310以下だが、投手有利にはしない
  // 対策: BABIPを下げる(単打削減)が、長打と四球を増やす
  const minReduction = 0.86; // 0.83 -> 0.86 (Out化しやすくする)
  const maxReduction = 0.935; // 0.915 -> 0.935
  const outReductionFactor = minReduction + (maxReduction - minReduction) * speedRatio;
  
  const reducedOutProb = normalOutProb * outReductionFactor;
  const diff = normalOutProb - reducedOutProb;
  
  // 減少分(凡打がヒットになった分)はシングルヒットに加算
  normalOutProb = reducedOutProb;
  const finalSingleProb = singleProb + diff;

  return {
    homeRun: homeRunProb,
    triple: tripleProb,
    double: doubleProb,
    single: finalSingleProb,
    walk: walkProb,
    hitByPitch: hbpProb, // 追加
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
