import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Player } from '@/types';
import { COLORS, FONTS, SPACING } from '@/utils/theme';

interface RosterModalProps {
  visible: boolean;
  onClose: () => void;
  teamName: string;
  groupedRoster: Record<string, Player[]>;
  onSelectTeam?: () => void;
  onViewDetails?: () => void;
  isMyTeam?: boolean;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  visible,
  onClose,
  teamName,
  groupedRoster,
  onSelectTeam,
  onViewDetails,
  isMyTeam,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalCenteredView}>
        <View style={[styles.modalView, { width: '90%', maxHeight: '80%' }]}>
          <Text style={styles.modalTitle}>{teamName} - 一軍登録選手</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 }}>
              {onSelectTeam && (
                <TouchableOpacity
                    style={[styles.button, isMyTeam ? styles.disabledButton : styles.selectButton, { flex: 1, marginRight: 5 }]}
                    onPress={onSelectTeam}
                    disabled={isMyTeam}
                >
                    <Text style={styles.buttonText}>{isMyTeam ? '選択中' : 'プレイする'}</Text>
                </TouchableOpacity>
              )}
              {onViewDetails && (
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.primary, flex: 1, marginLeft: 5 }]}
                      onPress={onViewDetails}
                  >
                      <Text style={[styles.buttonText, { color: COLORS.primary }]}>オーダー確認</Text>
                  </TouchableOpacity>
              )}
          </View>

          <ScrollView style={{ width: '100%' }}>
            {Object.entries(groupedRoster).map(([position, players]) => (
              <View key={position} style={styles.rosterSection}>
                <Text style={styles.rosterSectionTitle}>{position}</Text>
                {players.length > 0 ? (
                  players.map(p => (
                    <View key={p.id} style={styles.rosterRow}>
                      <Text style={styles.rosterPosition}>{p.position}</Text>
                      <Text style={styles.rosterName}>{p.name}</Text>
                      <Text style={styles.rosterStats}>
                        {p.position === 'P' 
                          ? `防${p.stats?.era?.toFixed(2) || '-.--'} ${p.stats?.wins || 0}勝`
                          : `率${p.stats?.average?.toFixed(3) || '.---'} ${p.stats?.homeRuns || 0}本`
                        }
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>登録なし</Text>
                )}
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { marginTop: 10, width: '100%' }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  selectButton: {
    backgroundColor: COLORS.primary,
  },
  disabledButton: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.textMuted,
    borderWidth: 1,
  },
  modalCenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 22,
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  modalView: {
    margin: 20,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    width: '80%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: COLORS.textMain,
    fontFamily: FONTS.bold,
  },
  rosterSection: {
    marginBottom: 15,
    width: '100%',
  },
  rosterSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(212, 175, 55, 0.1)', // Gold tint
    padding: 6,
    marginBottom: 5,
    color: COLORS.primary,
    fontFamily: FONTS.regular,
  },
  rosterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rosterPosition: {
    width: 40,
    fontWeight: 'bold',
    color: COLORS.textMain,
  },
  rosterName: {
    flex: 1,
    color: COLORS.textMain,
    fontFamily: FONTS.regular,
  },
  rosterStats: {
    width: 100,
    textAlign: 'right',
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
});
