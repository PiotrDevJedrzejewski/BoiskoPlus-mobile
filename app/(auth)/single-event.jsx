import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Toast } from "toastify-react-native";

import PlayerCard from "../../components/PlayerCard";
import EventSimpleCard from "../../components/Cards/EventSimpleCard";
import ConfirmModal from "../../components/popup/ConfirmModal";
import FullScreenAd from "../../components/popup/FullScreenAd";
import SingleEventSettings from "../../components/popup/single-event-settings";
import BottomSpacer from "../../components/BottomSpacer";
import customFetch from "../../assets/utils/customFetch";
import { useDashboard } from "../../context/DashboardContext";
import { useNotification } from "../../context/NotificationContext";
import { useSocketStore } from "../../context/socketStore";
import { dbg, useDebugMount } from "../../assets/utils/debugLogger";
import {
  getEventOccupancy,
  formatEventDateLabel,
  formatEventFormat,
  getGameTypeLabel,
} from "../../assets/utils/eventDisplay";

import { useThemedStyles } from "../../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../../Theme/StyleConstants";
import { scale, verticalScale, scaleFont } from "../../Theme/ScalableStyles";

const LEVEL_LABELS = {
  beginner: "Początkujący",
  intermediate: "Średniozaawansowany",
  advanced: "Zaawansowany",
  professional: "Profesjonalny",
  other: "Inny",
};

const FIELD_TYPE_LABELS = {
  field: "Orlik",
  hall: "Hala",
  other: "Inne",
};

const EVENT_STATUS_LABELS = {
  upcoming: "Nadchodzące",
  live: "Trwa",
  completed: "Zakończone",
  cancelled: "Odwołane",
};

const ENDED_EVENT_STATUSES = ["completed", "cancelled"];

