import { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Toast } from "toastify-react-native";
import EventSimpleCard from "../../../components/Cards/EventSimpleCard";
import PlayerCardWithActions from "../../../components/PlayerCardWithActions";
import FormEvent from "../../../components/FormEvent";
import ConfirmModal from "../../../components/popup/ConfirmModal";
import InviteModal from "../../../components/popup/InviteModal";
import SingleEventSettings from "../../../components/popup/single-event-settings";
import BottomSpacer from "../../../components/BottomSpacer";
import customFetch from "../../../assets/utils/customFetch";
import { useDashboard } from "../../../context/DashboardContext";
import {
  getEventOccupancy,
  formatEventDateLabel,
  formatEventFormat,
  getGameTypeLabel,
} from "../../../assets/utils/eventDisplay";
import { dbg, useDebugMount } from "../../../assets/utils/debugLogger";

import { useThemedStyles } from "../../../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../../../Theme/StyleConstants";
import { scaleFont, verticalScale } from "../../../Theme/ScalableStyles";

const TABS = [
  { key: "requests", label: "Zgłoszenia", icon: "person-add-outline" },
  { key: "players", label: "Uczestnicy", icon: "people-outline" },
  { key: "info", label: "Informacje", icon: "information-circle-outline" },
];

// Etykiety 1:1 z single-event.jsx
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

/** { ...userID, userStats } — kształt oczekiwany przez PlayerCard. */
const toPlayerInfo = (userStatus) => ({
  ...userStatus.userID,
  userStats: userStatus.stats,
});

