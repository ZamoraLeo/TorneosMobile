import React, { useState } from 'react'
import { Animated, Pressable, Text, View } from 'react-native'
import { createMaterialTopTabNavigator, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useTheme } from '../theme/theme'

// Screens
import { TournamentsScreen } from '../screens/tournaments/TournamentsScreen'
import { CreateTournamentScreen } from '../screens/tournaments/CreateTournamentScreen'

import { CommunitiesScreen } from '../screens/communities/CommunitiesScreen'
import { ProfileScreen } from '../screens/profile/ProfileScreen'
import { EditProfileScreen } from '../screens/profile/EditProfileScreen'
import { AppSettingsScreen } from '../screens/settings/AppSettingsScreen'
import { HomeScreen } from '../screens/home/HomeScreen'
import { TournamentDetailsScreen } from '../screens/tournaments/TournamentDetailsScreen'

export type MainTabParamList = {
  Home: undefined
  Tournaments: undefined
  Communities: undefined
  Settings: undefined
}

const Tab = createMaterialTopTabNavigator<MainTabParamList>()

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * TabBar inferior con “pill” animado que se desliza entre tabs.
 */
function BottomTabsBar({ state, descriptors, navigation, position }: MaterialTopTabBarProps) {
  const t = useTheme()
  const insets = useSafeAreaInsets()

  const [trackWidth, setTrackWidth] = useState(0)
  const tabCount = state.routes.length
  const tabWidth = trackWidth > 0 ? trackWidth / tabCount : 0

  const inputRange = state.routes.map((_, i) => i)

  // Indicador animado: se mueve continuo con swipe
  const translateX = position.interpolate({
    inputRange,
    outputRange: inputRange.map((i) => i * tabWidth),
  })

  const activeBg = hexToRgba(t.colors.primary, t.isDark ? 0.18 : 0.14)

  return (
    <View
      style={{
        backgroundColor: t.colors.header,
        borderTopWidth: 1,
        borderTopColor: t.colors.border,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 10,
        paddingHorizontal: 10,
      }}
    >
      {/* Track: aquí viven tabs + indicador */}
      <View
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        style={{
          flexDirection: 'row',
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* Pill indicador */}
        {tabWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: tabWidth,
              transform: [{ translateX }],
              padding: 4, // deja un “margen” dentro del track
            }}
          >
            <View
              style={{
                flex: 1,
                borderRadius: 16,
                backgroundColor: activeBg,
              }}
            />
          </Animated.View>
        ) : null}

        {/* Botones */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const isFocused = state.index === index

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name as never)
            }
          }

          // Opacidad animada (se siente suave durante swipe)
          const opacity = position.interpolate({
            inputRange,
            outputRange: inputRange.map((i) => (i === index ? 1 : 0.65)),
          })

          const icon =
            route.name === 'Home'
              ? '🏠'
              : route.name === 'Tournaments'
                ? '🏆'
                : route.name === 'Communities'
                  ? '👥'
                  : '👤'

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                borderRadius: 16,
                backgroundColor: 'transparent', // <- ya no depende de isFocused
              }}
            >
              <Animated.Text
                style={{
                  opacity,
                  color: t.colors.text, // dejamos color fijo; el “mute” lo hace opacity
                  fontSize: 16,
                  fontWeight: '800',
                }}
              >
                {icon}
              </Animated.Text>

              <Animated.Text
                style={{
                  opacity,
                  color: t.colors.text,
                  fontSize: 12,
                  fontWeight: '700',
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {typeof label === 'string' ? label : route.name}
              </Animated.Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

/**
 * Stacks por tab (para crecer después sin romper navegación)
 */
type HomeStackParamList = { HomeMain: undefined }
type TournamentsStackParamList = {
  TournamentsMain: undefined
  CreateTournament: undefined
  TournamentDetails: { tournamentId: string }
}
type CommunitiesStackParamList = { CommunitiesMain: undefined }
type SettingsStackParamList = {
  ProfileMain: undefined
  EditProfile: undefined
  AppSettings: undefined
}

const HomeStack = createNativeStackNavigator<HomeStackParamList>()
const TournamentsStack = createNativeStackNavigator<TournamentsStackParamList>()
const CommunitiesStack = createNativeStackNavigator<CommunitiesStackParamList>()
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()

function useStackScreenOptions() {
  const t = useTheme()
  return {
    headerStyle: { backgroundColor: t.colors.header },
    headerTitleStyle: { color: t.colors.headerText },
    headerTintColor: t.colors.headerText,
    contentStyle: { backgroundColor: t.colors.bg },
  } as const
}

function HomeStackNavigator() {
  const screenOptions = useStackScreenOptions()
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Inicio' }} />
    </HomeStack.Navigator>
  )
}

function TournamentsStackNavigator() {
  const screenOptions = useStackScreenOptions()
  return (
    <TournamentsStack.Navigator screenOptions={screenOptions}>
      <TournamentsStack.Screen
        name="TournamentsMain"
        component={TournamentsScreen}
        options={{ title: 'Torneos' }} />

      <TournamentsStack.Screen
        name="CreateTournament"
        component={CreateTournamentScreen}
        options={{ title: 'Crear torneo' }}
      />

      <TournamentsStack.Screen
        name="TournamentDetails"
        component={TournamentDetailsScreen}
        options={{ title: 'Torneo' }}
      />
    </TournamentsStack.Navigator>
  )
}

function CommunitiesStackNavigator() {
  const screenOptions = useStackScreenOptions()
  return (
    <CommunitiesStack.Navigator screenOptions={screenOptions}>
      <CommunitiesStack.Screen name="CommunitiesMain" component={CommunitiesScreen} options={{ title: 'Comunidades' }} />
    </CommunitiesStack.Navigator>
  )
}

function SettingsStackNavigator() {
  const screenOptions = useStackScreenOptions()
  return (
    <SettingsStack.Navigator screenOptions={screenOptions}>
      <SettingsStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
      <SettingsStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Editar perfil' }}
      />
      <SettingsStack.Screen
        name="AppSettings"
        component={AppSettingsScreen}
        options={{ title: 'Configuración' }}
      />
    </SettingsStack.Navigator>
  )
}

export function MainTabsNavigator() {
  const t = useTheme()

  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      tabBar={(props) => <BottomTabsBar {...props} />}
      screenOptions={{
        sceneStyle: { backgroundColor: t.colors.bg },
      }}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Tournaments" component={TournamentsStackNavigator} options={{ tabBarLabel: 'Torneos' }} />
      <Tab.Screen name="Communities" component={CommunitiesStackNavigator} options={{ tabBarLabel: 'Comunidad' }} />
      <Tab.Screen name="Settings" component={SettingsStackNavigator} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  )
}