const SingleEvent = () => {
  dbg("SingleEventScreen");
  useDebugMount("SingleEventScreen");

  const { styles, colors } = useThemedStyles(createStyles);

  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventID = id;

  const { filteredEvents, setAdShow } = useDashboard();
  const { muteChatRoom, unmuteChatRoom, muteEvent, unmuteEvent, preferences } =
    useNotification();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [owner, setOwner] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [userStatus, setUserStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("info"); // "info" | "players"

  const [showAd, setShowAd] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [isChatMuted, setIsChatMuted] = useState(false);
  const [isNotificationsMuted, setIsNotificationsMuted] = useState(false);

  // Sprawdzanie czy chat i event są wyciszone
  useEffect(() => {
    if (!preferences || !eventID) return;

    const chatRoomId = `group_${eventID}`;
    const isChatMutedInPrefs = preferences.mutedChatRooms?.some((room) => {
      const isMuted = room.chatRoomId === chatRoomId;
      const isExpired =
        room.muteExpiresAt && new Date() > new Date(room.muteExpiresAt);
      return isMuted && !isExpired;
    });
    setIsChatMuted(isChatMutedInPrefs || false);

    const isEventMutedInPrefs = preferences.mutedEvents?.some(
      (mutedEvent) => mutedEvent.eventId === eventID,
    );
    setIsNotificationsMuted(isEventMutedInPrefs || false);
  }, [preferences, eventID]);

  // Pobierz wydarzenie (ekran samodzielny — działa też bez kontekstu list)
  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        if (filteredEvents?.events) {
          const found = filteredEvents.events.find((e) => e._id === eventID);
          if (found) {
            setEvent(found);
            setLoading(false);
            return;
          }
        }
        const response = await customFetch.get(`/football-events/${eventID}`);
        setEvent(response.data.event);
      } catch (error) {
        console.error("Błąd pobierania wydarzenia:", error);
        setEvent(undefined);
      } finally {
        setLoading(false);
      }
    };

    if (eventID) fetchEvent();
  }, [eventID, filteredEvents]);

  // Pobierz status użytkownika dla wydarzenia
  useEffect(() => {
    if (!eventID) return;
    setStatusLoading(true);

    const fetchStatus = async () => {
      try {
        const response = await customFetch.get(
          `/status/events/${eventID}/my-status`,
        );
        setUserStatus(response.data?.status || null);
      } catch (error) {
        setUserStatus(null);
      } finally {
        setStatusLoading(false);
      }
    };

    fetchStatus();
  }, [eventID]);

  // Pobierz informacje o właścicielu wydarzenia
  useEffect(() => {
    if (!event?.createdBy) return;

    const fetchOwnerInfo = async () => {
      try {
        let userId = event.createdBy;
        if (typeof event.createdBy === "object" && event.createdBy._id) {
          userId = event.createdBy._id;
        } else if (typeof event.createdBy === "object") {
          userId = String(event.createdBy);
        }
        const [userRes, statsRes] = await Promise.all([
          customFetch.get(`/users/${userId}`),
          customFetch.get(`/user-stats/${userId}`),
        ]);
        setOwner({
          ...userRes.data.user,
          userStats: statsRes.data.stats || {
            gamesPlayed: 0,
            eventsOrganized: 0,
            totalLikes: 0,
          },
        });
      } catch (error) {
        console.error("Błąd pobierania właściciela:", error);
      }
    };

    fetchOwnerInfo();
  }, [event]);

  // Pobierz uczestników (zaakceptowani) + liczbę zainteresowanych
  useEffect(() => {
    if (!eventID) return;

    const fetchAcceptedPlayers = async () => {
      setPlayersLoading(true);
      try {
        const response = await customFetch.get(
          `/status/events/${eventID}/users`,
        );
        setInterestedCount(
          (response.data.usersByStatus?.interested || []).length,
        );
        const acceptedUsers = (
          response.data.usersByStatus?.accepted || []
        ).filter((user) => user.userID?._id);

        if (acceptedUsers.length > 0) {
          const userIds = acceptedUsers.map((user) => user.userID._id);
          const statsResponse = await customFetch.post("/user-stats/multiple", {
            userIds,
          });

          const playersWithStats = acceptedUsers.map((user) => {
            const userStats = statsResponse.data.stats?.find(
              (stat) => stat.userID?.toString() === user.userID._id?.toString(),
            );
            return {
              _id: user.userID._id,
              nickName: user.userID.nickName,
              name: user.userID.name,
              surname: user.userID.surname,
              avatarUrl: user.userID.avatarUrl,
              userStats: userStats || {
                gamesPlayed: 0,
                eventsOrganized: 0,
                totalLikes: 0,
              },
            };
          });
          setPlayers(playersWithStats);
        } else {
          setPlayers([]);
        }
      } catch (error) {
        console.error("Błąd pobierania uczestników:", error);
        setPlayers([]);
      } finally {
        setPlayersLoading(false);
      }
    };

    fetchAcceptedPlayers();
  }, [eventID]);

  // Bump socketStore po zmianie własnego statusu, aby DashboardContext
  // odświeżył listy bez per-focus refetchu.
  const notifyStatusChange = (newStatus) => {
    useSocketStore.getState().setLastStatusUpdate({
      timestamp: Date.now(),
      eventId: eventID,
      newStatus,
    });
  };

  const handleRespondToInvite = async (accept) => {
    try {
      await customFetch.patch(`/status/events/${eventID}/invite/respond`, {
        accept,
      });
      const newStatus = accept ? "accepted" : "invite_declined";
      setUserStatus(newStatus);
      notifyStatusChange(newStatus);
    } catch (error) {
      Alert.alert(
        "Błąd",
        error?.response?.data?.msg ||
          "Nie udało się odpowiedzieć na zaproszenie",
      );
      console.error("Błąd respondToInvite:", error);
    }
  };

  const handleJoinRequest = async () => {
    if (userStatus === "interested" || userStatus === "accepted") {
      Alert.alert("Info", "Już masz status dla tego wydarzenia");
      return;
    }

    try {
      setShowAd(true);
      setUserStatus("interested");
      await customFetch.post(`/status/events/${eventID}/join`);
      notifyStatusChange("interested");
    } catch (error) {
      Alert.alert("Info", "Już masz status dla tego wydarzenia");
      console.error(error);
    }
  };

  const handleAfterAd = () => {
    setShowAd(false);
    if (setAdShow) setAdShow(false);
  };

  const confirmLeave = async () => {
    try {
      await customFetch.delete(`/status/events/${eventID}/leave`);
      setUserStatus(null);
      setShowLeaveConfirm(false);
      notifyStatusChange("left");
      Toast.success("Pomyślnie wycofano z wydarzenia");
    } catch (error) {
      setShowLeaveConfirm(false);
      Toast.error("Nie możesz się wycofać z tego wydarzenia");
      console.error("Błąd podczas wycofywania z wydarzenia:", error);
    }
  };

  const handleToggleChatMute = async () => {
    try {
      const chatRoomId = `group_${eventID}`;
      if (isChatMuted) {
        const result = await unmuteChatRoom(chatRoomId);
        if (result.success) {
          setIsChatMuted(false);
          Toast.success("Powiadomienia z czatu zostały włączone");
        } else {
          Toast.error("Błąd podczas włączania powiadomień z czatu");
        }
      } else {
        const result = await muteChatRoom(chatRoomId);
        if (result.success) {
          setIsChatMuted(true);
          Toast.success("Powiadomienia z czatu zostały wyciszone");
        } else {
          Toast.error("Błąd podczas wyciszania powiadomień z czatu");
        }
      }
    } catch (error) {
      Toast.error("Błąd podczas zmiany ustawień powiadomień z czatu");
      console.error("Błąd handleToggleChatMute:", error);
    }
  };

  const handleToggleNotificationsMute = async () => {
    try {
      if (isNotificationsMuted) {
        const result = await unmuteEvent(eventID);
        if (result.success) {
          setIsNotificationsMuted(false);
          Toast.success("Powiadomienia z wydarzenia zostały włączone");
        } else {
          Toast.error("Błąd podczas włączania powiadomień z wydarzenia");
        }
      } else {
        const result = await muteEvent(eventID);
        if (result.success) {
          setIsNotificationsMuted(true);
          Toast.success("Powiadomienia z wydarzenia zostały wyciszone");
        } else {
          Toast.error("Błąd podczas wyciszania powiadomień z wydarzenia");
        }
      }
    } catch (error) {
      Toast.error("Błąd podczas zmiany ustawień powiadomień z wydarzenia");
      console.error("Błąd handleToggleNotificationsMute:", error);
    }
  };

  const handleReport = () => {
    router.push({
      pathname: "/(auth)/report",
      params: { type: "event", reportedEventId: eventID },
    });
  };

  const handleContactOwner = () => {
    if (!owner?._id) return;
    router.push({
      pathname: "/(auth)/chat",
      params: { openChatWith: owner._id },
    });
  };

  const handleBookmark = () => {
    Toast.info("Zapisywanie wydarzeń — już wkrótce!");
  };

  const handleShare = () => {
    Toast.info("Udostępnianie wydarzeń — już wkrótce!");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.PrimaryGreen} />
        <Text style={styles.loadingText}>Ładowanie wydarzenia...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons
          name="alert-circle"
          size={scaleFont(64, 0.35)}
          color={colors.Danger}
        />
        <Text style={styles.notFoundText}>
          Nie znaleziono wydarzenia o podanym ID, możliwe że zostało usunięte
        </Text>
        <Pressable style={styles.notFoundButton} onPress={() => router.back()}>
          <Text style={styles.notFoundButton_text}>WRÓĆ</Text>
        </Pressable>
      </View>
    );
  }

  const occupancy = getEventOccupancy(event);
  const progress =
    occupancy.max > 0
      ? Math.min(1, Math.max(0, occupancy.current / occupancy.max))
      : 0;

  const infoItems = [
    {
      icon: "calendar-outline",
      label: "Data",
      value: formatEventDateLabel(event) || "—",
    },
    {
      icon: "location-outline",
      label: "Adres",
      value: event.addressString || event.address?.city || "—",
    },
    {
      icon: "football-outline",
      label: "Typ gry",
      value: getGameTypeLabel(event.gameType),
    },
    {
      icon: "golf-outline",
      label: "Nawierzchnia",
      value: FIELD_TYPE_LABELS[event.fieldType] || "—",
    },
    {
      icon: "time-outline",
      label: "Czas trwania",
      value: event.duration ? `${event.duration} minut` : "—",
    },
    {
      icon: "wallet-outline",
      label: "Cena",
      value: `${event.price || 0} zł`,
    },
    ...(event.price > 0
      ? [
          {
            icon: "card-outline",
            label: "Płatność",
            value: event.paymentMethod || "—",
          },
        ]
      : []),
    {
      icon: "people-outline",
      label: "Poziom",
      value: LEVEL_LABELS[event.level] || "—",
    },
    {
      icon: "star-outline",
      label: "Format",
      value: formatEventFormat(event.format),
    },
    {
      icon: "accessibility-outline",
      label: "Przedział wiekowy",
      value: Array.isArray(event.ageRange)
        ? `${event.ageRange[0]} - ${event.ageRange[1]} lat`
        : "—",
    },
    ...(event.phoneNumber
      ? [
          {
            icon: "call-outline",
            label: "Telefon",
            value: event.phoneNumber,
          },
        ]
      : []),
    {
      icon: "repeat-outline",
      label: "Cykliczne",
      value: event.isRecurring ? "Tak" : "Nie",
    },
    {
      icon: "pulse-outline",
      label: "Status",
      value: EVENT_STATUS_LABELS[event.eventStatus] || "—",
    },
  ];

  const isParticipating =
    userStatus === "accepted" || userStatus === "interested";
  const isEventEnded = ENDED_EVENT_STATUSES.includes(event.eventStatus);

  return (
    <View style={styles.screen}>
      {/* Fixed header */}
      <View style={styles.header}>
        <Pressable
          style={styles.header_side}
          onPress={() => router.back()}
          hitSlop={SPACING.md}
        >
          <AntDesign
            name="arrow-left"
            size={scaleFont(22)}
            color={colors.PrimaryGreen}
          />
        </Pressable>
        <Text style={styles.header_title}>Szczegóły meczu</Text>
        <Pressable
          style={[styles.header_side, styles.header_side_right]}
          onPress={() => setShowSettings(true)}
          hitSlop={SPACING.md}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={scaleFont(22)}
            color={colors.primaryText}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.container_content}
        showsVerticalScrollIndicator={false}
      >
        {/* Skrócone info wydarzenia (bez nawigacji — jesteśmy na tym ekranie) */}
        <View pointerEvents="none">
          <EventSimpleCard event={event} myStatus={userStatus} />
        </View>

        {/* Statystyki: zainteresowani / poszukiwani / uczestnicy */}
        <View style={styles.StatsCard}>
          <View style={styles.StatsCard_section}>
            <View style={styles.StatsCard_section_header}>
              <Ionicons
                name="people-outline"
                size={scaleFont(14)}
                color={colors.PrimaryGreen}
              />
              <Text style={styles.StatsCard_section_label}>ZAINTERESOWANI</Text>
            </View>
            <Text style={styles.StatsCard_section_value}>
              {interestedCount}
            </Text>
          </View>
          <View style={styles.StatsCard_divider} />
          <View style={styles.StatsCard_section}>
            <View style={styles.StatsCard_section_header}>
              <Ionicons
                name="search-outline"
                size={scaleFont(14)}
                color={colors.PrimaryGreen}
              />
              <Text style={styles.StatsCard_section_label}>POSZUKIWANI</Text>
            </View>
            <Text style={styles.StatsCard_section_value}>
              {occupancy.remaining}
            </Text>
          </View>
          <View style={styles.StatsCard_divider} />
          <View style={styles.StatsCard_section}>
            <View style={styles.StatsCard_section_header}>
              <Ionicons
                name="people-outline"
                size={scaleFont(14)}
                color={colors.PrimaryGreen}
              />
              <Text style={styles.StatsCard_section_label}>UCZESTNICY</Text>
            </View>
            <Text style={styles.StatsCard_section_value}>
              <Text style={{ color: colors.PrimaryGreen }}>
                {occupancy.current}
              </Text>
              {" / "}
              {occupancy.max}
            </Text>
          </View>
        </View>

        {/* Akcje */}
        {isEventEnded ? (
          <View style={styles.Actions}>
            <Pressable
              style={[styles.Actions_main, styles.Actions_main_disabled]}
              disabled
            >
              <Text
                style={[
                  styles.Actions_main_text,
                  styles.Actions_main_text_disabled,
                ]}
              >
                Zakończono
              </Text>
            </Pressable>
            <Pressable style={styles.Actions_small} onPress={handleShare}>
              <MaterialCommunityIcons
                name="share-variant-outline"
                size={scaleFont(20)}
                color={colors.primaryText}
              />
            </Pressable>
            <Pressable style={styles.Actions_small} onPress={handleBookmark}>
              <Ionicons
                name="bookmark-outline"
                size={scaleFont(20)}
                color={colors.primaryText}
              />
            </Pressable>
          </View>
        ) : userStatus === "invited" ? (
          <View style={styles.Actions}>
            <Pressable
              style={[styles.Actions_main, { flex: 1 }]}
              onPress={() => handleRespondToInvite(true)}
            >
              <Text style={styles.Actions_main_text}>AKCEPTUJ</Text>
            </Pressable>
            <Pressable
              style={[styles.Actions_small, styles.Actions_decline]}
              onPress={() => handleRespondToInvite(false)}
            >
              <Ionicons
                name="close"
                size={scaleFont(20)}
                color={colors.Danger}
              />
            </Pressable>
          </View>
        ) : (
          <View style={styles.Actions}>
            <Pressable
              style={[
                styles.Actions_main,
                isParticipating && styles.Actions_main_leave,
              ]}
              disabled={statusLoading}
              onPress={
                isParticipating
                  ? () => setShowLeaveConfirm(true)
                  : handleJoinRequest
              }
            >
              <Text style={styles.Actions_main_text}>
                {isParticipating ? "WYCOFAJ SIĘ" : "ZGŁOŚ CHĘĆ UDZIAŁU"}
              </Text>
            </Pressable>
            <Pressable style={styles.Actions_small} onPress={handleShare}>
              <MaterialCommunityIcons
                name="share-variant-outline"
                size={scaleFont(20)}
                color={colors.primaryText}
              />
            </Pressable>
            <Pressable style={styles.Actions_small} onPress={handleBookmark}>
              <Ionicons
                name="bookmark-outline"
                size={scaleFont(20)}
                color={colors.primaryText}
              />
            </Pressable>
          </View>
        )}

        {/* Progress bar */}
        <View style={styles.ProgressCard}>
          <View style={styles.ProgressCard_header}>
            <Text style={styles.ProgressCard_title}>Zapełnienie</Text>
            <Text style={styles.ProgressCard_count}>
              {occupancy.current} / {occupancy.max}
            </Text>
          </View>
          <View style={styles.ProgressCard_track}>
            <View
              style={[
                styles.ProgressCard_fill,
                { width: `${progress * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Przełącznik zakładek */}
        <View style={styles.Tabs}>
          <Pressable
            style={[
              styles.Tabs_button,
              activeTab === "info" && styles.Tabs_button_active,
            ]}
            onPress={() => setActiveTab("info")}
          >
            <Text
              style={[
                styles.Tabs_button_text,
                activeTab === "info" && styles.Tabs_button_text_active,
              ]}
            >
              Informacje
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.Tabs_button,
              activeTab === "players" && styles.Tabs_button_active,
            ]}
            onPress={() => setActiveTab("players")}
          >
            <Text
              style={[
                styles.Tabs_button_text,
                activeTab === "players" && styles.Tabs_button_text_active,
              ]}
            >
              Uczestnicy
            </Text>
          </Pressable>
        </View>

        {activeTab === "info" ? (
          <View style={styles.InfoGrid}>
            {infoItems.map((item) => (
              <View key={item.label} style={styles.InfoGrid_item}>
                <Ionicons
                  name={item.icon}
                  size={scaleFont(18)}
                  color={colors.PrimaryGreen}
                />
                <View style={styles.InfoGrid_item_texts}>
                  <Text style={styles.InfoGrid_item_label}>{item.label}</Text>
                  <Text style={styles.InfoGrid_item_value} numberOfLines={2}>
                    {item.value}
                  </Text>
                </View>
              </View>
            ))}
            {!!event.eventDescription && (
              <View style={[styles.InfoGrid_item, styles.InfoGrid_item_full]}>
                <Ionicons
                  name="document-text-outline"
                  size={scaleFont(18)}
                  color={colors.PrimaryGreen}
                />
                <View style={styles.InfoGrid_item_texts}>
                  <Text style={styles.InfoGrid_item_label}>Opis</Text>
                  <Text style={styles.InfoGrid_item_value}>
                    {event.eventDescription}
                  </Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.Players}>
            {playersLoading ? (
              <ActivityIndicator color={colors.PrimaryGreen} />
            ) : players.length > 0 ? (
              players.map((player) => (
                <PlayerCard key={player._id} playerInfo={player} />
              ))
            ) : (
              <Text style={styles.Players_empty}>
                Brak zaakceptowanych uczestników
              </Text>
            )}
          </View>
        )}

        {/* Organizator */}
        <View style={styles.Organizer}>
          <View style={styles.Organizer_header}>
            <Text style={styles.Organizer_title}>Organizator</Text>
            <Pressable
              style={styles.Organizer_contact}
              onPress={handleContactOwner}
              disabled={!owner}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={scaleFont(14)}
                color={colors.PrimaryGreen}
              />
              <Text style={styles.Organizer_contact_text}>Skontaktuj się</Text>
            </Pressable>
          </View>
          {owner ? (
            <PlayerCard playerInfo={owner} />
          ) : (
            <ActivityIndicator color={colors.PrimaryGreen} />
          )}
        </View>

        <BottomSpacer />
      </ScrollView>

      <FullScreenAd visible={showAd} onClose={handleAfterAd} />
      <ConfirmModal
        visible={showLeaveConfirm}
        title="Wycofać się z wydarzenia? Twoje miejsce zostanie zwolnione."
        actionText="WYCOFAJ SIĘ"
        onConfirm={confirmLeave}
        onClose={() => setShowLeaveConfirm(false)}
      />
      <SingleEventSettings
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        isChatMuted={isChatMuted}
        isNotificationsMuted={isNotificationsMuted}
        onToggleChatMute={handleToggleChatMute}
        onToggleNotificationsMute={handleToggleNotificationsMute}
        onReport={handleReport}
      />
    </View>
  );
};

export default SingleEvent;

const createStyles = (colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.md,
    },
    container: {
      flex: 1,
    },
    container_content: {
      paddingBottom: SPACING.xl,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      gap: SPACING.md,
      padding: SPACING.lg,
    },
    loadingText: {
      fontSize: scaleFont(14, 0.35),
      color: colors.secondaryText,
    },
    notFoundText: {
      fontSize: scaleFont(14, 0.35),
      color: colors.primaryText,
      textAlign: "center",
    },
    notFoundButton: {
      backgroundColor: colors.PrimaryGreen,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.xl,
    },
    notFoundButton_text: {
      fontSize: scaleFont(14, 0.35),
      color: "#000",
      fontWeight: "bold",
      fontFamily: "Inter-SemiBold",
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: SPACING.md,
    },
    header_side: {
      width: scale(32),
      justifyContent: "center",
    },
    header_side_right: {
      alignItems: "flex-end",
    },
    header_title: {
      fontSize: scaleFont(18, 0.35),
      color: colors.primaryText,
      fontFamily: "BarlowCondensed-Bold",
      textAlign: "center",
    },

    StatsCard: {
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondaryCard,
      marginBottom: SPACING.md,
      paddingVertical: SPACING.md,
      flexDirection: "row",
    },
    StatsCard_section: {
      flex: 1,
      alignItems: "center",
      gap: SPACING.sm,
    },
    StatsCard_section_header: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
    },
    StatsCard_section_label: {
      fontSize: scaleFont(8, 0.3),
      color: colors.secondaryText,
    },
    StatsCard_section_value: {
      fontSize: scaleFont(20, 0.35),
      color: colors.PrimaryGreen,
      fontFamily: "BarlowCondensed-Bold",
    },
    StatsCard_divider: {
      width: 1,
      backgroundColor: colors.divider,
    },

    ProgressCard: {
      // borderRadius: BORDER_RADIUS.lg,
      // borderWidth: 1,
      // borderColor: colors.border,
      // backgroundColor: colors.secondaryCard,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      marginTop: SPACING.md,
      gap: SPACING.sm,
    },
    ProgressCard_header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    ProgressCard_title: {
      fontSize: scaleFont(14, 0.35),
      color: colors.primaryText,
      fontFamily: "BarlowCondensed-Bold",
    },
    ProgressCard_count: {
      fontSize: scaleFont(12, 0.3),
      color: colors.secondaryText,
    },
    ProgressCard_track: {
      height: verticalScale(14),
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: colors.ProgressBackground,
      overflow: "hidden",
    },
    ProgressCard_fill: {
      height: "100%",
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: colors.ProgressFill,
    },

    Tabs: {
      flexDirection: "row",
      marginBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    Tabs_button: {
      flex: 1,
      alignItems: "center",
      paddingVertical: SPACING.sm,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    Tabs_button_active: {
      borderBottomColor: colors.PrimaryGreen,
    },
    Tabs_button_text: {
      fontSize: scaleFont(14, 0.35),
      color: colors.secondaryText,
    },
    Tabs_button_text_active: {
      color: colors.PrimaryGreen,
      fontFamily: "BarlowCondensed-Bold",
    },

    InfoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondaryCard,
      marginBottom: SPACING.md,
      overflow: "hidden",
    },
    InfoGrid_item: {
      width: "50%",
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      padding: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    InfoGrid_item_full: {
      width: "100%",
    },
    InfoGrid_item_texts: {
      flex: 1,
      gap: SPACING.xs,
    },
    InfoGrid_item_label: {
      fontSize: scaleFont(10, 0.3),
      color: colors.secondaryText,
    },
    InfoGrid_item_value: {
      fontSize: scaleFont(12, 0.3),
      color: colors.primaryText,
    },

    Players: {
      marginBottom: SPACING.md,
    },
    Players_empty: {
      fontSize: scaleFont(12, 0.3),
      color: colors.Placeholder,
      textAlign: "center",
      paddingVertical: SPACING.lg,
    },

    Organizer: {
      marginBottom: SPACING.md,
    },
    Organizer_header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.sm,
    },
    Organizer_title: {
      fontSize: scaleFont(14, 0.35),
      color: colors.primaryText,
      fontFamily: "BarlowCondensed-Bold",
    },
    Organizer_contact: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: colors.NeutralButton,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
    },
    Organizer_contact_text: {
      fontSize: scaleFont(12, 0.3),
      color: colors.PrimaryGreen,
    },

    Actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    Actions_main: {
      flex: 1,
      backgroundColor: colors.PrimaryGreen,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.md,
      alignItems: "center",
    },
    Actions_main_disabled: {
      backgroundColor: colors.NeutralButton,
    },
    Actions_main_leave: {
      backgroundColor: colors.Danger,
    },
    Actions_main_text: {
      fontSize: scaleFont(14, 0.35),
      color: "#000",
      fontWeight: "bold",
      fontFamily: "Inter-SemiBold",
    },
    Actions_main_text_disabled: {
      color: colors.InactiveIcon,
    },
    Actions_small: {
      width: scale(48),
      height: scale(48),
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.NeutralButton,
      justifyContent: "center",
      alignItems: "center",
    },
    Actions_decline: {
      borderColor: colors.Danger,
    },
  });