const EditEvent = () => {
  dbg("EditEventScreen");
  useDebugMount("EditEventScreen");

  const { styles, colors } = useThemedStyles(createStyles);
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { removeOwnerEvent } = useDashboard();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("requests");
  const [showEditForm, setShowEditForm] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const requests = users.filter((u) => u.status === "interested");
  const accepted = users.filter((u) => u.status === "accepted");
  const invitedUserIds = users
    .filter((u) => u.status === "invited")
    .map((u) => u.userID._id);

  // Pobierz dane wydarzenia
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await customFetch.get(`/football-events/${id}`);
        setEvent(response.data.event);
      } catch (error) {
        console.error("Błąd pobierania wydarzenia:", error);
        Alert.alert(
          "Błąd",
          "Nie udało się pobrać danych wydarzenia. Możliwe, że zostało usunięte.",
        );
        router.back();
      }
    };

    if (id) fetchEvent();
  }, [id]);

  // Pobierz listę użytkowników powiązanych z wydarzeniem (+ statystyki)
  const fetchUsers = useCallback(async () => {
    try {
      const response = await customFetch.get(`/status/events/${id}/users`);
      const eventUsers = response.data.eventUsers || [];
      const validUsers = eventUsers.filter((u) => u.userID?._id);

      if (validUsers.length === 0) {
        setUsers([]);
        return;
      }

      const userIds = validUsers.map((u) => u.userID._id);
      try {
        const statsResponse = await customFetch.post("/user-stats/multiple", {
          userIds,
        });
        const usersWithStats = validUsers.map((user) => {
          const userStats = statsResponse.data.stats?.find(
            (stat) => stat.userID?.toString() === user.userID._id?.toString(),
          );
          return {
            ...user,
            stats: userStats || {
              gamesPlayed: 0,
              eventsOrganized: 0,
              totalLikes: 0,
            },
          };
        });
        setUsers(usersWithStats);
      } catch (statsError) {
        console.error("Błąd pobierania statystyk:", statsError);
        setUsers(validUsers);
      }
    } catch (error) {
      console.error("Błąd pobierania użytkowników:", error);
      setUsers([]);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchUsers().finally(() => setLoading(false));
  }, [id, fetchUsers]);

  const handleChangeUserStatus = async (userId, newStatus) => {
    try {
      await customFetch.patch(`/status/events/${id}/users/${userId}/status`, {
        status: newStatus,
      });
      await fetchUsers();
    } catch (error) {
      console.error("Błąd zmiany statusu:", error);
      Alert.alert("Błąd", "Nie udało się zmienić statusu");
    }
  };

  const handleDeleteEvent = async () => {
    setActionLoading(true);
    try {
      await customFetch.delete(`/football-events/${id}`);
      removeOwnerEvent(id);
      setShowDeleteModal(false);
      Alert.alert("Sukces", "Wydarzenie zostało usunięte");
      router.back();
    } catch (error) {
      console.error("Błąd usuwania wydarzenia:", error);
      Alert.alert("Błąd", "Nie udało się usunąć wydarzenia");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinishEvent = async () => {
    setActionLoading(true);
    try {
      await customFetch.patch(`/status/events/${id}/finish`);
      setShowFinishModal(false);
      Alert.alert("Sukces", "Wydarzenie zostało zakończone");
      router.back();
    } catch (error) {
      console.error("Błąd kończenia wydarzenia:", error);
      Alert.alert("Błąd", "Nie udało się zakończyć wydarzenia");
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = async () => {
    // try {
    Toast.info("Udostępnianie wydarzenia jest w trakcie implementacji.");
    // await Share.share({
    //   message: `Dołącz do mojego wydarzenia "${event?.eventName || getGameTypeLabel(event?.gameType)}" w aplikacji Boisko+! ${formatEventDateLabel(event)} — ${event?.addressString || event?.address?.city || ""}`,
    // });
    // } catch {
    // użytkownik anulował udostępnianie
    // }
  };

  const handleOpenGroupChat = () => {
    router.push({
      pathname: "/(auth)/chat-room",
      params: { roomId: `group_${id}` },
    });
  };

  if (loading || !event) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.PrimaryGreen} />
        <Text style={styles.loadingText}>Ładowanie wydarzenia...</Text>
      </View>
    );
  }

  const occupancy = getEventOccupancy(event);

  // Pozycje informacji 1:1 z single-event.jsx
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

  return (
    <View style={styles.screen}>
      {/* Header */}
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
        <Text style={styles.header_title}>Zarządzaj meczem</Text>
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
        {/* Skrócone info wydarzenia */}
        <View pointerEvents="none">
          <EventSimpleCard event={event} myStatus="owner" />
        </View>

        {/* Wolne miejsca + edycja (liczba graczy edytowana w FormEvent) */}
        <View style={styles.SlotsRow}>
          <View style={styles.SlotsRow_card}>
            <Text style={styles.SlotsRow_label}>WOLNE MIEJSCA</Text>
            <Text style={styles.SlotsRow_value}>{occupancy.remaining}</Text>
          </View>
          <Pressable
            style={[
              styles.SlotsRow_card,
              styles.SlotsRow_edit,
              showEditForm && styles.SlotsRow_edit_active,
            ]}
            onPress={() => setShowEditForm((prev) => !prev)}
          >
            <Ionicons
              name={showEditForm ? "close-outline" : "create-outline"}
              size={scaleFont(20)}
              color={showEditForm ? colors.Danger : colors.PrimaryGreen}
            />
            <Text style={styles.SlotsRow_edit_text}>
              {showEditForm ? "Zamknij edycję" : "Edytuj wydarzenie"}
            </Text>
          </Pressable>
        </View>

        {showEditForm ? (
          <FormEvent mode="edit" initialData={event} eventId={id} />
        ) : (
          <>
            {/* Tabs */}
            <View style={styles.Tabs}>
              {TABS.map((tab) => {
                const count =
                  tab.key === "requests"
                    ? requests.length
                    : tab.key === "players"
                      ? accepted.length
                      : null;
                const isActive = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    style={[
                      styles.Tabs_button,
                      isActive && styles.Tabs_button_active,
                    ]}
                    onPress={() => setActiveTab(tab.key)}
                  >
                    <Ionicons
                      name={tab.icon}
                      size={scaleFont(14)}
                      color={
                        isActive ? colors.PrimaryGreen : colors.secondaryText
                      }
                    />
                    <Text
                      style={[
                        styles.Tabs_button_text,
                        isActive && styles.Tabs_button_text_active,
                      ]}
                    >
                      {tab.label}
                    </Text>
                    {count !== null && count > 0 && (
                      <View style={styles.Tabs_badge}>
                        <Text style={styles.Tabs_badge_text}>{count}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Zgłoszenia */}
            {activeTab === "requests" &&
              (requests.length > 0 ? (
                requests.map((userStatus) => (
                  <PlayerCardWithActions
                    key={userStatus._id}
                    player={toPlayerInfo(userStatus)}
                    actions={[
                      {
                        text: "Odrzuć",
                        type: "secondary",
                        handler: () =>
                          handleChangeUserStatus(
                            userStatus.userID._id,
                            "rejected",
                          ),
                      },
                      {
                        text: "Akceptuj",
                        type: "primary",
                        handler: () =>
                          handleChangeUserStatus(
                            userStatus.userID._id,
                            "accepted",
                          ),
                      },
                    ]}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>Brak oczekujących zgłoszeń</Text>
              ))}

            {/* Uczestnicy */}
            {activeTab === "players" &&
              (accepted.length > 0 ? (
                accepted.map((userStatus) => (
                  <PlayerCardWithActions
                    key={userStatus._id}
                    player={toPlayerInfo(userStatus)}
                    actions={[
                      {
                        text: "Usuń",
                        type: "secondary",
                        handler: () =>
                          handleChangeUserStatus(
                            userStatus.userID._id,
                            "rejected",
                          ),
                      },
                    ]}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>Brak uczestników</Text>
              ))}

            {/* Informacje — InfoGrid 1:1 z single-event.jsx */}
            {activeTab === "info" && (
              <View style={styles.InfoGrid}>
                {infoItems.map((item) => (
                  <View key={item.label} style={styles.InfoGrid_item}>
                    <Ionicons
                      name={item.icon}
                      size={scaleFont(18)}
                      color={colors.PrimaryGreen}
                    />
                    <View style={styles.InfoGrid_item_texts}>
                      <Text style={styles.InfoGrid_item_label}>
                        {item.label}
                      </Text>
                      <Text
                        style={styles.InfoGrid_item_value}
                        numberOfLines={2}
                      >
                        {item.value}
                      </Text>
                    </View>
                  </View>
                ))}
                {!!event.eventDescription && (
                  <View
                    style={[styles.InfoGrid_item, styles.InfoGrid_item_full]}
                  >
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
            )}

            {/* Zaproś znajomych */}
            <Pressable
              style={styles.InviteButton}
              onPress={() => setShowInviteModal(true)}
            >
              <Ionicons
                name="mail-outline"
                size={scaleFont(18)}
                color={colors.background}
              />
              <Text style={styles.InviteButton_text}>Zaproś znajomych</Text>
            </Pressable>

            {/* Akcje 2x2 */}
            <View style={styles.ActionsGrid}>
              <Pressable
                style={[styles.ActionsGrid_button, styles.ActionsGrid_danger]}
                onPress={() => setShowDeleteModal(true)}
              >
                <Ionicons
                  name="trash-outline"
                  size={scaleFont(18)}
                  color={colors.Danger}
                />
                <Text
                  style={[
                    styles.ActionsGrid_button_text,
                    styles.ActionsGrid_danger_text,
                  ]}
                >
                  Usuń
                </Text>
              </Pressable>
              <Pressable
                style={styles.ActionsGrid_button}
                onPress={() => setShowEditForm(true)}
              >
                <Ionicons
                  name="create-outline"
                  size={scaleFont(18)}
                  color={colors.PrimaryGreen}
                />
                <Text style={styles.ActionsGrid_button_text}>Edytuj</Text>
              </Pressable>
              <Pressable
                style={styles.ActionsGrid_button}
                onPress={handleShare}
              >
                <Ionicons
                  name="share-social-outline"
                  size={scaleFont(18)}
                  color={colors.PrimaryGreen}
                />
                <Text style={styles.ActionsGrid_button_text}>Udostępnij</Text>
              </Pressable>
              <Pressable
                style={styles.ActionsGrid_button}
                onPress={handleOpenGroupChat}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={scaleFont(18)}
                  color={colors.PrimaryGreen}
                />
                <Text style={styles.ActionsGrid_button_text}>Napisz</Text>
              </Pressable>
            </View>
          </>
        )}
        <BottomSpacer />
      </ScrollView>

      {/* Delete Modal */}
      <ConfirmModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteEvent}
        title="Czy na pewno chcesz usunąć to wydarzenie?"
        actionText="USUŃ"
        actionType="danger"
        loading={actionLoading}
      />

      {/* Finish Modal */}
      <ConfirmModal
        visible={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        onConfirm={handleFinishEvent}
        title="Czy na pewno chcesz zakończyć to wydarzenie?"
        actionText="ZAKOŃCZ"
        actionType="warning"
        loading={actionLoading}
      />

      {/* Invite Modal */}
      <InviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        eventId={id}
        invitedUserIds={invitedUserIds}
      />

      {/* Ustawienia właściciela ("…" w headerze) */}
      <SingleEventSettings
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        title="Opcje organizatora"
        options={[
          {
            key: "preview",
            label: "Podgląd wydarzenia",
            icon: "eye-outline",
            onPress: () => router.push(`/(auth)/single-event?id=${id}`),
          },
          {
            key: "finish",
            label: "Zakończ wydarzenie",
            icon: "checkmark-done-outline",
            onPress: () => setShowFinishModal(true),
          },
          {
            key: "delete",
            label: "Usuń wydarzenie",
            icon: "trash-outline",
            color: colors.Danger,
            onPress: () => setShowDeleteModal(true),
          },
        ]}
      />
    </View>
  );
};

export default EditEvent;

const createStyles = (colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.sm,
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
      gap: SPACING.sm,
      padding: SPACING.md,
    },
    loadingText: {
      fontSize: scaleFont(14, 0.35),
      color: colors.primaryText,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: SPACING.md,
    },
    header_side: {
      width: scaleFont(40),
      justifyContent: "center",
    },
    header_side_right: {
      alignItems: "flex-end",
    },
    header_title: {
      fontSize: scaleFont(18, 0.4),
      color: colors.primaryText,
      fontFamily: "BarlowCondensed-Bold",
      textAlign: "center",
    },

    SlotsRow: {
      flexDirection: "row",
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    SlotsRow_card: {
      flex: 1,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondaryCard,
      paddingVertical: verticalScale(12),
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.xs,
    },
    SlotsRow_label: {
      fontSize: scaleFont(10, 0.3),
      color: colors.secondaryText,
      letterSpacing: 1,
    },
    SlotsRow_value: {
      fontSize: scaleFont(20, 0.4),
      color: colors.PrimaryGreen,
      fontFamily: "BarlowCondensed-Bold",
    },
    SlotsRow_edit: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
    SlotsRow_edit_active: {
      borderColor: colors.Danger,
    },
    SlotsRow_edit_text: {
      fontSize: scaleFont(13, 0.35),
      color: colors.primaryText,
    },

    Tabs: {
      flexDirection: "row",
      marginBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    Tabs_button: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.xs,
      paddingVertical: verticalScale(10),
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    Tabs_button_active: {
      borderBottomColor: colors.PrimaryGreen,
    },
    Tabs_button_text: {
      fontSize: scaleFont(12, 0.3),
      color: colors.secondaryText,
    },
    Tabs_button_text_active: {
      color: colors.PrimaryGreen,
      fontFamily: "BarlowCondensed-Bold",
    },
    Tabs_badge: {
      minWidth: scaleFont(18),
      paddingHorizontal: SPACING.xs,
      paddingVertical: 1,
      borderRadius: BORDER_RADIUS.xs,
      backgroundColor: colors.PrimaryGreen,
      alignItems: "center",
    },
    Tabs_badge_text: {
      fontSize: scaleFont(10, 0.3),
      color: colors.background,
      fontWeight: "700",
      fontFamily: "Inter-SemiBold",
    },

    emptyText: {
      fontSize: scaleFont(13, 0.35),
      color: colors.secondaryText,
      textAlign: "center",
      paddingVertical: verticalScale(24),
      fontFamily: "Inter-Regular",
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

    InviteButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.sm,
      backgroundColor: colors.PrimaryGreen,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: verticalScale(12),
      marginTop: SPACING.md,
      marginBottom: SPACING.md,
    },
    InviteButton_text: {
      fontSize: scaleFont(14, 0.35),
      color: colors.background,
      fontWeight: "700",
      fontFamily: "Inter-SemiBold",
    },

    ActionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
    },
    ActionsGrid_button: {
      width: "48%",
      flexGrow: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.sm,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.NeutralButton,
      paddingVertical: verticalScale(12),
    },
    ActionsGrid_button_text: {
      fontSize: scaleFont(13, 0.35),
      color: colors.primaryText,
    },
    ActionsGrid_danger: {
      borderColor: colors.Danger,
    },
    ActionsGrid_danger_text: {
      color: colors.Danger,
    },
  });
