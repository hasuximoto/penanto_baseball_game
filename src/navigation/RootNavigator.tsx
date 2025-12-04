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
 * プレースホルダースクリーン（実装待ち）
 */
const PlaceholderScreen = () => {
  return null;
};

/**
 * ルートナビゲーション
 */
export const RootNavigator = () => (
  <NavigationContainer>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#999',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
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
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="PlayersTab"
        component={PlayerStack}
        options={{
          tabBarLabel: 'Players',
        }}
      />
      <Tab.Screen
        name="ScheduleTab"
        component={ScheduleScreen}
        options={{
          tabBarLabel: 'Schedule',
        }}
      />
      <Tab.Screen
        name="StatsTab"
        component={TeamStatsStack}
        options={{
          tabBarLabel: 'Stats',
        }}
      />
      <Tab.Screen
        name="NewsTab"
        component={NewsStack}
        options={{
          tabBarLabel: 'News',
        }}
      />
    </Tab.Navigator>
  </NavigationContainer>
);
