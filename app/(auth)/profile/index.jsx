import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import ConfirmModal from "../../../components/popup/ConfirmModal";
import ProfileAvatarSection from "../../../components/profile/ProfileAvatarSection";
import { dbg, useDebugMount } from "../../../assets/utils/debugLogger";
import BottomSpacer from "../../../components/BottomSpacer";

import { useThemedStyles } from "../../../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../../../Theme/StyleConstants";
import {
  scale,
  verticalScale,
  moderateScale,
  scaleFont,
} from "../../../Theme/ScalableStyles";

const StatItem = ({ label, value, styles }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const Profile = () => {
  dbg("ProfileScreen");
  useDebugMount("ProfileScreen");
  const router = useRouter();
  const { styles, colors } = useThemedStyles(createStyles);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const {
    user,
    userStats,
    deleteAccount,
    updateProfile,
    refetchUser,
    loading: authLoading,
  } = useAuth();

  const stats = userStats || {
    gamesPlayed: 0,
    eventsOrganized: 0,
    totalLikes: 0,
    points: 0,
  };

  const handleEditProfile = () => {
    router.push("/(auth)/profile/profile-edit");
  };

  const handleChangePassword = () => {
    router.push("/(auth)/profile/profile-password");
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteLoading) {
      return;
    }

    setDeleteLoading(true);
    try {
      const result = await deleteAccount();

      if (!result.success) {
        Alert.alert("Błąd usuwania konta", result.error || "Spróbuj ponownie");
      }
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (authLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.PrimaryGreen} />
        <Text style={styles.loadingText}>Ładowanie profilu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name="person-circle"
          size={moderateScale(26, 0.35)}
          color={colors.PrimaryGreen}
        />
        <Text style={styles.headerText}>Profil Gracza</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <ProfileAvatarSection
          user={user}
          updateProfile={updateProfile}
          refetchUser={refetchUser}
        />

        {/* Username */}
        <Text style={styles.username}>{user.nickName || "Gracz"}</Text>

        {/* Informacje */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Imię:</Text>
            <Text style={styles.infoValue}>{user.name || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nazwisko:</Text>
            <Text style={styles.infoValue}>{user.surname || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Typ:</Text>
            <Text style={styles.infoValue}>{user.isActive || "-"}</Text>
          </View>
        </View>

        {/* Statystyki */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statystyki</Text>
          <View style={styles.statsGrid}>
            <StatItem
              label="Rozegrane gry"
              value={stats.gamesPlayed}
              styles={styles}
            />
            <StatItem
              label="Utworzone gry"
              value={stats.eventsOrganized}
              styles={styles}
            />
            <StatItem
              label="Polubienia"
              value={stats.totalLikes}
              styles={styles}
            />
            <StatItem label="Punkty" value={stats.points} styles={styles} />
          </View>
        </View>

        {/* Przyciski */}
        <View style={styles.buttonsSection}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleEditProfile}
            activeOpacity={0.8}
          >
            <Ionicons
              name="create-outline"
              size={moderateScale(20, 0.35)}
              color={colors.primaryText}
            />
            <Text style={styles.buttonText}>Edytuj profil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleChangePassword}
            activeOpacity={0.8}
          >
            <Ionicons
              name="key-outline"
              size={moderateScale(20, 0.35)}
              color={colors.primaryText}
            />
            <Text style={styles.buttonText}>Zmień hasło</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
          >
            <Ionicons
              name="trash-outline"
              size={moderateScale(20, 0.35)}
              color={colors.Danger}
            />
            <Text style={[styles.buttonText, styles.dangerButtonText]}>
              Usuń konto
            </Text>
          </TouchableOpacity>
        </View>
        <BottomSpacer />
      </ScrollView>

      <ConfirmModal
        visible={showDeleteModal}
        onClose={() => {
          if (!deleteLoading) {
            setShowDeleteModal(false);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Czy na pewno chcesz usunąć swoje konto? Ta akcja jest nieodwracalna."
        actionText="USUŃ KONTO"
        actionType="danger"
        confirmButtonText="USUŃ"
        cancelButtonText="ANULUJ"
        loading={deleteLoading}
      />
    </View>
  );
};

export default Profile;

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: verticalScale(12),
      fontSize: scaleFont(16, 0.35),
      fontFamily: "Inter-Regular",
      color: colors.primaryText,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: verticalScale(20),
      backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
    headerText: {
      fontSize: scaleFont(24, 0.45),
      fontFamily: "BarlowCondensed-ExtraBold",
      color: colors.primaryText,
      marginLeft: SPACING.md,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: SPACING.lg,
      paddingBottom: verticalScale(40),
      alignItems: "center",
    },
    username: {
      fontSize: scaleFont(28, 0.45),
      fontFamily: "BarlowCondensed-Bold",
      color: colors.primaryText,
      marginBottom: verticalScale(24),
    },
    infoSection: {
      width: "100%",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      marginBottom: verticalScale(24),
    },
    infoRow: {
      flexDirection: "row",
      paddingVertical: verticalScale(8),
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    infoLabel: {
      fontSize: scaleFont(16, 0.35),
      fontFamily: "Inter-Regular",
      color: colors.thirdText,
      width: scale(100),
    },
    infoValue: {
      flex: 1,
      fontSize: scaleFont(16, 0.35),
      fontFamily: "Inter-Regular",
      color: colors.primaryText,
    },
    statsSection: {
      width: "100%",
      marginBottom: verticalScale(24),
    },
    sectionTitle: {
      fontSize: scaleFont(18, 0.4),
      fontFamily: "BarlowCondensed-Bold",
      color: colors.PrimaryGreen,
      textAlign: "center",
      marginBottom: verticalScale(16),
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    statItem: {
      width: "48%",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      alignItems: "center",
      marginBottom: verticalScale(12),
    },
    statValue: {
      fontSize: scaleFont(24, 0.45),
      fontFamily: "BarlowCondensed-Bold",
      color: colors.PrimaryGreen,
    },
    statLabel: {
      fontSize: scaleFont(12, 0.3),
      fontFamily: "Inter-Regular",
      color: colors.primaryText,
      marginTop: verticalScale(4),
      textAlign: "center",
    },
    buttonsSection: {
      width: "100%",
      gap: verticalScale(12),
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.PrimaryGreen,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: verticalScale(14),
      paddingHorizontal: SPACING.lg,
    },
    buttonText: {
      fontSize: scaleFont(16, 0.35),
      fontFamily: "BarlowCondensed-Bold",
      color: colors.primaryText,
      marginLeft: SPACING.sm,
    },
    dangerButton: {
      borderColor: colors.Danger,
    },
    dangerButtonText: {
      color: colors.Danger,
    },
  });
