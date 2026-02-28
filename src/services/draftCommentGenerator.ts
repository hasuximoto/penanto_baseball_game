
import { Player } from '@/types';
import { RandomUtils } from '@/utils/randomUtils';

type CommentFeature = {
    connective: string; // "～で、" "～く、"
    ending: string;     // "～だ。" "～い。"
};

export class DraftCommentGenerator {
    
    static generateComment(player: Player): string {
        
        let comment = "";
        if (player.position === 'P') {
            comment = this.generatePitcherComment(player);
        } else {
            comment = this.generateFielderComment(player);
        }

        // Prepend special statuses if they exist
        if (player.scoutInfo?.specialStatus && player.scoutInfo.specialStatus.length > 0) {
            const statusText = player.scoutInfo.specialStatus.join("、");
            // "ドラフト1位候補、甲子園優勝投手。最速152km/hの..."
            return `${statusText}。${comment}`;
        }

        return comment;
    }

    // Logic based on formula at index 123 of CellBall.xml
    private static generateFielderComment(player: Player): string {
        const s = player.scoutInfo;
        if (!s) return "将来性のある選手。";

        const contact = s.contact || 0;
        const power = s.power || 0;
        const speed = s.speedFielder || 0;
        const fielding = s.fielding || 0;
        
        const THRESHOLD = 10; // High evaluation threshold
        const GOOD_THRESHOLD = 7; // Good evaluation threshold

        const time50m = (9.0 - (speed/15) * 3.5).toFixed(1);

        // Collect feature descriptions
        const features: CommentFeature[] = [];
        
        // --- Contact ---
        if (contact > GOOD_THRESHOLD) {
            const isHigh = contact > THRESHOLD;
            if (isHigh) {
                features.push(RandomUtils.choice([
                    { connective: "打撃センスが素晴らしく", ending: "打撃センスが素晴らしい。" },
                    { connective: "ミート力が非常に高く", ending: "ミート力が非常に高い。" },
                    { connective: "バットコントロールが抜群で", ending: "バットコントロールが抜群だ。" }
                ]));
            } else {
                features.push(RandomUtils.choice([
                    { connective: "ミート力があり", ending: "ミート力がある。" },
                    { connective: "シュアな打撃が持ち味で", ending: "シュアな打撃が持ち味だ。" },
                    { connective: "広角に打ち分ける技術があり", ending: "広角に打ち分ける技術がある。" }
                ]));
            }
        }

        // --- Power ---
        if (power > GOOD_THRESHOLD) {
            const isHigh = power > THRESHOLD;
            if (isHigh) {
                features.push(RandomUtils.choice([
                    { connective: "長打力が最大の魅力で", ending: "長打力が最大の魅力だ。" },
                    { connective: "規格外のパワーを秘めており", ending: "規格外のパワーを秘めている。" },
                    { connective: "スイングスピードが速く", ending: "スイングスピードが速い。" }
                ]));
            } else {
                features.push(RandomUtils.choice([
                    { connective: "パンチ力があり", ending: "パンチ力がある。" },
                    { connective: "ツボにはまれば一発があり", ending: "ツボにはまれば一発がある。" },
                    { connective: "力強い打撃ができ", ending: "力強い打撃ができる。" }
                ]));
            }
        }

        // --- Speed ---
        if (speed > GOOD_THRESHOLD) {
            const isHigh = speed > THRESHOLD;
            if (isHigh) {
                features.push(RandomUtils.choice([
                    { connective: `50m${time50m}秒の俊足で`, ending: `50m${time50m}秒の俊足だ。` },
                    { connective: "圧倒的なスピードがあり", ending: "圧倒的なスピードがある。" },
                    { connective: "塁に出れば脅威となる足があり", ending: "塁に出れば脅威となる足がある。" }
                ]));
            } else {
                features.push(RandomUtils.choice([
                    { connective: "足が速く", ending: "足が速い。" },
                    { connective: "走塁センスが高く", ending: "走塁センスが高い。" },
                    { connective: "機動力が使え", ending: "機動力が使える。" }
                ]));
            }
        }

        // --- Fielding ---
        if (fielding > GOOD_THRESHOLD) {
            const isHigh = fielding > THRESHOLD;
            if (isHigh) {
                features.push(RandomUtils.choice([
                    { connective: "守備範囲が広く", ending: "守備範囲が広い。" },
                    { connective: "鉄壁の守備を誇り", ending: "鉄壁の守備を誇る。" },
                    { connective: "プロレベルの守備力があり", ending: "プロレベルの守備力がある。" }
                ]));
            } else {
                features.push(RandomUtils.choice([
                    { connective: "安定した守備ができ", ending: "安定した守備ができる。" },
                    { connective: "堅実な守備が光り", ending: "堅実な守備が光る。" },
                    { connective: "守備の動きが良く", ending: "守備の動きが良い。" }
                ]));
            }
        }

        // --- Generate Final Comment ---

        // Case 0: No special features (Average player)
        if (features.length === 0) {
            return RandomUtils.choice([
                "走攻守にバランスの取れた選手。",
                "堅実なプレーが持ち味。",
                "将来性豊かな選手。",
                "チームの力になれる素材。"
            ]);
        }

        // Case 1: One feature
        if (features.length === 1) {
            const feat = features[0];
            // Add some flavor prefix sometimes
            if (Math.random() < 0.3) {
                return "特に" + feat.ending;
            }
            return feat.ending;
        }

        // Case 2: Multiple features (Pick 2 random ones to combine)
        // Shuffle and pick 2
        const shuffled = features.sort(() => 0.5 - Math.random());
        const f1 = shuffled[0];
        const f2 = shuffled[1];

        // Combine f1 (connective) and f2 (ending)
        return `${f1.connective}、${f2.ending}`;
    }

