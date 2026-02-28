import { Player } from '@/types';
import { RandomUtils } from '@/utils/randomUtils';

/**
 * Assigns special statuses (labels) to draft candidates based on their relative strength in the pool.
 */
export class DraftStatusAssigner {
    
    static assignStatuses(candidates: Player[]) {
        // Calculate temporary scores for ranking
        const scoredCandidates = candidates.map(p => ({
            player: p,
            score: this.calculateScore(p)
        }));

        // Sort by score descending
        scoredCandidates.sort((a, b) => b.score - a.score);

        // 1. Assign "Draft #1 Candidate" (ドラフト1位候補)
        // Typically top 12 players effectively, but let's make it a bit fuzzy like maybe top 8-14
        const draft1Count = 12; 
        for (let i = 0; i < draft1Count; i++) {
            if (i < scoredCandidates.length) {
                this.addStatus(scoredCandidates[i].player, "ドラフト1位候補");
            }
        }

        // 2. Assign No.1 Titles
        const pitchers = candidates.filter(p => p.position === 'P');
        const fielders = candidates.filter(p => p.position !== 'P');

        if (pitchers.length > 0) {
            // Best Pitcher (Score based)
            let bestPitcher = pitchers[0];
            let maxScore = -1;
            for (const p of pitchers) {
                const s = this.calculateScore(p);
                if (s > maxScore) {
                    maxScore = s;
                    bestPitcher = p;
                }
            }
            this.addStatus(bestPitcher, "No.1投手");

            // Best Speed
            let fastest = pitchers[0];
            for (const p of pitchers) {
                if ((p.scoutInfo?.speed || 0) > (fastest.scoutInfo?.speed || 0)) fastest = p;
            }
            if ((fastest.scoutInfo?.speed || 0) >= 150) {
                this.addStatus(fastest, "剛腕");
            }
        }

        if (fielders.length > 0) {
             // Best Slugger (Power)
            let bestSlugger = fielders[0];
            for (const p of fielders) {
                if ((p.scoutInfo?.power || 0) > (bestSlugger.scoutInfo?.power || 0)) bestSlugger = p;
            }
            this.addStatus(bestSlugger, "No.1スラッガー");
            
            // Best Contact Hitter
            let bestBat = fielders[0];
            for (const p of fielders) {
                if ((p.scoutInfo?.contact || 0) > (bestBat.scoutInfo?.contact || 0)) bestBat = p;
            }
            this.addStatus(bestBat, "No.1打者");
            
            // Best Defender
            let bestDef = fielders[0];
            for (const p of fielders) {
                if ((p.scoutInfo?.fielding || 0) > (bestDef.scoutInfo?.fielding || 0)) bestDef = p;
            }
            if ((bestDef.scoutInfo?.fielding || 0) >= 12) {
                this.addStatus(bestDef, "守備職人");
            }
        }

        // 3. Assign "Koshien Champion" (甲子園優勝)
        // 0-2 High School players
        const hsPlayers = candidates.filter(p => p.origin === "High School");
        const koshienCount = RandomUtils.int(0, 2);
        
        if (hsPlayers.length > 0 && koshienCount > 0) {
            // Sort HS players by score to pick "realistic" champions (usually good players)
            // But add some randomness so it's not always the absolute best
            const scoredHS = hsPlayers.map(p => ({
                player: p,
                score: this.calculateScore(p) + RandomUtils.float(0, 5) // Add noise
            })).sort((a, b) => b.score - a.score);

            const winners = scoredHS.slice(0, koshienCount);
            winners.forEach(w => {
                // Determine actual position using the player object
                if (w.player.position === 'P') {
                    this.addStatus(w.player, "甲子園優勝投手");
                } else {
                    // For fielders, maybe "甲子園優勝スラッガー" or just "甲子園優勝メンバー"
                    this.addStatus(w.player, "甲子園優勝");
                }
            });
        }
    }

    private static addStatus(player: Player, status: string) {
        if (!player.scoutInfo) return;
        if (!player.scoutInfo.specialStatus) {
            player.scoutInfo.specialStatus = [];
        }
        // Avoid duplicates
        if (!player.scoutInfo.specialStatus.includes(status)) {
            player.scoutInfo.specialStatus.push(status);
        }
    }

    private static calculateScore(player: Player): number {
        const s = player.scoutInfo;
        if (!s) return 0;

        if (player.position === 'P') {
            // Pitcher Score: Speed(as rank 0-15) + Control + Stamina + Breaking
            // Speed 130->0, 160->15
            const speedRank = Math.max(0, ((s.speed || 130) - 130) / 2);
            return (speedRank * 1.0) + ((s.control || 0) * 1.0) + ((s.stamina || 0) * 0.8) + ((s.breakingBall || 0) * 1.2);
        } else {
            // Fielder Score
            return ((s.contact || 0) * 1.2) + ((s.power || 0) * 1.2) + ((s.speedFielder || 0) * 0.8) + ((s.fielding || 0) * 0.8);
        }
    }
}
