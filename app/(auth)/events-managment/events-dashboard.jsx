import { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";

import EventSimpleCard from "../../../components/Cards/EventSimpleCard";
import WeekCalendar, { toDateKey } from "../../../components/WeekCalendar";
import BottomSpacer from "../../../components/BottomSpacer";
import { useDashboard } from "../../../context/DashboardContext";
import { useSocketStore } from "../../../context/socketStore";
import { useThemedStyles } from "../../../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../../../Theme/StyleConstants";
import { scaleFont, verticalScale } from "../../../Theme/ScalableStyles";
import { dbg, useDebugMount } from "../../../assets/utils/debugLogger";

const TABS = [
  { key: "upcoming", label: "Nadchodzące" },
  { key: "mine", label: "Moje" },
  { key: "finished", label: "Zakończone" },
];

// Statusy uczestnika (statusModel) przełączane w modalu filtrów.
const STATUS_FILTERS = [
  { key: "invited", label: "Zaproszenia", icon: "mail-outline" },
  { key: "accepted", label: "Zaakceptowane", icon: "checkmark-circle-outline" },
  { key: "interested", label: "Zainteresowane", icon: "star-outline" },
  { key: "rejected", label: "Odrzucone", icon: "close-circle-outline" },
];

// Statusy "martwe" — nigdy nie pokazujemy na liście.
const TOMBSTONE_STATUSES = ["invite_cancelled", "invite_declined"];
const ENDED_EVENT_STATUSES = ["completed", "cancelled"];

const getEventDate = (event) => {
  let date = null;
  if (event?.startDateTime) {
    date = new Date(event.startDateTime);
  } else if (event?.startDate) {
    date = new Date(`${event.startDate}T${event.startHour || "00:00"}`);
  }
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

/** "Dzisiaj • 24.04.2025" / "Jutro • ..." / "Czwartek • ..." */
const getSectionLabel = (date) => {
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round((startOfDate - startOfToday) / 86400000);

  let dayLabel;
  if (diffDays === 0) dayLabel = "Dzisiaj";
  else if (diffDays === 1) dayLabel = "Jutro";
  else if (diffDays === -1) dayLabel = "Wczoraj";
  else {
    dayLabel = date.toLocaleDateString("pl-PL", { weekday: "long" });
    dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
  }

  const dateLabel = date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${dayLabel} • ${dateLabel}`;
};

const EventsDashboard = () => {
  dbg("EventsDashboard");
  useDebugMount("EventsDashboard");

  const { styles, colors } = useThemedStyles(createStyles);
  const router = useRouter();
  const { eventsData, refreshEventsData } = useDashboard();

  // Nieprzeczytane powiadomienia / zaproszenia per event — do wyróżnienia kart
  const unreadEventsList = useSocketStore((s) => s.unreadEventsList);
  const unreadInvitesList = useSocketStore((s) => s.unreadInvitesList);
  const unreadEventIds = useMemo(() => {
    const ids = new Set();
    unreadEventsList.forEach((item) => {
      if (item.eventID?._id) ids.add(item.eventID._id);
    });
    unreadInvitesList.forEach((item) => {
      if (item.eventID?._id) ids.add(item.eventID._id);
    });
    return ids;
  }, [unreadEventsList, unreadInvitesList]);

  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedDate, setSelectedDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilters, setStatusFilters] = useState({
    invited: true,
    accepted: true,
    interested: true,
    rejected: true,
  });

  useEffect(() => {
    refreshEventsData().catch(() => {});
  }, [refreshEventsData]);

  const { ownerEvents, userEvents, loading, error, lastFetchedAt } = eventsData;

  const handleEventPress = (event, status) => {
    if (!event?._id) return;

    // Kliknięcie "konsumuje" powiadomienie — optimistic update w store + sync z serwerem
    if (unreadEventIds.has(event._id)) {
      const store = useSocketStore.getState();
      store.markEventAsRead(event._id).catch(() => {});
      store.clearInvite(event._id);
    }

    const isEnded = ENDED_EVENT_STATUSES.includes(event.eventStatus);
    if (status === "owner" && !isEnded) {
      router.push(`/(auth)/events-managment/edit-event?id=${event._id}`);
      return;
    }
    router.push(`/(auth)/single-event?id=${event._id}`);
  };

  // Ujednolicona lista: { event, status } dla ownera i uczestnika.
  const items = useMemo(() => {
    const ownerItems = ownerEvents.map((event) => ({
      event,
      status: "owner",
      key: `owner-${event._id}`,
    }));
    const userItems = userEvents
      .filter(
        (item) => item.eventID && !TOMBSTONE_STATUSES.includes(item.status),
      )
      .map((item) => ({
        event: item.eventID,
        status: item.status,
        key: `user-${item._id}`,
      }));
    return [...ownerItems, ...userItems];
  }, [ownerEvents, userEvents]);

  const sections = useMemo(() => {
    const filtered = items.filter(({ event, status }) => {
      const isEnded =
        ENDED_EVENT_STATUSES.includes(event.eventStatus) ||
        status === "finished";

      if (activeTab === "finished") {
        if (!isEnded) return false;
      } else if (activeTab === "mine") {
        if (status !== "owner" || isEnded) return false;
      } else {
        // upcoming
        if (isEnded) return false;
        if (status !== "owner" && !statusFilters[status]) return false;
      }

      if (selectedDate) {
        const date = getEventDate(event);
        if (!date || toDateKey(date) !== selectedDate) return false;
      }
      return true;
    });

    // Sortowanie chronologiczne + grupowanie po dniu.
    const withDates = filtered
      .map((item) => ({ ...item, date: getEventDate(item.event) }))
      .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));

    const grouped = [];
    for (const item of withDates) {
      const dayKey = item.date ? toDateKey(item.date) : "unknown";
      const last = grouped[grouped.length - 1];
      if (last && last.dayKey === dayKey) {
        last.items.push(item);
      } else {
        grouped.push({
          dayKey,
          label: item.date ? getSectionLabel(item.date) : "Bez daty",
          items: [item],
        });
      }
    }
    return grouped;
  }, [items, activeTab, statusFilters, selectedDate]);

  const toggleStatusFilter = (key) => {
    setStatusFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isInitialLoading = loading && lastFetchedAt === 0;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.header_side}
          onPress={() => router.push("/(auth)/dashboard-home")}
          hitSlop={SPACING.md}
        >
          <AntDesign
            name="arrow-left"
            size={scaleFont(22)}
            color={colors.PrimaryGreen}
          />
        </Pressable>
        <Text style={styles.header_title}>Wydarzenia</Text>
        <Pressable
          style={[styles.header_side, styles.header_filters]}
          onPress={() => setShowFilters(true)}
          hitSlop={SPACING.xs}
        >
          <Ionicons
            name="options-outline"
            size={scaleFont(16)}
            color={colors.primaryText}
          />
          <Text style={styles.header_filters_text}>Filtry</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.Tabs}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.Tabs_button,
              activeTab === tab.key && styles.Tabs_button_active,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.Tabs_button_text,
                activeTab === tab.key && styles.Tabs_button_text_active,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Kalendarz tygodniowy */}
      <WeekCalendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {isInitialLoading && (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.PrimaryGreen} />
          <Text style={styles.stateText}>Ładowanie wydarzeń...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.stateContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={scaleFont(48)}
            color={colors.Danger}
          />
          <Text style={styles.stateText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => refreshEventsData({ force: true }).catch(() => {})}
          >
            <Text style={styles.retryButton_text}>Spróbuj ponownie</Text>
          </Pressable>
        </View>
      )}

      {!isInitialLoading && !error && (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.list_content}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section) => (
            <View key={section.dayKey}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              {section.items.map(({ key, event, status }) => (
                <EventSimpleCard
                  key={key}
                  event={event}
                  myStatus={status}
                  highlighted={unreadEventIds.has(event._id)}
                  onPress={() => handleEventPress(event, status)}
                />
              ))}
            </View>
          ))}

          {sections.length === 0 && (
            <View style={styles.stateContainer}>
              <Ionicons
                name="calendar-outline"
                size={scaleFont(48)}
                color={colors.InactiveIcon}
              />
              <Text style={styles.stateText}>Brak wydarzeń</Text>
              <Text style={styles.stateSubtext}>
                Zmień zakładkę, datę lub filtry
              </Text>
            </View>
          )}
          <BottomSpacer />
        </ScrollView>
      )}

      {/* Modal filtrów statusów uczestnika */}
      <Modal
        visible={showFilters}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilters(false)}
      >
        <Pressable
          style={styles.modal_backdrop}
          onPress={() => setShowFilters(false)}
        >
          <Pressable style={styles.modal_card} onPress={() => {}}>
            <Text style={styles.modal_title}>Filtry statusów</Text>
            {STATUS_FILTERS.map((filter) => {
              const isActive = statusFilters[filter.key];
              return (
                <Pressable
                  key={filter.key}
                  style={styles.modal_row}
                  onPress={() => toggleStatusFilter(filter.key)}
                >
                  <Ionicons
                    name={filter.icon}
                    size={scaleFont(18)}
                    color={isActive ? colors.PrimaryGreen : colors.InactiveIcon}
                  />
                  <Text
                    style={[
                      styles.modal_row_text,
                      !isActive && styles.modal_row_text_inactive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                  <Ionicons
                    name={isActive ? "checkbox" : "square-outline"}
                    size={scaleFont(18)}
                    color={isActive ? colors.PrimaryGreen : colors.InactiveIcon}
                  />
                </Pressable>
              );
            })}
            <Pressable
              style={styles.modal_close}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.modal_close_text}>ZAMKNIJ</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default EventsDashboard;

const createStyles = (colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.sm,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: SPACING.md,
    },
    header_side: {
      justifyContent: "center",
    },
    header_title: {
      fontSize: scaleFont(22, 0.4),
      color: colors.primaryText,
      fontFamily: "Lato-Bold",
    },
    header_filters: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.secondaryCard,
      paddingVertical: verticalScale(8),
      paddingHorizontal: SPACING.sm,
    },
    header_filters_text: {
      fontSize: scaleFont(13, 0.3),
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
      alignItems: "center",
      paddingVertical: verticalScale(10),
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
      fontFamily: "Lato-Bold",
    },

    list: {
      flex: 1,
    },
    list_content: {
      paddingBottom: SPACING.xl,
    },
    sectionLabel: {
      fontSize: scaleFont(12, 0.3),
      color: colors.PrimaryGreen,
      marginBottom: SPACING.sm,
      marginTop: SPACING.xs,
    },

    stateContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: verticalScale(48),
      gap: SPACING.sm,
    },
    stateText: {
      fontSize: scaleFont(15, 0.35),
      color: colors.primaryText,
      textAlign: "center",
    },
    stateSubtext: {
      fontSize: scaleFont(12, 0.3),
      color: colors.secondaryText,
      textAlign: "center",
    },
    retryButton: {
      marginTop: SPACING.sm,
      backgroundColor: colors.PrimaryYellow,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: verticalScale(10),
      paddingHorizontal: SPACING.lg,
    },
    retryButton_text: {
      fontSize: scaleFont(13, 0.3),
      color: colors.background,
      fontWeight: "700",
    },

    modal_backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      paddingHorizontal: SPACING.lg,
    },
    modal_card: {
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
      padding: SPACING.md,
      gap: SPACING.xs,
    },
    modal_title: {
      fontSize: scaleFont(16, 0.35),
      color: colors.primaryText,
      fontFamily: "Lato-Bold",
      marginBottom: SPACING.sm,
      textAlign: "center",
    },
    modal_row: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      paddingVertical: verticalScale(10),
      paddingHorizontal: SPACING.sm,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.secondaryCard,
    },
    modal_row_text: {
      flex: 1,
      fontSize: scaleFont(14, 0.35),
      color: colors.primaryText,
    },
    modal_row_text_inactive: {
      color: colors.secondaryText,
    },
    modal_close: {
      marginTop: SPACING.sm,
      alignItems: "center",
      paddingVertical: verticalScale(10),
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.NeutralButton,
    },
    modal_close_text: {
      fontSize: scaleFont(13, 0.3),
      color: colors.primaryText,
      fontWeight: "700",
    },
  });
