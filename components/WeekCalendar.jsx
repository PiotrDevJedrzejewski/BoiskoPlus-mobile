import { useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useThemedStyles } from "../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../Theme/StyleConstants";
import { scaleFont, verticalScale, scale } from "../Theme/ScalableStyles";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS_BACK = 4;
const WEEKS_FORWARD = 8;

const DAY_SHORT = ["Ndz", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];

/** 'YYYY-MM-DD' w strefie lokalnej. */
export const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/** Poniedziałek tygodnia zawierającego `date` (00:00 lokalnie). */
const startOfWeek = (date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = niedziela
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

/**
 * Pasek kalendarza — tygodnie przewijane horyzontalnie (paging),
 * ostatnia ikona otwiera systemowy kalendarz (dowolna data).
 *
 * Props:
 * - selectedDate: 'YYYY-MM-DD' | null
 * - onSelectDate: (dateKey | null) => void — ponowny tap na wybrany dzień czyści wybór
 */
const WeekCalendar = ({ selectedDate, onSelectDate }) => {
  const { styles, colors } = useThemedStyles(createStyles);
  const [stripWidth, setStripWidth] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const scrollRef = useRef(null);

  const todayKey = toDateKey(new Date());

  // Tygodnie: WEEKS_BACK wstecz i WEEKS_FORWARD do przodu od bieżącego.
  const weeks = useMemo(() => {
    const currentWeekStart = startOfWeek(new Date());
    const result = [];
    for (let w = -WEEKS_BACK; w <= WEEKS_FORWARD; w++) {
      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(
          currentWeekStart.getTime() + (w * 7 + i) * DAY_MS,
        );
        days.push({
          key: toDateKey(date),
          dayNumber: date.getDate(),
          dayShort: DAY_SHORT[date.getDay()],
        });
      }
      result.push({ key: `week-${w}`, days });
    }
    return result;
  }, []);

  const handlePickerChange = (event, date) => {
    setShowPicker(false);
    if (event.type === "set" && date) {
      onSelectDate(toDateKey(date));
    }
  };

  const handleDayPress = (dayKey) => {
    onSelectDate(dayKey === selectedDate ? null : dayKey);
  };

  return (
    <View style={styles.calendar}>
      <View
        style={styles.calendar_strip}
        onLayout={({ nativeEvent }) => setStripWidth(nativeEvent.layout.width)}
      >
        {stripWidth > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: WEEKS_BACK * stripWidth, y: 0 }}
          >
            {weeks.map((week) => (
              <View
                key={week.key}
                style={[styles.calendar_week, { width: stripWidth }]}
              >
                {week.days.map((day) => {
                  const isSelected = day.key === selectedDate;
                  const isToday = day.key === todayKey;
                  return (
                    <Pressable
                      key={day.key}
                      style={[
                        styles.calendar_day,
                        isSelected && styles.calendar_day_selected,
                      ]}
                      onPress={() => handleDayPress(day.key)}
                    >
                      <Text
                        style={[
                          styles.calendar_day_number,
                          (isSelected || isToday) &&
                            styles.calendar_day_text_active,
                        ]}
                      >
                        {day.dayNumber}
                      </Text>
                      <Text
                        style={[
                          styles.calendar_day_label,
                          (isSelected || isToday) &&
                            styles.calendar_day_text_active,
                        ]}
                      >
                        {isToday ? "Dziś" : day.dayShort}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <Pressable
        style={styles.calendar_pickerButton}
        onPress={() => setShowPicker(true)}
        hitSlop={SPACING.xs}
      >
        <Ionicons
          name="calendar-outline"
          size={scaleFont(20)}
          color={selectedDate ? colors.PrimaryGreen : colors.primaryText}
        />
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={selectedDate ? new Date(selectedDate) : new Date()}
          mode="date"
          display="default"
          onChange={handlePickerChange}
        />
      )}
    </View>
  );
};

export default WeekCalendar;

const createStyles = (colors) =>
  StyleSheet.create({
    calendar: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    calendar_strip: {
      flex: 1,
    },
    calendar_week: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: SPACING.xs,
    },
    calendar_day: {
      flex: 1,
      alignItems: "center",
      paddingVertical: verticalScale(8),
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondaryCard,
      gap: SPACING.xs / 2,
    },
    calendar_day_selected: {
      borderColor: colors.PrimaryGreen,
      backgroundColor: colors.GlowGreen,
    },
    calendar_day_number: {
      fontSize: scaleFont(15, 0.35),
      color: colors.primaryText,
      fontFamily: "BarlowCondensed-Bold",
    },
    calendar_day_label: {
      fontSize: scaleFont(10, 0.3),
      color: colors.secondaryText,
    },
    calendar_day_text_active: {
      color: colors.PrimaryGreen,
    },
    calendar_pickerButton: {
      width: scale(44),
      paddingVertical: verticalScale(12),
      alignItems: "center",
      justifyContent: "center",
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondaryCard,
    },
  });
