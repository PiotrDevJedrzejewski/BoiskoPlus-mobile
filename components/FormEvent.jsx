import { useState, useEffect, useRef, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Slider } from "@miblanchard/react-native-slider";
import customFetch from "../assets/utils/customFetch";
import { Toast } from "toastify-react-native";
import { useRouter } from "expo-router";

import { gameTypeIcons } from "../assets/utils/gameTypeIcons";
import CustomTypePickerModal from "./popup/CustomTypePickerModal";
import DatePicker from "./popup/DatePicker";
import HourPicker from "./popup/HourPicker";

import { useThemedStyles } from "../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../Theme/StyleConstants";
import {
  scale,
  verticalScale,
  moderateScale,
  scaleFont,
} from "../Theme/ScalableStyles";
import BottomSpacer from "./BottomSpacer";
import GameTypeButton from "./GameTypeButton";
import {
  MAX_SEARCHED_PLAYERS,
  getMaxSearchedPlayers,
  getEventSquad,
} from "../assets/utils/eventDisplay";

const GAME_TYPES = [
  { label: "Piłka nożna", value: "football" },
  { label: "Koszykówka", value: "basketball" },
  { label: "Siatkówka", value: "volleyball" },
  { label: "Tenis", value: "tennis" },
  { label: "Tenis stołowy", value: "table tennis" },
  { label: "Badminton", value: "badminton" },
  { label: "Karty", value: "cards" },
  // add more below
  { label: "Rugby", value: "rugby" },
  { label: "Hokej", value: "hockey" },
  { label: "Piłka ręczna", value: "handball" },
  { label: "Kręgle", value: "bowling" },
  { label: "Planszówki", value: "board games" },
  { label: "Inne", value: "other" },
];

const FIELD_TYPES = [
  { label: "Orlik", value: "field" },
  { label: "Hala", value: "hall" },
  { label: "Inne", value: "other" },
];

const LEVELS = [
  { label: "Początkujący", value: "beginner" },
  { label: "Średniozaawansowany", value: "intermediate" },
  { label: "Zaawansowany", value: "advanced" },
  { label: "Profesjonalny", value: "professional" },
  { label: "Inny", value: "other" },
];

const defaultEventData = {
  eventName: "",
  gameType: "football",
  startDate: new Date().toISOString().split("T")[0],
  startHour: new Date().toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  }),
  durationMinutes: "90",
  location: {
    city: "",
    street: "",
    addressNumber: "",
    postalCode: "",
  },
  venueType: "field",
  searchedPlayers: "",
  level: "beginner",
  price: "",
  paymentMethod: "Na miejscu",
  eventDescription: "",
  phoneNumber: "",
  ageMin: 0,
  ageMax: 100,
  organizerPlays: false,
  isPrivate: false,
  isRecurring: false,
  format: "11v11",
};

const padTwoDigits = (value) => String(value).padStart(2, "0");

// startDate/startHour are internal state of the date and hour pickers.
// They are read with local getters (not toISOString) to avoid a timezone shift.
const buildEventDataFromEvent = (event) => {
  const startDateTime = new Date(event.startDateTime);
  const startDate = `${startDateTime.getFullYear()}-${padTwoDigits(startDateTime.getMonth() + 1)}-${padTwoDigits(startDateTime.getDate())}`;
  const startHour = `${padTwoDigits(startDateTime.getHours())}:${padTwoDigits(startDateTime.getMinutes())}`;

  return {
    eventName: event.eventName ?? "",
    gameType: event.gameType,
    startDate,
    startHour,
    durationMinutes: String(event.durationMinutes ?? ""),
    location: {
      city: event.location?.city ?? "",
      street: event.location?.street ?? "",
      addressNumber: event.location?.addressNumber ?? "",
      postalCode: event.location?.postalCode ?? "",
    },
    venueType: event.venueType,
    format: event.format,
    searchedPlayers: String(event.searchedPlayers ?? ""),
    organizerPlays: Boolean(event.organizerPlays),
    level: event.level,
    price: String(event.price ?? ""),
    paymentMethod: event.paymentMethod ?? "",
    eventDescription: event.eventDescription ?? "",
    phoneNumber: event.phoneNumber ?? "",
    ageMin: event.ageMin ?? 0,
    ageMax: event.ageMax ?? 100,
    isPrivate: Boolean(event.isPrivate),
    isRecurring: Boolean(event.isRecurring),
  };
};