    private static generatePitcherComment(player: Player): string {
        const s = player.scoutInfo;
        if (!s) return "本格派投手。";

        const speed = s.speed || 130;
        const control = s.control || 0;
        const stamina = s.stamina || 0;
        const breaking = s.breakingBall || 0;
        
        // Normalize speed to rank (0-15 equiv)
        const speedRank = Math.max(0, (speed - 130) / 2);

        const THRESHOLD = 10;
        const GOOD_THRESHOLD = 7; // Approx speed 144km/h

        const features: CommentFeature[] = [];

        // --- Speed ---
        if (speedRank > GOOD_THRESHOLD) {
            const isHigh = speedRank > THRESHOLD; // > 150km/h
            if (isHigh) {
                features.push(RandomUtils.choice([
                    { connective: `最速${speed}km/hの剛速球を投げ`, ending: `最速${speed}km/hの剛速球を投げる。` },
                    { connective: "威力抜群の直球が武器で", ending: "威力抜群の直球が武器だ。" },
                    { connective: "圧倒的な球威があり", ending: "圧倒的な球威がある。" }
                ]));
            } else {
                features.push(RandomUtils.choice([
                    { connective: "力のある直球を投げ", ending: "力のある直球を投げる。" },
                    { connective: `最速${speed}km/hの速球が魅力で`, ending: `最速${speed}km/hの速球が魅力だ。` },
                    { connective: "球質が重く", ending: "球質が重い。" }
                ]));
            }
        }

        // --- Control ---
        if (control > GOOD_THRESHOLD) {
            const isHigh = control > THRESHOLD;
            if (isHigh) {
                 features.push(RandomUtils.choice([
                    { connective: "針の穴を通すような制球力があり", ending: "針の穴を通すような制球力がある。" },
                    { connective: "抜群のコントロールを誇り", ending: "抜群のコントロールを誇る。" },
                    { connective: "コーナーを突く投球術に優れ", ending: "コーナーを突く投球術に優れる。" }
                ]));
            } else {
                 features.push(RandomUtils.choice([
                    { connective: "安定した制球力があり", ending: "安定した制球力がある。" },
                    { connective: "四死球が少なく", ending: "四死球が少ない。" },
                    { connective: "丁寧にコースを突くことができ", ending: "丁寧にコースを突くことができる。" }
                ]));
            }
        }

        // --- Breaking Ball ---
        if (breaking > GOOD_THRESHOLD) {
            const isHigh = breaking > THRESHOLD;
            if (isHigh) {
                 features.push(RandomUtils.choice([
                    { connective: "キレ味鋭い変化球が武器で", ending: "キレ味鋭い変化球が武器だ。" },
                    { connective: "多彩な変化球を操り", ending: "多彩な変化球を操る。" },
                    { connective: "絶対的な決め球を持っており", ending: "絶対的な決め球を持っている。" }
                ]));
            } else {
                 features.push(RandomUtils.choice([
                    { connective: "変化球のキレが良く", ending: "変化球のキレが良い。" },
                    { connective: "緩急を使った投球がうまく", ending: "緩急を使った投球がうまい。" },
                    { connective: "変化球でカウントが取れ", ending: "変化球でカウントが取れる。" }
                ]));
            }
        }

        // --- Stamina ---
        if (stamina > GOOD_THRESHOLD) {
            const isHigh = stamina > THRESHOLD;
            if (isHigh) {
                 features.push(RandomUtils.choice([
                    { connective: "無尽蔵のスタミナがあり", ending: "無尽蔵のスタミナがある。" },
                    { connective: "完投能力が高く", ending: "完投能力が高い。" },
                    { connective: "タフなマウンドさばきができ", ending: "タフなマウンドさばきができる。" }
                ]));
            } else {
                 features.push(RandomUtils.choice([
                    { connective: "スタミナがあり", ending: "スタミナがある。" },
                    { connective: "長いイニングを投げられ", ending: "長いイニングを投げられる。" },
                    { connective: "粘り強い投球ができ", ending: "粘り強い投球ができる。" }
                ]));
            }
        }

        // --- Generate Final Comment ---
        
        if (features.length === 0) {
            return RandomUtils.choice([
                "バランスの取れた投手。",
                "将来性が期待できる素材。",
                "大崩れしない安定感が持ち味。",
                "これから伸びる可能性がある。"
            ]);
        }

        if (features.length === 1) {
            const feat = features[0];
            return "特に" + feat.ending;
        }

        // Pick 2 random features
        const shuffled = features.sort(() => 0.5 - Math.random());
        const f1 = shuffled[0];
        const f2 = shuffled[1];

        return `${f1.connective}、${f2.ending}`;
    }
}
