import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// スクリーンはここにインポートします
// Re-trigger bundle
import { MainMenuScreen } from '../screens/MainMenuScreen';
import { PlayerListScreen } from '../screens/PlayerListScreen';
import { PlayerAbilityScreen } from '../screens/PlayerAbilityScreen';
import { PlayerDetailScreen } from '../screens/PlayerDetailScreen';
import { DailyResultsScreen } from '../screens/DailyResultsScreen';
import { BoxScoreScreen } from '../screens/BoxScoreScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { NewsScreen } from '../screens/NewsScreen';
import { NewsDetailScreen } from '../screens/NewsDetailScreen';
import { TeamStatsScreen } from '../screens/TeamStatsScreen';
import { DebugScreen } from '../screens/DebugScreen';
// import { GameScreen } from '../screens/GameScreen';
import { StoveLeagueScreen } from '../screens/StoveLeagueScreen';
import { DraftScreen } from '../screens/DraftScreen';
import { TitleHistoryScreen } from '../screens/TitleHistoryScreen';
import { TeamOrderScreen } from '../screens/TeamOrderScreen';
import { ReleasePlayersScreen } from '../screens/ReleasePlayersScreen';
import { OffSeasonMarketScreen } from '../screens/OffSeasonMarketScreen';
import { TitleScreen } from '../screens/TitleScreen';
import { TeamSelectionScreen } from '../screens/TeamSelectionScreen';
import { TeamMenuScreen } from '../screens/TeamMenuScreen';
import { RosterMoveScreen } from '../screens/RosterMoveScreen';
// import { PlayerDataScreen } from '../screens/PlayerDataScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * メインスタック（ホーム画面関連）
 */
const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: '#4CAF50' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
      headerBackImage: ({ tintColor }) => <Ionicons name="arrow-back" size={24} color={tintColor} />,
    }}
  >
    <Stack.Screen
      name="MainMenu"
      component={MainMenuScreen}
      options={{ title: 'SimBaseBall' }}
    />
    <Stack.Screen
      name="TeamOrder"
      component={TeamOrderScreen as any}
      options={{ title: 'Team Order', headerShown: false }}
    />
    <Stack.Screen
      name="DailyResults"
      component={DailyResultsScreen}
      options={{ title: 'Game Results' }}
    />
    <Stack.Screen
      name="BoxScore"
      component={BoxScoreScreen}
      options={{ title: 'Box Score' }}
    />
    <Stack.Screen
      name="StoveLeague"
      component={StoveLeagueScreen}
      options={{ title: 'Off Season' }}
    />
    <Stack.Screen
      name="Draft"
      component={DraftScreen}
      options={{ title: 'Draft Meeting' }}
    />
    <Stack.Screen
      name="Debug"
      component={DebugScreen}
      options={{ title: 'Debug Menu' }}
    />
    <Stack.Screen
      name="TitleHistory"
      component={TitleHistoryScreen}
      options={{ title: '年度別タイトル獲得者一覧' }}
    />
    <Stack.Screen
      name="ReleasePlayers"
      component={ReleasePlayersScreen}
      options={{ title: '戦力外通告' }}
    />
    <Stack.Screen
      name="OffSeasonMarket"
      component={OffSeasonMarketScreen}
      options={{ title: '戦力補強' }}
    />
    {/* <Stack.Screen
      name="Game"
      component={GameScreen}
      options={{ title: 'Game' }}
    />
    <Stack.Screen
      name="StoveLeague"
      component={StoveLeagueScreen}
      options={{ title: 'Stove League' }}
    /> */}
  </Stack.Navigator>
);

/**
 * プレイヤースタック（選手情報関連）
 */
const PlayerStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: '#2196F3' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
      headerBackImage: ({ tintColor }) => <Ionicons name="arrow-back" size={24} color={tintColor} />,
    }}
  >
    <Stack.Screen
      name="PlayerList"
      component={PlayerListScreen}
      options={{ title: 'Player List' }}
    />
    <Stack.Screen
      name="PlayerAbility"
      component={PlayerAbilityScreen}
      options={{ title: 'Player Abilities' }}
    />
    <Stack.Screen
      name="PlayerDetail"
      component={PlayerDetailScreen}
      options={{ title: 'Player Detail' }}
    />
  </Stack.Navigator>
);

/**
 * ニューススタック
 */
const NewsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: '#607D8B' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
      headerBackImage: ({ tintColor }) => <Ionicons name="arrow-back" size={24} color={tintColor} />,
    }}
  >
    <Stack.Screen
      name="NewsList"
      component={NewsScreen}
      options={{ title: 'News' }}
    />
    <Stack.Screen
      name="NewsDetail"
      component={NewsDetailScreen}
      options={{ title: 'Details' }}
    />
  </Stack.Navigator>
);

/**
 * チームスタッツスタック
 */
const TeamStatsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: '#9C27B0' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
      headerBackImage: ({ tintColor }) => <Ionicons name="arrow-back" size={24} color={tintColor} />,
    }}
  >
    <Stack.Screen
      name="TeamStats"
      component={TeamStatsScreen}
      options={{ title: 'Team Stats' }}
    />
  </Stack.Navigator>
);

/**
 * チーム管理スタック
 */
const TeamStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: '#4CAF50' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
      headerBackImage: ({ tintColor }) => <Ionicons name="arrow-back" size={24} color={tintColor} />,
    }}
  >
    <Stack.Screen
      name="TeamMenu"
      component={TeamMenuScreen}
      options={{ title: '球団管理' }}
    />
    <Stack.Screen
      name="RosterMove"
      component={RosterMoveScreen as any}
      options={{ title: '一軍登録・抹消' }}
    />
    <Stack.Screen
      name="TeamOrder"
      component={TeamOrderScreen as any}
      options={{ title: 'オーダー設定', headerShown: false }}
    />
    <Stack.Screen
      name="TeamStats"
      component={TeamStatsScreen}
      options={{ title: 'チーム成績' }}
    />
  </Stack.Navigator>
);

/**
 * プレースホルダースクリーン（実装待ち）
 */
const PlaceholderScreen = () => {
  return null;
};



const MainTabNavigator = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#999',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TeamTab') {
            iconName = focused ? 'shirt' : 'shirt-outline';
          } else if (route.name === 'PlayersTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'ScheduleTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'StatsTab') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'NewsTab') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={MainStack}
        options={{
          tabBarLabel: 'ホーム',
        }}
      />
      <Tab.Screen
        name="TeamTab"
        component={TeamStack}
        options={{
          tabBarLabel: '球団',
        }}
      />
      <Tab.Screen
        name="PlayersTab"
        component={PlayerStack}
        options={{
          tabBarLabel: '選手一覧',
        }}
      />
      <Tab.Screen
        name="ScheduleTab"
        component={ScheduleScreen}
        options={{
          tabBarLabel: '日程',
        }}
      />
      <Tab.Screen
        name="StatsTab"
        component={TeamStatsStack}
        options={{
          tabBarLabel: '順位表',
        }}
      />
      <Tab.Screen
        name="NewsTab"
        component={NewsStack}
        options={{
          tabBarLabel: 'ニュース',
        }}
      />
    </Tab.Navigator>
);

/**
 * ルートナビゲーション
 */
export const RootNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Title" component={TitleScreen} />
      <Stack.Screen name="TeamSelection" component={TeamSelectionScreen} />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
    </Stack.Navigator>
  </NavigationContainer>
);