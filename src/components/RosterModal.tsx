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

interface RosterModalProps {
  visible: boolean;
  onClose: () => void;
  teamName: string;
  groupedRoster: Record<string, Player[]>;
  onSelectTeam?: () => void;
  isMyTeam?: boolean;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  visible,
  onClose,
  teamName,
  groupedRoster,
  onSelectTeam,
  isMyTeam,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalCenteredView}>
        <View style={[styles.modalView, { width: '90%', maxHeight: '80%' }]}>
          <Text style={styles.modalTitle}>{teamName} - 一軍登録選手</Text>
          
          {onSelectTeam && (
            <TouchableOpacity
                style={[styles.button, isMyTeam ? styles.disabledButton : styles.selectButton, { marginBottom: 10, width: '100%' }]}
                onPress={onSelectTeam}
                disabled={isMyTeam}
            >
                <Text style={styles.buttonText}>{isMyTeam ? '選択中のチーム' : 'このチームでプレイする'}</Text>
            </TouchableOpacity>
          )}

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
    backgroundColor: '#FF9800',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  modalCenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  rosterSection: {
    marginBottom: 15,
    width: '100%',
  },
  rosterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: '#eee',
    padding: 5,
    marginBottom: 5,
  },
  rosterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rosterPosition: {
    width: 40,
    fontWeight: 'bold',
  },
  rosterName: {
    flex: 1,
  },
  rosterStats: {
    width: 100,
    textAlign: 'right',
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    paddingVertical: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