// Cuts the value down to the limit allowed for the given format and organizer participation.
const limitSearchedPlayers = (searchedPlayers, format, organizerPlays) => {
  const maxSearchedPlayers = getMaxSearchedPlayers(format, organizerPlays);
  if (parseInt(searchedPlayers, 10) > maxSearchedPlayers) {
    return String(maxSearchedPlayers);
  }
  return searchedPlayers;
};

// Funkcja parsująca dane z predefined place (orlika)
const parsePredefinedPlace = (predefinedPlace) => {
  if (!predefinedPlace) return null;

  const city = predefinedPlace.properties?.miasto || "";
  const address = predefinedPlace.properties?.adres || "";
  const geolocation_source =
    predefinedPlace.properties?.geolocation_source || "";

  // Wyciągnij kod pocztowy z geolocation_source (przedostatnie pole)
  const geoParts = geolocation_source.split(",").map((s) => s.trim());
  const postalCode = geoParts[geoParts.length - 2] || "";

  // Parsuj adres z pola "adres"
  let street = "";
  let addressNumber = "";

  if (address) {
    // Usuń prefix typu "ul.", "al.", "os." itp.
    const addressWithoutPrefix = address.replace(/^(ul\.|al\.|os\.)\s*/i, "");

    // Podziel na części
    const parts = addressWithoutPrefix.split(/\s+/);

    // Ostatnia część może zawierać numer (może być z literą typu "112A" lub "22/26")
    const lastPart = parts[parts.length - 1];

    // Sprawdź czy ostatnia część zawiera cyfrę
    if (/\d/.test(lastPart)) {
      addressNumber = lastPart;
      street = parts.slice(0, -1).join(" ");
    } else {
      street = addressWithoutPrefix;
    }
  }

  return {
    city: city || "",
    street: street || "",
    addressNumber: addressNumber || "",
    postalCode: postalCode || "",
  };
};

