import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Player, YearlyStats } from '../types';
import { dbManager } from '../services/databaseManager';

type Tab = 'stats' | 'abilities' | 'yearlyStats';

export const PlayerDetailScreen = ({ route }: any) => {
  const { player } = route.params as { player: Player };
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [yearlyStats, setYearlyStats] = useState<YearlyStats[]>([]);

  useEffect(() => {
    const loadYearlyStats = async () => {
      const stats = await dbManager.getYearlyStats(player.id);
      setYearlyStats(stats);
    };
    loadYearlyStats();
  }, [player.id]);

  const renderStats = () => {
    const stats = player.stats;
    if (!stats) return <Text>成績データなし</Text>;

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
        <View style={styles.statsContainer}>
          <View style={styles.statRow}><Text style={styles.statLabel}>登板</Text><Text style={styles.statValue}>{stats.gamesPitched || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>投球回</Text><Text style={styles.statValue}>{formatInnings(stats.inningsPitched || 0)}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>自責点</Text><Text style={styles.statValue}>{stats.earnedRuns}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>被安打</Text><Text style={styles.statValue}>{stats.pitchingHits || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>被本塁打</Text><Text style={styles.statValue}>{stats.pitchingHomeRuns || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>奪三振</Text><Text style={styles.statValue}>{stats.strikeOuts}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>与四球</Text><Text style={styles.statValue}>{stats.pitchingWalks || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>与死球</Text><Text style={styles.statValue}>{stats.pitchingHitByPitch || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>完投</Text><Text style={styles.statValue}>{stats.completeGames || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>完封</Text><Text style={styles.statValue}>{stats.shutouts || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>勝</Text><Text style={styles.statValue}>{stats.wins}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>敗</Text><Text style={styles.statValue}>{stats.losses}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>セーブ</Text><Text style={styles.statValue}>{stats.saves}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>先発</Text><Text style={styles.statValue}>{stats.gamesStarted || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>救援</Text><Text style={styles.statValue}>{(stats.gamesPitched || 0) - (stats.gamesStarted || 0)}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>QS</Text><Text style={styles.statValue}>{stats.qualityStarts || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>防御率</Text><Text style={styles.statValue}>{stats.era?.toFixed(2)}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>奪三振率</Text><Text style={styles.statValue}>{stats.k9?.toFixed(2) || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>与四球率</Text><Text style={styles.statValue}>{stats.bb9?.toFixed(2) || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>WHIP</Text><Text style={styles.statValue}>{stats.whip?.toFixed(2) || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>WAR</Text><Text style={styles.statValue}>{stats.war?.toFixed(1) || '0.0'}</Text></View>
        </View>
      );
    } else {
      // Calculate derived stats if missing
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
        <View style={styles.statsContainer}>
          <View style={styles.statRow}><Text style={styles.statLabel}>試合</Text><Text style={styles.statValue}>{stats.gamesPlayed || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>打席</Text><Text style={styles.statValue}>{stats.plateAppearances || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>打数</Text><Text style={styles.statValue}>{atBats}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>安打</Text><Text style={styles.statValue}>{hits}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>二塁打</Text><Text style={styles.statValue}>{doubles}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>三塁打</Text><Text style={styles.statValue}>{triples}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>本塁打</Text><Text style={styles.statValue}>{homeRuns}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>打点</Text><Text style={styles.statValue}>{stats.rbi}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>三振</Text><Text style={styles.statValue}>{stats.batterStrikeouts || stats.strikeOuts || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>四球</Text><Text style={styles.statValue}>{walks}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>死球</Text><Text style={styles.statValue}>{hitByPitch}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>犠打</Text><Text style={styles.statValue}>{stats.sacrificeBunts || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>犠飛</Text><Text style={styles.statValue}>{sacrificeFlies}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>盗塁</Text><Text style={styles.statValue}>{stats.stolenBases}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>盗塁死</Text><Text style={styles.statValue}>{stats.caughtStealing || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>併殺打</Text><Text style={styles.statValue}>{stats.doublePlays || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>失策</Text><Text style={styles.statValue}>{stats.errors || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>打率</Text><Text style={styles.statValue}>{stats.average?.toFixed(3)}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>出塁率</Text><Text style={styles.statValue}>{stats.obp?.toFixed(3) || obp.toFixed(3)}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>長打率</Text><Text style={styles.statValue}>{stats.slugging?.toFixed(3) || slugging.toFixed(3)}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>OPS</Text><Text style={styles.statValue}>{stats.ops?.toFixed(3) || ops.toFixed(3)}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>UZR</Text><Text style={styles.statValue}>{stats.uzr?.toFixed(1) || '0.0'}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>UBR</Text><Text style={styles.statValue}>{stats.ubr?.toFixed(1) || '0.0'}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>WAR</Text><Text style={styles.statValue}>{stats.war?.toFixed(1) || '0.0'}</Text></View>
        </View>
      );
    }
  };

  const renderAbilities = () => {
    const abilities = player.abilities;
    if (!abilities) return <Text>能力データなし</Text>;

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
        case 'S': return '#FFD700'; // Gold
        case 'A': return '#FF4500'; // OrangeRed
        case 'B': return '#FFA500'; // Orange
        case 'C': return '#32CD32'; // LimeGreen
        case 'D': return '#1E90FF'; // DodgerBlue
        case 'E': return '#9370DB'; // MediumPurple
        case 'F': return '#808080'; // Gray
        default: return '#000000';
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
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>変化球</Text>
          <Text style={styles.statValue}>なし</Text>
        </View>
      );

      return (
        <View style={{ marginTop: 15, marginBottom: 10 }}>
          <Text style={[styles.statLabel, { marginBottom: 10, fontWeight: 'bold' }]}>変化球</Text>
          {pitchTypes.map((pitch, index) => {
            const rank = getPitchRank(pitch.value);
            const color = getRankColor(rank);
            // Max 160 for scaling
            const widthPercent = Math.min(100, Math.max(5, (pitch.value / 160) * 100));
            
            return (
              <View key={index} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 14, color: '#333' }}>{pitch.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontWeight: 'bold', color: color, marginRight: 6, fontSize: 16 }}>{rank}</Text>
                    <Text style={{ fontSize: 14, color: '#666', width: 30, textAlign: 'right' }}>{pitch.value}</Text>
                  </View>
                </View>
                <View style={{ height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${widthPercent}%`, backgroundColor: color }} />
                </View>
              </View>
            );
          })}
        </View>
      );
    };

    const renderAbilityRow = (label: string, value: number | undefined, unit: string = '', showRank: boolean = true) => {
      const rank = getRank(value);
      const color = getRankColor(rank);
      return (
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{label}</Text>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {showRank && (
              <Text style={[styles.statValue, { color: color, marginRight: 10, fontSize: 18 }]}>{rank}</Text>
            )}
            <Text style={styles.statValue}>{value !== undefined ? value : '-'}{unit}</Text>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.statsContainer}>
        {player.position === 'P' ? (
           <>
             {renderAbilityRow('スタミナ', abilities.stamina)}
             {renderAbilityRow('球速', abilities.speed, ' km/h', false)}
             {renderAbilityRow('コントロール', abilities.control)}
             {renderPitchTypes(abilities.pitchTypes)}
           </>
        ) : (
           <>
             {renderAbilityRow('ミート', abilities.contact)}
             {renderAbilityRow('パワー', abilities.power)}
             {renderAbilityRow('走力', abilities.speed)}
             {renderAbilityRow('肩力', abilities.arm)}
             {renderAbilityRow('守備力', abilities.fielding)}
             {renderAptitudes()}
           </>
        )}
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
      <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>ポジション適性</Text>
        {positions.map((pos) => {
          const value = (aptitudes as any)[pos.key] || 0;
          const width = Math.min(100, (value / 13) * 100); // Max 13 (S)
          // Color based on rank
          let color = '#ddd';
          if (value >= 12) color = '#ff0000'; // S
          else if (value >= 10) color = '#ff8800'; // A
          else if (value >= 8) color = '#ffcc00'; // B
          else if (value >= 6) color = '#ffff00'; // C
          else if (value >= 4) color = '#00cc00'; // D
          else if (value >= 2) color = '#0000ff'; // E
          
          return (
            <View key={pos.key} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ width: 40, fontSize: 14 }}>{pos.label}</Text>
              <View style={{ flex: 1, height: 10, backgroundColor: '#eee', borderRadius: 5, marginHorizontal: 10 }}>
                <View style={{ width: `${width}%`, height: '100%', backgroundColor: color, borderRadius: 5 }} />
              </View>
              <Text style={{ width: 30, textAlign: 'right', fontSize: 14 }}>{value.toFixed(1)}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderYearlyStats = () => {
    if (yearlyStats.length === 0) {
      return (
        <View style={styles.statsContainer}>
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>過去の成績データはありません</Text>
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
      <View style={styles.statsContainer}>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.playerInfo}>{player.team.toUpperCase()} | {player.position} | 年齢: {player.age}</Text>
        <Text style={styles.playerInfo}>ドラフト順位: {player.draftRank} | 年数: {player.experienceYears} | 新人王資格: {player.isRookieEligible ? 'あり' : 'なし'}</Text>
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  playerInfo: {
    fontSize: 16,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 16,
    color: '#333',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  cellText: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
  },
  totalRow: {
    backgroundColor: '#f9f9f9',
    borderTopWidth: 2,
    borderTopColor: '#ccc',
  },
});
