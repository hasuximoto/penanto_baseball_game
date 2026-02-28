import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Player, YearlyStats } from '../types';
import { dbManager } from '../services/databaseManager';
import { COLORS, SPACING } from '../utils/theme';

type Tab = 'stats' | 'abilities' | 'yearlyStats';

export const PlayerDetailScreen = ({ route }: any) => {
  const { player } = route.params as { player: Player };
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [yearlyStats, setYearlyStats] = useState<YearlyStats[]>([]);

  useEffect(() => {
    const loadYearlyStats = async () => {
      const [stats, gameState] = await Promise.all([
        dbManager.getYearlyStats(player.id),
        dbManager.loadGameState()
      ]);

      if (gameState && gameState.season && player.stats) {
        const hasCurrentYear = stats.some(s => s.year === gameState.season);
        if (!hasCurrentYear) {
          stats.push({
            playerId: player.id,
            year: gameState.season,
            teamId: player.team,
            stats: player.stats
          });
          stats.sort((a, b) => a.year - b.year);
        }
      }
      setYearlyStats(stats);
    };
    loadYearlyStats();
  }, [player.id, player.stats, player.team]);

  const renderStats = () => {
    const stats = player.stats;
    if (!stats) return <Text style={{color: COLORS.textPrimary, padding: 20}}>成績データなし</Text>;

    const StatBox = ({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) => (
        <View style={styles.statBox}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={[styles.statValue, highlight && styles.highlightStat]}>{value}</Text>
        </View>
    );

    if (player.position === 'P') {
      const formatInnings = (innings: number) => {
        const rounded = Math.round(innings * 3) / 3;
        const integerPart = Math.floor(rounded);
        const decimalPart = rounded - integerPart;
        if (decimalPart > 0.6) return `${integerPart > 0 ? integerPart + ' ' : ''}2/3`;
        if (decimalPart > 0.3) return `${integerPart > 0 ? integerPart + ' ' : ''}1/3`;
        return integerPart.toString();
      };

      return (
        <View>
            <Text style={styles.sectionTitle}>メイン成績</Text>
            <View style={styles.gridContainer}>
                <StatBox label="防御率" value={stats.era?.toFixed(2) || '-'} highlight />
                <StatBox label="勝利" value={stats.wins || 0} highlight />
                <StatBox label="セーブ" value={stats.saves || 0} />
                <StatBox label="登板" value={stats.gamesPitched || 0} />
                <StatBox label="奪三振" value={stats.strikeOuts || 0} />
                <StatBox label="WHIP" value={stats.whip?.toFixed(2) || '-'} />
            </View>

            <Text style={styles.sectionTitle}>詳細成績</Text>
            <View style={styles.gridContainer}>
                <StatBox label="敗北" value={stats.losses || 0} />
                <StatBox label="投球回" value={formatInnings(stats.inningsPitched || 0)} />
                <StatBox label="先発" value={stats.gamesStarted || 0} />
                <StatBox label="完投" value={stats.completeGames || 0} />
                <StatBox label="完封" value={stats.shutouts || 0} />
                <StatBox label="QS" value={stats.qualityStarts || 0} />
                <StatBox label="奪三振率" value={stats.k9?.toFixed(2) || '-'} />
                <StatBox label="与四球率" value={stats.bb9?.toFixed(2) || '-'} />
                <StatBox label="WAR" value={stats.war?.toFixed(1) || '0.0'} />
            </View>
        </View>
      );
    } else {
      // Calculate derived stats
      const hits = stats.hits || 0;
      const doubles = stats.doubles || 0;
      const triples = stats.triples || 0;
      const homeRuns = stats.homeRuns || 0;
      const atBats = stats.atBats || 0;
      const walks = stats.walks || 0;
      const hitByPitch = stats.hitByPitch || 0;
      const sacrificeFlies = stats.sacrificeFlies || 0;
      
      const singles = hits - doubles - triples - homeRuns;
      const totalBases = singles + (doubles * 2) + (triples * 3) + (homeRuns * 4);
      const slugging = atBats > 0 ? totalBases / atBats : 0;
      const obp = (atBats + walks + hitByPitch + sacrificeFlies) > 0 
        ? (hits + walks + hitByPitch) / (atBats + walks + hitByPitch + sacrificeFlies) 
        : 0;
      const ops = obp + slugging;

      return (
        <View>
            <Text style={styles.sectionTitle}>メイン成績</Text>
            <View style={styles.gridContainer}>
                <StatBox label="打率" value={stats.average?.toFixed(3) || '.000'} highlight />
                <StatBox label="本塁打" value={homeRuns} highlight />
                <StatBox label="打点" value={stats.rbi || 0} highlight />
                <StatBox label="OPS" value={stats.ops?.toFixed(3) || ops.toFixed(3)} />
                <StatBox label="安打" value={hits} />
                <StatBox label="盗塁" value={stats.stolenBases || 0} />
            </View>

            <Text style={styles.sectionTitle}>詳細成績</Text>
            <View style={styles.gridContainer}>
                <StatBox label="試合" value={stats.gamesPlayed || 0} />
                <StatBox label="打席" value={stats.plateAppearances || 0} />
                <StatBox label="打数" value={atBats} />
                <StatBox label="二塁打" value={doubles} />
                <StatBox label="三塁打" value={triples} />
                <StatBox label="四球" value={walks} />
                <StatBox label="三振" value={stats.batterStrikeouts || stats.strikeOuts || 0} />
                <StatBox label="出塁率" value={stats.obp?.toFixed(3) || obp.toFixed(3)} />
                <StatBox label="長打率" value={stats.slugging?.toFixed(3) || slugging.toFixed(3)} />
                <StatBox label="WAR" value={stats.war?.toFixed(1) || '0.0'} />
            </View>
        </View>
      );
    }
  };


  const renderAbilities = () => {
    const abilities = player.abilities;
    if (!abilities) return <Text style={{color: COLORS.textPrimary}}>能力データなし</Text>;

    const getRank = (value: number | undefined) => {
      if (value == null) return 'G';
      if (value >= 14.0) return 'S';
      if (value >= 12.5) return 'A';
      if (value >= 11.0) return 'B';
      if (value >= 9.5) return 'C';
      if (value >= 8.0) return 'D';
      if (value >= 6.5) return 'E';
      if (value >= 5.0) return 'F';
      return 'G';
    };

    const getRankColor = (rank: string) => {
      switch (rank) {
        case 'S': return COLORS.primary; // Gold
        case 'A': return '#C0C0C0'; // Silver
        case 'B': return '#CD7F32'; // Bronze
        case 'C': return '#4682B4'; // Metallic Blue
        case 'D': return '#2E8B57'; // Sea Green
        case 'E': return '#778899'; // Light Slate Gray
        case 'F': return '#696969'; // Dim Gray
        default: return COLORS.textMuted;
      }
    };

    const getPitchRank = (value: number) => {
      if (value >= 140) return 'S';
      if (value >= 125) return 'A';
      if (value >= 110) return 'B';
      if (value >= 95) return 'C';
      if (value >= 80) return 'D';
      if (value >= 65) return 'E';
      if (value >= 50) return 'F';
      return 'G';
    };

    const renderPitchTypes = (pitchTypes: { name: string; value: number }[] | undefined) => {
      if (!pitchTypes || pitchTypes.length === 0) return (
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>変化球</Text>
          <Text style={styles.statValue}>なし</Text>
        </View>
      );

      return (
        <View style={{ marginTop: 15, marginBottom: 10 }}>
          <Text style={styles.sectionTitle}>変化球</Text>
          <View style={styles.gridContainer}>
          {pitchTypes.map((pitch, index) => {
            const rank = getPitchRank(pitch.value);
            const color = getRankColor(rank);
            // Max 160 for scaling
            const widthPercent = Math.min(100, Math.max(5, (pitch.value / 160) * 100));
            
            return (
              <View key={index} style={[styles.statBox, { alignItems: 'stretch' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 14, color: COLORS.textPrimary }}>{pitch.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontWeight: 'bold', color: color, marginRight: 6, fontSize: 16 }}>{rank}</Text>
                    <Text style={{ fontSize: 14, color: COLORS.textSecondary, width: 30, textAlign: 'right' }}>{pitch.value}</Text>
                  </View>
                </View>
                <View style={{ height: 6, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${widthPercent}%`, backgroundColor: color }} />
                </View>
              </View>
            );
          })}
          </View>
        </View>
      );
    };

    const renderAbilityRow = (label: string, value: number | undefined, unit: string = '', showRank: boolean = true) => {
      const rank = getRank(value);
      const color = getRankColor(rank);
      return (
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>{label}</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {showRank && (
                <Text style={{ color: color, marginRight: 5, fontSize: 18, fontWeight: 'bold' }}>{rank}</Text>
                )}
                <Text style={styles.statValue}>{value !== undefined ? value : '-'}{unit}</Text>
            </View>
        </View>
      );
    };

    return (
      <View>
        <Text style={styles.sectionTitle}>基本能力</Text>
        <View style={styles.gridContainer}>
        {player.position === 'P' ? (
           <>
             {renderAbilityRow('スタミナ', abilities.stamina)}
             {renderAbilityRow('球速', abilities.speed, ' km/h', false)}
             {renderAbilityRow('コントロール', abilities.control)}
           </>
        ) : (
           <>
             {renderAbilityRow('ミート', abilities.contact)}
             {renderAbilityRow('パワー', abilities.power)}
             {renderAbilityRow('走力', abilities.speed)}
             {renderAbilityRow('肩力', abilities.arm)}
             {renderAbilityRow('守備力', abilities.fielding)}
           </>
        )}
        </View>
        
        {player.position === 'P' && renderPitchTypes(abilities.pitchTypes)}
        {player.position !== 'P' && renderAptitudes()}
      </View>
    );
  };

  const renderAptitudes = () => {
    const aptitudes = player.aptitudes;
    if (!aptitudes) return null;

    const positions = [
      { key: 'catcher', label: '捕手' },
      { key: 'first', label: '一塁' },
      { key: 'second', label: '二塁' },
      { key: 'third', label: '三塁' },
      { key: 'short', label: '遊撃' },
      { key: 'outfield', label: '外野' },
    ];

    return (
      <View style={{ marginTop: 20 }}>
        <Text style={styles.sectionTitle}>ポジション適性</Text>
        <View style={styles.gridContainer}>
        {positions.map((pos) => {
          const value = (aptitudes as any)[pos.key] || 0;
          if (value < 1) return null; // Don't show inactive positions

          const width = Math.min(100, (value / 13) * 100); 
          let color = '#ddd';
          if (value >= 12) color = '#ff0000'; // S
          else if (value >= 10) color = '#ff8800'; // A
          else if (value >= 8) color = '#ffcc00'; // B
          else if (value >= 6) color = '#ffff00'; // C
          
          return (
            <View key={pos.key} style={[styles.statBox, { alignItems: 'stretch' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: 14, color: COLORS.textPrimary }}>{pos.label}</Text>
                  <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>{value.toFixed(1)}</Text>
              </View>
              <View style={{ height: 6, backgroundColor: COLORS.border, borderRadius: 3 }}>
                <View style={{ width: `${width}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
              </View>
            </View>
          );
        })}
        </View>
      </View>
    );
  };

  const renderYearlyStats = () => {
    if (yearlyStats.length === 0) {
      return (
        <View style={styles.statsContainer}>
          <Text style={{ textAlign: 'center', color: COLORS.textMuted, marginTop: 20 }}>過去の成績データはありません</Text>
        </View>
      );
    }

    const isPitcher = player.position === 'P';

    // Calculate Totals
    const total = yearlyStats.reduce((acc, curr) => {
      const s = curr.stats;
      if (isPitcher) {
        acc.gamesPitched = (acc.gamesPitched || 0) + (s.gamesPitched || 0);
        acc.inningsPitched = (acc.inningsPitched || 0) + (s.inningsPitched || 0);
        acc.earnedRuns = (acc.earnedRuns || 0) + (s.earnedRuns || 0);
        acc.pitchingHits = (acc.pitchingHits || 0) + (s.pitchingHits || 0);
        acc.pitchingHomeRuns = (acc.pitchingHomeRuns || 0) + (s.pitchingHomeRuns || 0);
        acc.strikeOuts = (acc.strikeOuts || 0) + (s.strikeOuts || 0);
        acc.pitchingWalks = (acc.pitchingWalks || 0) + (s.pitchingWalks || 0);
        acc.pitchingHitByPitch = (acc.pitchingHitByPitch || 0) + (s.pitchingHitByPitch || 0);
        acc.completeGames = (acc.completeGames || 0) + (s.completeGames || 0);
        acc.shutouts = (acc.shutouts || 0) + (s.shutouts || 0);
        acc.wins = (acc.wins || 0) + (s.wins || 0);
        acc.losses = (acc.losses || 0) + (s.losses || 0);
        acc.saves = (acc.saves || 0) + (s.saves || 0);
        acc.gamesStarted = (acc.gamesStarted || 0) + (s.gamesStarted || 0);
        acc.qualityStarts = (acc.qualityStarts || 0) + (s.qualityStarts || 0);
        acc.war = (acc.war || 0) + (s.war || 0);
      } else {
        acc.gamesPlayed = (acc.gamesPlayed || 0) + (s.gamesPlayed || 0);
        acc.plateAppearances = (acc.plateAppearances || 0) + (s.plateAppearances || 0);
        acc.atBats = (acc.atBats || 0) + (s.atBats || 0);
        acc.hits = (acc.hits || 0) + (s.hits || 0);
        acc.doubles = (acc.doubles || 0) + (s.doubles || 0);
        acc.triples = (acc.triples || 0) + (s.triples || 0);
        acc.homeRuns = (acc.homeRuns || 0) + (s.homeRuns || 0);
        acc.rbi = (acc.rbi || 0) + (s.rbi || 0);
        acc.batterStrikeouts = (acc.batterStrikeouts || 0) + (s.batterStrikeouts || s.strikeOuts || 0);
        acc.walks = (acc.walks || 0) + (s.walks || 0);
        acc.hitByPitch = (acc.hitByPitch || 0) + (s.hitByPitch || 0);
        acc.sacrificeBunts = (acc.sacrificeBunts || 0) + (s.sacrificeBunts || 0);
        acc.sacrificeFlies = (acc.sacrificeFlies || 0) + (s.sacrificeFlies || 0);
        acc.stolenBases = (acc.stolenBases || 0) + (s.stolenBases || 0);
        acc.caughtStealing = (acc.caughtStealing || 0) + (s.caughtStealing || 0);
        acc.doublePlays = (acc.doublePlays || 0) + (s.doublePlays || 0);
        acc.errors = (acc.errors || 0) + (s.errors || 0);
        acc.uzr = (acc.uzr || 0) + (s.uzr || 0);
        acc.ubr = (acc.ubr || 0) + (s.ubr || 0);
        acc.war = (acc.war || 0) + (s.war || 0);
      }
      return acc;
    }, {} as any);

    // Calculate Averages for Total
    if (isPitcher) {
        const ip = total.inningsPitched || 0;
        total.era = ip > 0 ? (total.earnedRuns * 9) / ip : 0;
        total.k9 = ip > 0 ? (total.strikeOuts * 9) / ip : 0;
        total.bb9 = ip > 0 ? (total.pitchingWalks * 9) / ip : 0;
        total.whip = ip > 0 ? (total.pitchingWalks + total.pitchingHits) / ip : 0;
    } else {
        const ab = total.atBats || 0;
        const pa = total.plateAppearances || 0;
        const hits = total.hits || 0;
        const walks = total.walks || 0;
        const hbp = total.hitByPitch || 0;
        const sf = total.sacrificeFlies || 0;
        
        total.average = ab > 0 ? hits / ab : 0;
        total.obp = (ab + walks + hbp + sf) > 0 ? (hits + walks + hbp) / (ab + walks + hbp + sf) : 0;
        
        const singles = hits - (total.doubles || 0) - (total.triples || 0) - (total.homeRuns || 0);
        const totalBases = singles + (total.doubles || 0) * 2 + (total.triples || 0) * 3 + (total.homeRuns || 0) * 4;
        total.slugging = ab > 0 ? totalBases / ab : 0;
        total.ops = total.obp + total.slugging;
    }

    const formatInnings = (innings: number) => {
        const rounded = Math.round(innings * 3) / 3;
        const integerPart = Math.floor(rounded);
        const decimalPart = rounded - integerPart;
        if (decimalPart > 0.6) return `${integerPart > 0 ? integerPart + ' ' : ''}2/3`;
        if (decimalPart > 0.3) return `${integerPart > 0 ? integerPart + ' ' : ''}1/3`;
        return integerPart.toString();
    };

    const renderHeaderCell = (label: string, width: number) => (
        <View style={[styles.headerCell, { width }]}>
            <Text style={styles.headerText}>{label}</Text>
        </View>
    );

    const renderCell = (value: any, width: number) => (
        <View style={[styles.cell, { width }]}>
            <Text style={styles.cellText}>{value}</Text>
        </View>
    );

    return (
      <View style={styles.tableContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Header */}
            <View style={styles.headerRow}>
                {renderHeaderCell('年度', 60)}
                {renderHeaderCell('球団', 60)}
                {isPitcher ? (
                    <>
                        {renderHeaderCell('登板', 50)}
                        {renderHeaderCell('投球回', 60)}
                        {renderHeaderCell('自責点', 50)}
                        {renderHeaderCell('被安打', 50)}
                        {renderHeaderCell('被本塁打', 60)}
                        {renderHeaderCell('奪三振', 50)}
                        {renderHeaderCell('与四球', 50)}
                        {renderHeaderCell('与死球', 50)}
                        {renderHeaderCell('完投', 50)}
                        {renderHeaderCell('完封', 50)}
                        {renderHeaderCell('勝', 50)}
                        {renderHeaderCell('敗', 50)}
                        {renderHeaderCell('セーブ', 50)}
                        {renderHeaderCell('先発', 50)}
                        {renderHeaderCell('QS', 50)}
                        {renderHeaderCell('防御率', 60)}
                        {renderHeaderCell('奪三振率', 60)}
                        {renderHeaderCell('与四球率', 60)}
                        {renderHeaderCell('WHIP', 60)}
                        {renderHeaderCell('WAR', 60)}
                    </>
                ) : (
                    <>
                        {renderHeaderCell('試合', 50)}
                        {renderHeaderCell('打席', 50)}
                        {renderHeaderCell('打数', 50)}
                        {renderHeaderCell('安打', 50)}
                        {renderHeaderCell('二塁打', 50)}
                        {renderHeaderCell('三塁打', 50)}
                        {renderHeaderCell('本塁打', 50)}
                        {renderHeaderCell('打点', 50)}
                        {renderHeaderCell('三振', 50)}
                        {renderHeaderCell('四球', 50)}
                        {renderHeaderCell('死球', 50)}
                        {renderHeaderCell('犠打', 50)}
                        {renderHeaderCell('犠飛', 50)}
                        {renderHeaderCell('盗塁', 50)}
                        {renderHeaderCell('盗塁死', 50)}
                        {renderHeaderCell('併殺', 50)}
                        {renderHeaderCell('失策', 50)}
                        {renderHeaderCell('打率', 60)}
                        {renderHeaderCell('出塁率', 60)}
                        {renderHeaderCell('長打率', 60)}
                        {renderHeaderCell('OPS', 60)}
                        {renderHeaderCell('UZR', 60)}
                        {renderHeaderCell('UBR', 60)}
                        {renderHeaderCell('WAR', 60)}
                    </>
                )}
            </View>

            {/* Data Rows */}
            {yearlyStats.map((stat, index) => (
                <View key={index} style={styles.row}>
                    {renderCell(stat.year, 60)}
                    {renderCell(stat.teamId.toUpperCase(), 60)}
                    {isPitcher ? (
                        <>
                            {renderCell(stat.stats.gamesPitched || 0, 50)}
                            {renderCell(formatInnings(stat.stats.inningsPitched || 0), 60)}
                            {renderCell(stat.stats.earnedRuns || 0, 50)}
                            {renderCell(stat.stats.pitchingHits || 0, 50)}
                            {renderCell(stat.stats.pitchingHomeRuns || 0, 60)}
                            {renderCell(stat.stats.strikeOuts || 0, 50)}
                            {renderCell(stat.stats.pitchingWalks || 0, 50)}
                            {renderCell(stat.stats.pitchingHitByPitch || 0, 50)}
                            {renderCell(stat.stats.completeGames || 0, 50)}
                            {renderCell(stat.stats.shutouts || 0, 50)}
                            {renderCell(stat.stats.wins || 0, 50)}
                            {renderCell(stat.stats.losses || 0, 50)}
                            {renderCell(stat.stats.saves || 0, 50)}
                            {renderCell(stat.stats.gamesStarted || 0, 50)}
                            {renderCell(stat.stats.qualityStarts || 0, 50)}
                            {renderCell(stat.stats.era?.toFixed(2), 60)}
                            {renderCell(stat.stats.k9?.toFixed(2), 60)}
                            {renderCell(stat.stats.bb9?.toFixed(2), 60)}
                            {renderCell(stat.stats.whip?.toFixed(2), 60)}
                            {renderCell(stat.stats.war?.toFixed(2), 60)}
                        </>
                    ) : (
                        <>
                            {renderCell(stat.stats.gamesPlayed || 0, 50)}
                            {renderCell(stat.stats.plateAppearances || 0, 50)}
                            {renderCell(stat.stats.atBats || 0, 50)}
                            {renderCell(stat.stats.hits || 0, 50)}
                            {renderCell(stat.stats.doubles || 0, 50)}
                            {renderCell(stat.stats.triples || 0, 50)}
                            {renderCell(stat.stats.homeRuns || 0, 50)}
                            {renderCell(stat.stats.rbi || 0, 50)}
                            {renderCell(stat.stats.batterStrikeouts || stat.stats.strikeOuts || 0, 50)}
                            {renderCell(stat.stats.walks || 0, 50)}
                            {renderCell(stat.stats.hitByPitch || 0, 50)}
                            {renderCell(stat.stats.sacrificeBunts || 0, 50)}
                            {renderCell(stat.stats.sacrificeFlies || 0, 50)}
                            {renderCell(stat.stats.stolenBases || 0, 50)}
                            {renderCell(stat.stats.caughtStealing || 0, 50)}
                            {renderCell(stat.stats.doublePlays || 0, 50)}
                            {renderCell(stat.stats.errors || 0, 50)}
                            {renderCell(stat.stats.average?.toFixed(3), 60)}
                            {renderCell(stat.stats.obp?.toFixed(3), 60)}
                            {renderCell(stat.stats.slugging?.toFixed(3), 60)}
                            {renderCell(stat.stats.ops?.toFixed(3), 60)}
                            {renderCell(stat.stats.uzr?.toFixed(2), 60)}
                            {renderCell(stat.stats.ubr?.toFixed(2), 60)}
                            {renderCell(stat.stats.war?.toFixed(2), 60)}
                        </>
                    )}
                </View>
            ))}

            {/* Total Row */}
            <View style={[styles.row, styles.totalRow]}>
                {renderCell('通算', 60)}
                {renderCell('-', 60)}
                {isPitcher ? (
                    <>
                        {renderCell(total.gamesPitched || 0, 50)}
                        {renderCell(formatInnings(total.inningsPitched || 0), 60)}
                        {renderCell(total.earnedRuns || 0, 50)}
                        {renderCell(total.pitchingHits || 0, 50)}
                        {renderCell(total.pitchingHomeRuns || 0, 60)}
                        {renderCell(total.strikeOuts || 0, 50)}
                        {renderCell(total.pitchingWalks || 0, 50)}
                        {renderCell(total.pitchingHitByPitch || 0, 50)}
                        {renderCell(total.completeGames || 0, 50)}
                        {renderCell(total.shutouts || 0, 50)}
                        {renderCell(total.wins || 0, 50)}
                        {renderCell(total.losses || 0, 50)}
                        {renderCell(total.saves || 0, 50)}
                        {renderCell(total.gamesStarted || 0, 50)}
                        {renderCell(total.qualityStarts || 0, 50)}
                        {renderCell(total.era?.toFixed(2), 60)}
                        {renderCell(total.k9?.toFixed(2), 60)}
                        {renderCell(total.bb9?.toFixed(2), 60)}
                        {renderCell(total.whip?.toFixed(2), 60)}
                        {renderCell(total.war?.toFixed(2), 60)}
                    </>
                ) : (
                    <>
                        {renderCell(total.gamesPlayed || 0, 50)}
                        {renderCell(total.plateAppearances || 0, 50)}
                        {renderCell(total.atBats || 0, 50)}
                        {renderCell(total.hits || 0, 50)}
                        {renderCell(total.doubles || 0, 50)}
                        {renderCell(total.triples || 0, 50)}
                        {renderCell(total.homeRuns || 0, 50)}
                        {renderCell(total.rbi || 0, 50)}
                        {renderCell(total.batterStrikeouts || 0, 50)}
                        {renderCell(total.walks || 0, 50)}
                        {renderCell(total.hitByPitch || 0, 50)}
                        {renderCell(total.sacrificeBunts || 0, 50)}
                        {renderCell(total.sacrificeFlies || 0, 50)}
                        {renderCell(total.stolenBases || 0, 50)}
                        {renderCell(total.caughtStealing || 0, 50)}
                        {renderCell(total.doublePlays || 0, 50)}
                        {renderCell(total.errors || 0, 50)}
                        {renderCell(total.average?.toFixed(3), 60)}
                        {renderCell(total.obp?.toFixed(3), 60)}
                        {renderCell(total.slugging?.toFixed(3), 60)}
                        {renderCell(total.ops?.toFixed(3), 60)}
                        {renderCell(total.uzr?.toFixed(2), 60)}
                        {renderCell(total.ubr?.toFixed(2), 60)}
                        {renderCell(total.war?.toFixed(2), 60)}
                    </>
                )}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerCard}>
        <View style={styles.avatarCircle}>
             <Text style={styles.avatarText}>{player.position}</Text>
        </View>
        <Text style={styles.uniformNumber}>#{String(player.id).slice(-2)}</Text>
        <Text style={styles.playerName}>{player.name}</Text>
        <View style={styles.playerDetailRow}>
             <View style={styles.tag}><Text style={styles.tagText}>{player.team.toUpperCase()}</Text></View>
             <View style={styles.tag}><Text style={styles.tagText}>{player.age}歳</Text></View>
             <View style={styles.tag}><Text style={styles.tagText}>{player.experienceYears}年目</Text></View>
             <View style={styles.tag}><Text style={styles.tagText}>D{player.draftRank}位</Text></View>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]} 
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>今季成績</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'yearlyStats' && styles.activeTab]} 
          onPress={() => setActiveTab('yearlyStats')}
        >
          <Text style={[styles.tabText, activeTab === 'yearlyStats' && styles.activeTabText]}>年度別</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'abilities' && styles.activeTab]} 
          onPress={() => setActiveTab('abilities')}
        >
          <Text style={[styles.tabText, activeTab === 'abilities' && styles.activeTabText]}>能力</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'stats' && renderStats()}
        {activeTab === 'yearlyStats' && renderYearlyStats()}
        {activeTab === 'abilities' && renderAbilities()}
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header Profile
  headerCard: {
    padding: SPACING.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.card,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  uniformNumber: {
    fontSize: 42,
    fontWeight: '900',
    color: 'rgba(212, 175, 55, 0.2)', // Faded gold
    position: 'absolute',
    right: 20,
    top: 0,
  },
  avatarCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: COLORS.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.md,
      borderWidth: 2,
      borderColor: COLORS.primary,
  },
  avatarText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: COLORS.primary,
  },
  playerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playerDetailRow: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  tag: {
      backgroundColor: COLORS.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: COLORS.border,
  },
  tagText: {
      color: COLORS.textSecondary,
      fontSize: 12,
      fontWeight: '600',
  },
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  tab: {
    paddingVertical: 16,
    marginRight: SPACING.xl,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: COLORS.textPrimary,
  },
  
  // Content
  content: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  statsContainer: {
    paddingVertical: SPACING.md,
  },
  
  // Stats Grid
  gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: SPACING.lg,
  },
  statBox: {
      width: '31%',
      backgroundColor: COLORS.card,
      padding: SPACING.md,
      borderRadius: 8,
      marginBottom: SPACING.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.border,
  },
  statLabel: {
      fontSize: 12,
      color: COLORS.textMuted,
      marginBottom: 4,
      textTransform: 'uppercase',
  },
  statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.textPrimary,
  },
  highlightStat: {
      color: COLORS.primary,
  },
  
  // Section Headers
  sectionTitle: {
      color: COLORS.primary,
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: SPACING.md,
      marginTop: SPACING.sm,
      paddingLeft: SPACING.xs,
      borderLeftWidth: 3,
      borderLeftColor: COLORS.primary,
  },

  // Yearly Stats Table
  tableContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.header,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerText: {
    fontWeight: '700',
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cellText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  totalRow: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
  },
});
