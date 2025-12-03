import { Player } from '../types';
import { dbManager } from './databaseManager';

export class SpringCampManager {
  /**
   * 全チームの春季キャンプ処理を実行する
   * 選手の能力を年齢に応じて変動させる
   */
  static async processSpringCamp(): Promise<string[]> {
    const logs: string[] = [];
    const teams = await dbManager.getInitialTeams();
    const allPlayers: Player[] = [];

    for (const team of teams) {
      logs.push(`=== ${team.name} 春季キャンプ ===`);
      const roster = await dbManager.getTeamRoster(team.id);
      
      for (const player of roster) {
        const { updatedPlayer, changes } = this.trainPlayer(player);
        allPlayers.push(updatedPlayer);
        
        if (changes.length > 0) {
           logs.push(`${player.name}: ${changes.join(', ')}`);
        }
      }
    }
    
    // 一括更新
    await dbManager.updatePlayers(allPlayers);
    return logs;
  }

  /**
   * 個別選手の能力変動計算
   */
  private static trainPlayer(player: Player): { updatedPlayer: Player, changes: string[] } {
    const newAbilities = { ...player.abilities };
    const changes: string[] = [];
    const age = player.age;

    // 年齢に基づく成長・衰退確率の設定
    let growthChance = 0.0;
    let declineChance = 0.0;

    if (age < 23) {
        growthChance = 0.60; // 若手: 成長しやすい
        declineChance = 0.05;
    } else if (age < 28) {
        growthChance = 0.40; // 中堅手前: まだ伸びる
        declineChance = 0.10;
    } else if (age < 33) {
        growthChance = 0.15; // ベテラン: 維持がメイン
        declineChance = 0.20;
    } else {
        growthChance = 0.05; // 大ベテラン: 衰えやすい
        declineChance = 0.50;
    }

    // 変動対象の能力パラメータ
    // 投手・野手共通または固有のパラメータをリストアップ
    // 弾道、選球眼、バント、盗塁、球威は変動しない
    const abilityKeys: (keyof typeof player.abilities)[] = [
        'contact', 'power', 'speed', 'arm', 'fielding', 
        'control', 'stamina'
    ];

    abilityKeys.forEach(key => {
        // 値が存在し、数値である場合のみ処理
        if (typeof newAbilities[key] === 'number') {
            const currentVal = newAbilities[key] as number;
            let change = 0;
            const rand = Math.random();

            if (rand < growthChance) {
                // 成長: 0.1 ~ 1.5 の範囲でランダム (小刻みに)
                let rawChange = 0.1 + Math.random() * 1.4;

                // 能力が上限に近づくにつれて上がりにくくする補正
                if (key === 'speed' && player.position === 'P') {
                    // 投手球速 (Max 170)
                    if (currentVal >= 160) rawChange *= 0.1;
                    else if (currentVal >= 155) rawChange *= 0.2;
                    else if (currentVal >= 150) rawChange *= 0.5;
                } else {
                    // その他 (Max 15)
                    if (currentVal >= 14) rawChange *= 0.1;
                    else if (currentVal >= 12) rawChange *= 0.5;
                    else if (currentVal >= 10) rawChange *= 0.8;
                }

                change = rawChange;
            } else if (rand < growthChance + declineChance) {
                // 衰退: -0.1 ~ -1.5 の範囲でランダム
                change = (0.1 + Math.random() * 1.4) * -1;
            }
            // それ以外は変動なし

            if (change !== 0) {
                let newVal = currentVal + change;
                
                // 小数点第二位で四捨五入 (小数点第一位まで残す)
                newVal = Math.round(newVal * 10) / 10;
                
                // 値の範囲制限 (0を下回らないように)
                newVal = Math.max(0, newVal);
                
                // 上限チェック
                if (key === 'speed' && player.position === 'P') {
                    // 投手球速: 170km/h上限 (例外)
                    newVal = Math.min(170, newVal);
                } else {
                    // 野手の走力、およびその他の能力: 15上限
                    newVal = Math.min(15, newVal);
                }

                if (newVal !== currentVal) {
                    newAbilities[key] = newVal;
                    
                    // 実際の変動幅を計算
                    const actualChange = Math.round((newVal - currentVal) * 10) / 10;
                    
                    // ログ用フォーマット
                    const sign = actualChange > 0 ? '+' : '';
                    changes.push(`${key} ${sign}${actualChange.toFixed(1)}`);
                }
            }
        }
    });

    return {
        updatedPlayer: { ...player, abilities: newAbilities },
        changes
    };
  }
}