const FormEvent = ({
  mode = "add",
  initialData = null,
  predefinedPlace = null,
  eventId = null,
}) => {
  const { styles, colors } = useThemedStyles(createStyles);

  const [eventData, setEventData] = useState(
    initialData ? buildEventDataFromEvent(initialData) : defaultEventData,
  );
  const [loading, setLoading] = useState(false);
  const [pickerModal, setPickerModal] = useState(null);
  const router = useRouter();

  const postalPart2Ref = useRef(null);
  const [postalPart1, setPostalPart1] = useState(() => {
    const code = initialData?.location?.postalCode || "";
    return code.split("-")[0] || "";
  });
  const [postalPart2, setPostalPart2] = useState(() => {
    const code = initialData?.location?.postalCode || "";
    return code.split("-")[1] || "";
  });

  // Wypełnij formularz danymi z predefined place (orlika)
  useEffect(() => {
    if (predefinedPlace && mode === "add") {
      const parsedAddress = parsePredefinedPlace(predefinedPlace);

      if (parsedAddress) {
        setEventData((prev) => ({
          ...prev,
          location: {
            city: parsedAddress.city,
            street: parsedAddress.street,
            addressNumber: parsedAddress.addressNumber,
            postalCode: parsedAddress.postalCode,
          },
        }));
        const code = parsedAddress.postalCode || "";
        const parts = code.includes("-")
          ? code.split("-")
          : [code.slice(0, 2), code.slice(2)];
        setPostalPart1(parts[0] || "");
        setPostalPart2(parts[1] || "");
      }
    }
  }, [predefinedPlace, mode]);

  const adjustPlayerCount = (delta) => {
    const current = parseInt(eventData.searchedPlayers, 10) || 0;
    const maxSearchedPlayers = getMaxSearchedPlayers(
      eventData.format,
      eventData.organizerPlays,
    );
    const next = Math.min(maxSearchedPlayers, Math.max(1, current + delta));
    handleChange("searchedPlayers", String(next));
  };

  const handleFormatChange = (format) => {
    setEventData((prev) => ({
      ...prev,
      format,
      searchedPlayers: limitSearchedPlayers(
        prev.searchedPlayers,
        format,
        prev.organizerPlays,
      ),
    }));
  };

  const handleOrganizerPlaysChange = (organizerPlays) => {
    setEventData((prev) => ({
      ...prev,
      organizerPlays,
      searchedPlayers: limitSearchedPlayers(
        prev.searchedPlayers,
        prev.format,
        organizerPlays,
      ),
    }));
  };

  const handleAgeRangeChange = ([ageMin, ageMax]) => {
    setEventData((prev) => ({ ...prev, ageMin, ageMax }));
  };

  const handleChange = (name, value) => {
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setEventData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setEventData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = () => {
    if (!eventData.eventName.trim()) {
      Alert.alert("Błąd", "Podaj nazwę wydarzenia");
      return false;
    }
    if (!eventData.gameType) {
      Alert.alert("Błąd", "Wybierz typ gry");
      return false;
    }
    if (!eventData.location.city.trim()) {
      Alert.alert("Błąd", "Podaj miasto");
      return false;
    }
    if (!eventData.location.street.trim()) {
      Alert.alert("Błąd", "Podaj ulicę");
      return false;
    }
    if (!/^\d{2}-\d{3}$/.test(`${postalPart1}-${postalPart2}`)) {
      Alert.alert("Błąd", "Kod pocztowy musi być w formacie XX-XXX");
      return false;
    }

    const durationMinutes = parseInt(eventData.durationMinutes, 10);
    if (Number.isNaN(durationMinutes) || durationMinutes < 1) {
      Alert.alert("Błąd", "Czas trwania musi być liczbą większą od 0");
      return false;
    }

    const searchedPlayers = parseInt(eventData.searchedPlayers, 10);
    if (
      Number.isNaN(searchedPlayers) ||
      searchedPlayers < 1 ||
      searchedPlayers > MAX_SEARCHED_PLAYERS
    ) {
      Alert.alert(
        "Błąd",
        `Liczba szukanych graczy musi być w zakresie 1–${MAX_SEARCHED_PLAYERS}`,
      );
      return false;
    }
    const maxSearchedPlayers = getMaxSearchedPlayers(
      eventData.format,
      eventData.organizerPlays,
    );
    if (searchedPlayers > maxSearchedPlayers) {
      Alert.alert(
        "Błąd",
        `Przy formacie ${eventData.format} możesz szukać maksymalnie ${maxSearchedPlayers} graczy`,
      );
      return false;
    }
    const acceptedPlayers = initialData?.acceptedPlayers ?? 0;
    if (mode === "edit" && searchedPlayers < acceptedPlayers) {
      Alert.alert(
        "Błąd",
        `Nie możesz szukać mniej graczy, niż już zaakceptowałeś (${acceptedPlayers})`,
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const startDateTime = new Date(
        `${eventData.startDate}T${eventData.startHour}`,
      );

      const postalCode = `${postalPart1}-${postalPart2}`;
      const dataToSend = {
        eventName: eventData.eventName,
        eventDescription: eventData.eventDescription,
        gameType: eventData.gameType,
        level: eventData.level,
        venueType: eventData.venueType,
        startDateTime: startDateTime.toISOString(),
        durationMinutes: parseInt(eventData.durationMinutes),
        location: {
          city: eventData.location.city,
          street: eventData.location.street,
          addressNumber: eventData.location.addressNumber,
          postalCode,
        },
        format: eventData.format,
        searchedPlayers: parseInt(eventData.searchedPlayers, 10),
        organizerPlays: eventData.organizerPlays,
        price: parseInt(eventData.price) || 0,
        paymentMethod: eventData.paymentMethod,
        phoneNumber: eventData.phoneNumber,
        ageMin: eventData.ageMin,
        ageMax: eventData.ageMax,
        isPrivate: eventData.isPrivate,
        isRecurring: eventData.isRecurring,
      };

      if (dataToSend.price === 0) {
        dataToSend.paymentMethod = "";
      }

      if (mode === "add") {
        await customFetch.post("/football-events", dataToSend);
        Toast.success("Wydarzenie zostało dodane pomyślnie!", "top");
        setEventData(defaultEventData);
        setPostalPart1("");
        setPostalPart2("");
        // Nawigacja powrót po dodaniu
        setTimeout(() => {
          router.replace("/(auth)/events-managment/events-dashboard");
        }, 1000);
      } else if (mode === "edit" && eventId) {
        await customFetch.patch(`/football-events/${eventId}`, dataToSend);
        Toast.success("Wydarzenie zostało zaktualizowane!", "top");
        // Nawigacja powrót po edycji
        setTimeout(() => {
          router.back();
        }, 1000);
      }
    } catch (error) {
      console.error("Błąd podczas zapisywania wydarzenia:", error);
      if (error.response?.data?.msg) {
        const messages = error.response.data.msg.split(",");
        messages.forEach((msg) => {
          Toast.error(msg.trim(), "top");
        });
      } else {
        Toast.error("Błąd podczas zapisywania wydarzenia!", "top");
      }
    } finally {
      setLoading(false);
    }
  };

  const getOptionLabel = (options, value) =>
    options.find((o) => o.value === value)?.label || "Wybierz...";

  const getPlayersPreview = () => {
    const squad = getEventSquad({
      format: eventData.format,
      searchedPlayers: parseInt(eventData.searchedPlayers, 10) || 0,
      organizerPlays: eventData.organizerPlays,
      acceptedPlayers: initialData?.acceptedPlayers ?? 0,
    });
    return `${squad.current}/${squad.max}`;
  };

  // DatePicker lists years only up to maximumDate, so events can be planned until the end of next year.
  const maxEventDate = new Date(new Date().getFullYear() + 1, 11, 31);

  const ageRange = useMemo(
    () => [eventData.ageMin, eventData.ageMax],
    [eventData.ageMin, eventData.ageMax],
  );

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Typ gry */}
        <Text style={styles.label}>Typ rozgrywki</Text>
        <View style={styles.gameTypeRow}>
          {GAME_TYPES.slice(0, 7).map((type) => (
            <GameTypeButton
              key={type.value}
              value={type.value}
              title={type.label}
              isSelected={eventData.gameType === type.value}
              pressHandler={() => handleChange("gameType", type.value)}
            />
          ))}
          <Pressable
            style={styles.btn}
            onPress={() =>
              Toast.info(
                "Wkrótce dodamy możliwość wyboru innych typów gier!",
                "top",
              )
            }
          >
            {/* () => handleChange('gameType', 'other')*/}
            <Ionicons
              name="add-circle"
              size={40}
              color={
                eventData.gameType === "other"
                  ? colors.PrimaryGreen
                  : colors.primaryText
              }
            />
            <Text
              style={{
                color:
                  eventData.gameType === "other"
                    ? colors.PrimaryGreen
                    : colors.primaryText,
              }}
            >
              Inne
            </Text>
          </Pressable>
        </View>
        {/* Nazwa wydarzenia */}
        <Text style={styles.label}>Nazwa wydarzenia</Text>
        <TextInput
          style={styles.input}
          value={eventData.eventName}
          onChangeText={(value) => handleChange("eventName", value)}
          placeholder="Np. Mecz towarzyski na orliku"
          placeholderTextColor={colors.thirdText}
        />

        {/* Data i godzina */}
        <Text style={styles.label}>Data</Text>
        <DatePicker
          value={eventData.startDate}
          onChange={(value) => handleChange("startDate", value)}
          maximumDate={maxEventDate}
        />
        <Text style={styles.label}>Godzina</Text>
        <HourPicker
          value={eventData.startHour}
          onChange={(value) => handleChange("startHour", value)}
        />

        {/* Czas trwania */}
        <Text style={styles.label}>Czas trwania (minuty)</Text>
        <TextInput
          style={styles.input}
          value={eventData.durationMinutes}
          onChangeText={(value) => handleChange("durationMinutes", value)}
          keyboardType="numeric"
          placeholder="90"
          placeholderTextColor={colors.thirdText}
        />

        {/* Adres - Miasto */}
        <Text style={styles.label}>Miasto</Text>
        <TextInput
          style={styles.input}
          value={eventData.location.city}
          onChangeText={(value) => {
            if (!/\d/.test(value)) {
              handleChange("location.city", value);
            }
          }}
          placeholder="Np. Łódź"
          placeholderTextColor={colors.thirdText}
        />

        {/* Adres - Ulica i numer */}
        <Text style={styles.label}>Nie pamiętasz adresu?</Text>
        <Pressable
          style={styles.mapJump}
          onPress={() => router.push("/(auth)/show-map")}
        >
          <Text style={styles.mapJumpText}>Wybierz obiekt na mapie</Text>
          <Ionicons name="map" size={18} color={colors.PrimaryGreen} />
        </Pressable>

        {/* Adres - Ulica i numer */}
        <View style={styles.row}>
          <View style={styles.streetColumn}>
            <Text style={styles.label}>Ulica</Text>
            <TextInput
              style={styles.input}
              value={eventData.location.street}
              onChangeText={(value) => {
                if (!/\d/.test(value)) {
                  handleChange("location.street", value);
                }
              }}
              placeholder="Np. Sportowa"
              placeholderTextColor={colors.thirdText}
            />
          </View>
          <View style={styles.numberColumn}>
            <Text style={styles.label}>Numer</Text>
            <TextInput
              style={styles.input}
              value={eventData.location.addressNumber}
              onChangeText={(value) => {
                if (/^\d*$/.test(value)) {
                  handleChange("location.addressNumber", value);
                }
              }}
              keyboardType="numeric"
              placeholder="15"
              placeholderTextColor={colors.thirdText}
            />
          </View>
        </View>

        {/* Kod pocztowy */}
        <Text style={styles.label}>Kod pocztowy</Text>
        <View style={styles.postalCodeWrapper}>
          <TextInput
            style={[styles.input, styles.postalPart1Input]}
            value={postalPart1}
            onChangeText={(value) => {
              const digits = value.replace(/\D/g, "").slice(0, 2);
              setPostalPart1(digits);
              if (digits.length === 2) postalPart2Ref.current?.focus();
            }}
            keyboardType="numeric"
            placeholder="XX"
            placeholderTextColor={colors.thirdText}
            maxLength={2}
          />
          <Text style={styles.postalSeparator}>-</Text>
          <TextInput
            ref={postalPart2Ref}
            style={[styles.input, styles.postalPart2Input]}
            value={postalPart2}
            onChangeText={(value) => {
              const digits = value.replace(/\D/g, "").slice(0, 3);
              setPostalPart2(digits);
            }}
            keyboardType="numeric"
            placeholder="XXX"
            placeholderTextColor={colors.thirdText}
            maxLength={3}
          />
        </View>

        {/* Typ boiska */}
        <Text style={styles.label}>Typ boiska</Text>
        <Pressable
          style={styles.pickerWrapper}
          onPress={() =>
            setPickerModal({
              field: "venueType",
              options: FIELD_TYPES,
              title: "Wybierz typ boiska",
            })
          }
        >
          <Text style={styles.pickerButtonText} numberOfLines={1}>
            {getOptionLabel(FIELD_TYPES, eventData.venueType)}
          </Text>
          <Ionicons
            name="chevron-down"
            size={scaleFont(18, 0.35)}
            color={colors.thirdText}
          />
        </Pressable>

        {/* Format */}
        <Text style={styles.label}>Format gry</Text>
        <Pressable
          style={styles.pickerWrapper}
          onPress={() =>
            setPickerModal({
              field: "format",
              options: [
                ...Array.from({ length: 20 }, (_, i) => ({
                  label: `${i + 1}v${i + 1}`,
                  value: `${i + 1}v${i + 1}`,
                })),
                { label: "Inny", value: "other" },
              ],
              title: "Wybierz format gry",
            })
          }
        >
          <Text style={styles.pickerButtonText} numberOfLines={1}>
            {eventData.format || "11v11"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={scaleFont(18, 0.35)}
            color={colors.thirdText}
          />
        </Pressable>

        {/* Liczba graczy */}
        <Text style={styles.label}>Ilu graczy szukasz</Text>
        <View style={styles.playerCountWrapper}>
          <Pressable
            style={styles.playerCountButton}
            onPress={() => adjustPlayerCount(-1)}
          >
            <Ionicons
              name="remove"
              size={scaleFont(24, 0.35)}
              color={colors.PrimaryGreen}
              style={styles.playerBtnText}
            />
          </Pressable>
          <TextInput
            value={eventData.searchedPlayers}
            onChangeText={(value) => {
              const digits = value.replace(/\D/g, "");
              if (digits === "" || parseInt(digits) <= MAX_SEARCHED_PLAYERS) {
                handleChange("searchedPlayers", digits);
              }
            }}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.thirdText}
            style={styles.playerCountInput}
          />
          <Pressable
            style={styles.playerCountButton}
            onPress={() => adjustPlayerCount(1)}
          >
            <Ionicons
              name="add"
              size={scaleFont(24, 0.35)}
              color={colors.PrimaryGreen}
              style={styles.playerBtnText}
            />
          </Pressable>
        </View>

        {/* Podgląd */}
        <Text style={styles.label}>Podgląd</Text>
        <View style={styles.pickerWrapper}>
          <Ionicons
            name="people"
            size={scaleFont(18, 0.35)}
            color={colors.PrimaryGreen}
            style={styles.previewIcon}
          />
          <Text style={styles.pickerButtonText} numberOfLines={1}>
            {getPlayersPreview()}
          </Text>
        </View>

        {/* Poziom */}
        <Text style={styles.label}>Poziom</Text>
        <Pressable
          style={styles.pickerWrapper}
          onPress={() =>
            setPickerModal({
              field: "level",
              options: LEVELS,
              title: "Wybierz poziom gry",
            })
          }
        >
          <Text style={styles.pickerButtonText} numberOfLines={1}>
            {getOptionLabel(LEVELS, eventData.level)}
          </Text>
          <Ionicons
            name="chevron-down"
            size={scaleFont(18, 0.35)}
            color={colors.thirdText}
          />
        </Pressable>

        {/* Cena i płatność */}
        <View style={styles.row}>
          <View style={styles.halfColumn}>
            <Text style={styles.label}>Cena (zł)</Text>
            <TextInput
              style={styles.input}
              value={eventData.price}
              onChangeText={(value) => {
                const digits = value.replace(/\D/g, "");
                if (digits === "" || parseInt(digits) <= 999) {
                  handleChange("price", digits);
                }
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.thirdText}
            />
          </View>
          <View style={styles.halfColumn}>
            <Text style={styles.label}>Płatność</Text>
            <TextInput
              style={styles.input}
              value={eventData.paymentMethod}
              onChangeText={(value) => handleChange("paymentMethod", value)}
              placeholder="Na miejscu"
              placeholderTextColor={colors.thirdText}
            />
          </View>
        </View>

        {/* Wiek */}
        <Text style={styles.label}>Wiek</Text>
        <View style={styles.ageRangeContainer}>
          <Text style={styles.ageRangeLabel}>
            {eventData.ageMin} – {eventData.ageMax} lat
          </Text>
          <Slider
            value={ageRange}
            onValueChange={handleAgeRangeChange}
            minimumValue={0}
            maximumValue={100}
            step={1}
            minimumTrackTintColor={colors.PrimaryGreen}
            maximumTrackTintColor={colors.thirdText}
            thumbTintColor={colors.PrimaryGreen}
            trackStyle={styles.sliderTrack}
            thumbStyle={styles.sliderThumb}
          />
          <View style={styles.ageRangeLabels}>
            <Text style={styles.ageRangeMinMax}>0</Text>
            <Text style={styles.ageRangeMinMax}>100</Text>
          </View>
        </View>

        {/* Opis */}
        <Text style={styles.label}>Opis wydarzenia</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={eventData.eventDescription}
          onChangeText={(value) => handleChange("eventDescription", value)}
          placeholder="Opisz swoje wydarzenie..."
          placeholderTextColor={colors.thirdText}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Telefon */}
        <Text style={styles.label}>Nr telefonu (opcjonalnie)</Text>
        <TextInput
          style={styles.input}
          value={eventData.phoneNumber}
          onChangeText={(value) => handleChange("phoneNumber", value)}
          keyboardType="phone-pad"
          placeholder="123 456 789"
          placeholderTextColor={colors.thirdText}
        />

        {/* Checkboxy */}
        <View style={styles.checkboxContainer}>
          <View style={styles.checkboxRow}>
            <Switch
              value={eventData.organizerPlays}
              onValueChange={handleOrganizerPlaysChange}
              trackColor={{ false: colors.thirdText, true: colors.DarkGreen }}
              thumbColor={
                eventData.organizerPlays
                  ? colors.PrimaryGreen
                  : colors.thirdText
              }
            />
            <Text style={styles.checkboxLabel}>
              Biorę udział w tym wydarzeniu
            </Text>
          </View>

          <View style={styles.checkboxRow}>
            <Switch
              value={eventData.isRecurring}
              onValueChange={(value) => handleChange("isRecurring", value)}
              trackColor={{ false: colors.thirdText, true: colors.DarkGreen }}
              thumbColor={
                eventData.isRecurring ? colors.PrimaryGreen : colors.thirdText
              }
            />
            <Text style={styles.checkboxLabel}>Wydarzenie cykliczne</Text>
          </View>

          <View style={styles.checkboxRow}>
            <Switch
              value={eventData.isPrivate}
              onValueChange={(value) => handleChange("isPrivate", value)}
              trackColor={{ false: colors.thirdText, true: colors.DarkGreen }}
              thumbColor={
                eventData.isPrivate ? colors.PrimaryGreen : colors.thirdText
              }
            />
            <Text style={styles.checkboxLabel}>Wydarzenie prywatne</Text>
          </View>
          {eventData.isPrivate && (
            <View style={styles.privateWarning}>
              <Text style={styles.privateWarningText}>
                ⚠️ Wydarzenie prywatne nie będzie widoczne na liście wyszukiwań
                ani na mapie. Tylko zaproszone osoby będą mogły je zobaczyć.
              </Text>
            </View>
          )}
        </View>

        {/* Przycisk submit */}
        <Pressable
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {loading
              ? "Zapisywanie..."
              : mode === "add"
                ? "Dodaj wydarzenie"
                : "Zapisz zmiany"}
          </Text>
        </Pressable>
        <BottomSpacer />
      </ScrollView>
      <CustomTypePickerModal
        visible={pickerModal !== null}
        selectedValue={pickerModal ? eventData[pickerModal.field] : ""}
        options={pickerModal?.options || []}
        title={pickerModal?.title || ""}
        iconMap={pickerModal?.iconMap}
        onSelect={(value) => {
          if (!pickerModal) return;
          if (pickerModal.field === "format") {
            handleFormatChange(value);
          } else {
            handleChange(pickerModal.field, value);
          }
        }}
        onClose={() => setPickerModal(null)}
      />
    </>
  );
};
const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: SPACING.md,
      paddingBottom: SPACING.xl,
    },
    label: {
      fontSize: scaleFont(16, 0.35),
      fontFamily: "BarlowCondensed-Bold",
      color: colors.primaryText,
      marginTop: SPACING.md,
      marginBottom: SPACING.xs,
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.md,
      minHeight: verticalScale(40),
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      fontSize: scaleFont(16, 0.35),
      fontFamily: "Inter-Regular",
      color: colors.primaryText,
    },
    postalCodeWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    postalPart1Input: {
      width: scale(50),
      textAlign: "center",
    },
    postalSeparator: {
      fontSize: scaleFont(20, 0.4),
      color: colors.primaryText,
      fontFamily: "BarlowCondensed-Bold",
    },
    postalPart2Input: {
      width: scale(80),
      textAlign: "center",
    },
    textArea: {
      minHeight: verticalScale(100),
      paddingTop: SPACING.sm,
    },
    pickerWrapper: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.GlowGreen,
      borderRadius: BORDER_RADIUS.md,
      minHeight: verticalScale(40),
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
    },
    pickerButtonText: {
      flex: 1,
      fontSize: scaleFont(16, 0.35),
      fontFamily: "Inter-Regular",
      color: colors.primaryText,
    },
    row: {
      flexDirection: "row",
      gap: SPACING.md,
    },
    halfColumn: {
      flex: 1,
    },
    streetColumn: {
      flex: 2,
    },
    numberColumn: {
      flex: 1,
    },
    checkboxContainer: {
      marginTop: SPACING.md,
    },
    checkboxRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.sm,
    },
    checkboxLabel: {
      fontSize: scaleFont(16, 0.35),
      fontFamily: "Inter-Regular",
      color: colors.primaryText,
      marginLeft: SPACING.sm,
    },
    submitButton: {
      backgroundColor: colors.PrimaryGreen,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.md,
      alignItems: "center",
      marginTop: SPACING.lg,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    ageRangeContainer: {
      marginBottom: SPACING.sm,
    },
    ageRangeLabel: {
      fontSize: scaleFont(15, 0.35),
      fontFamily: "Inter-Regular",
      color: colors.secondaryText,
      textAlign: "center",
      marginBottom: SPACING.xs,
    },
    sliderTrack: {
      height: verticalScale(4),
      borderRadius: 2,
    },
    sliderThumb: {
      width: scale(22),
      height: scale(22),
      borderRadius: BORDER_RADIUS.xxl,
      backgroundColor: colors.PrimaryGreen,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 3,
    },
    ageRangeLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: SPACING.xs,
    },
    ageRangeMinMax: {
      fontSize: scaleFont(12, 0.3),
      fontFamily: "Inter-Regular",
      color: colors.thirdText,
    },
    privateWarning: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.PrimaryYellow,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.sm,
      marginBottom: SPACING.md,
    },
    privateWarningText: {
      fontSize: scaleFont(13, 0.3),
      fontFamily: "Inter-Regular",
      color: colors.PrimaryYellow,
      lineHeight: scaleFont(20, 0.3),
    },
    submitButtonText: {
      fontSize: scaleFont(18, 0.4),
      fontFamily: "BarlowCondensed-Bold",
      color: colors.background,
    },

    gameTypeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.xs,
      marginBottom: SPACING.md,
      justifyContent: "center",
      alignItems: "flex-start",
      flexGrow: 1,
      alignItems: "stretch",
    },
    btn: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.neutralButton,
      backgroundColor: colors.primaryCard,
      alignItems: "center",
      justifyContent: "flex-start",
      width: "23%",
      borderWidth: 1,
      borderColor: colors.PrimaryYellow,
    },
    mapJump: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.PrimaryGreen,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      gap: SPACING.sm,
      marginVertical: SPACING.sm,
      marginHorizontal: SPACING.sm,
    },
    mapJumpText: {
      fontSize: scaleFont(16, 0.35),
      fontFamily: "Inter-Regular",
      color: colors.PrimaryGreen,
    },
    playerCountWrapper: {
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: SPACING.sm,
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
    },
    playerCountInput: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      fontSize: scaleFont(18, 0.35),
      fontFamily: "Inter-Regular",
      color: colors.primaryText,
      textAlign: "center",
      flex: 1,
    },
    playerCountButton: {
      backgroundColor: colors.divider,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    previewIcon: {
      marginRight: SPACING.sm,
    },
    playerBtnText: {
      fontFamily: "BarlowCondensed-Bold",
      color: colors.PrimaryGreen,
    },
  });

export default FormEvent;
