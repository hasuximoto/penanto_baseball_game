import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { dbManager } from '../services/databaseManager';
import { gameEngine } from '../services/gameEngine';
import { DraftManager } from '../services/draftManager';

export const DebugScreen: React.FC = () => {
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    buttons: [] as { text: string; style?: string; onPress?: () => void }[]
  });

  const showAlert = (title: string, message: string, buttons: { text: string; style?: string; onPress?: () => void }[] = [{ text: 'OK' }]) => {
    setModalConfig({ title, message, buttons });
    setModalVisible(true);
  };

  useEffect(() => {
    loadDbInfo();
  }, []);

  const loadDbInfo = async () => {
    const isInit = await dbManager.isInitialized();
    const teams = await dbManager.getInitialTeams();
    const players = await dbManager.getInitialPlayers();
    setDbInfo({
      initialized: isInit,
      teamCount: teams.length,
      playerCount: players.length,
    });
  };

  const handleResetDb = async () => {
    showAlert(
      'Reset Database',
      'Are you sure? This will delete all save data and reset to initial state.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive', 
          onPress: async () => {
            await dbManager.reset();
            await dbManager.initialize();
            await loadDbInfo();
            setResult('Database reset complete.');
          }
        }
      ]
    );
  };

  const handleExportDb = async () => {
    setResult('Exporting database...');
    try {
      const teams = await dbManager.getInitialTeams();
      const players = await dbManager.getInitialPlayers();
      const gameState = await dbManager.loadGameState();
      
      const exportData = {
        teams,
        players,
        gameState,
        exportedAt: new Date().toISOString(),
      };

      setResult(JSON.stringify(exportData, null, 2));
    } catch (e) {
      setResult(`Error exporting DB: ${e}`);
    }
  };

  const handleSearchPlayer = async () => {
    if (!query) return;
    const players = await dbManager.getInitialPlayers();
    const found = players.filter(p => p.name.includes(query) || p.id.toString() === query);
    setResult(JSON.stringify(found, null, 2));
  };

  const handleRecalculateOverall = async () => {
      setResult('Recalculating overall ratings...');
      await gameEngine.updateAllPlayersOverall();
      setResult('Recalculation complete. Please restart app or reload data to see changes.');
  };

  const handleGenerateDraft = async () => {
    setResult('Generating draft candidates...');
    try {
      const candidates = DraftManager.generateDraftCandidates(100);
      await dbManager.saveDraftCandidates(candidates);
      setResult(`Generated ${candidates.length} candidates.\n\nSample:\n${JSON.stringify(candidates.slice(0, 3), null, 2)}`);
    } catch (e) {
      setResult(`Error: ${e}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Debug Menu</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Database Status</Text>
        <Text>Initialized: {dbInfo?.initialized ? 'Yes' : 'No'}</Text>
        <Text>Teams: {dbInfo?.teamCount}</Text>
        <Text>Players: {dbInfo?.playerCount}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.button} onPress={handleResetDb}>
          <Text style={styles.buttonText}>Reset Database (Factory Reset)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={loadDbInfo}>
          <Text style={styles.buttonText}>Refresh Info</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#4CAF50' }]} onPress={handleRecalculateOverall}>
          <Text style={styles.buttonText}>Recalculate All Player Ratings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#2196F3', marginTop: 10 }]} onPress={handleGenerateDraft}>
          <Text style={styles.buttonText}>Generate Draft Class (100)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#FF9800', marginTop: 10 }]} onPress={handleExportDb}>
          <Text style={styles.buttonText}>Export DB to JSON</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inspect Player</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Player Name or ID"
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity style={styles.button} onPress={handleSearchPlayer}>
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Result</Text>
        <ScrollView horizontal>
            <Text style={styles.result}>{result}</Text>
        </ScrollView>
      </View>

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>
            <View style={styles.modalButtons}>
              {modalConfig.buttons.map((btn, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.modalButton, btn.style === 'cancel' ? styles.cancelButton : styles.okButton]}
                  onPress={() => {
                    setModalVisible(false);
                    if (btn.onPress) btn.onPress();
                  }}
                >
                  <Text style={styles.modalButtonText}>{btn.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  section: { marginBottom: 20, backgroundColor: 'white', padding: 15, borderRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  button: { backgroundColor: '#2196F3', padding: 10, borderRadius: 5, marginBottom: 10 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 10, borderRadius: 5 },
  result: { fontFamily: 'monospace', fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  okButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
