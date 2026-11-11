import { Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Toast } from "toastify-react-native";

import SingleEventSettings from "./single-event-settings";
import {
  buildEventLink,
  buildShareMessage,
  fetchInviteLink,
} from "../../assets/utils/eventLinks";

// Share options for an event. Reuses SingleEventSettings so it looks
// the same as the "…" menu.
// - organizer (isOwner): invitation link /invite/<token> from the server
// - other users: public event link /event/<id>?ref=<userId>
// Private events opened by non-organizers are blocked before this modal opens.
const ShareEventModal = ({ visible, onClose, event, isOwner, userId }) => {
  const getLink = async () => {
    if (isOwner) {
      return fetchInviteLink(event._id);
    }
    return buildEventLink(event._id, userId);
  };

  const showLinkError = (error) => {
    console.error("Błąd tworzenia linku do wydarzenia:", error);
    Toast.error(
      error?.response?.data?.msg || "Nie udało się utworzyć linku do wydarzenia",
    );
  };

  const handleCopyLink = async () => {
    try {
      const link = await getLink();
      await Clipboard.setStringAsync(link);
      Toast.success("Link skopiowany do schowka");
    } catch (error) {
      showLinkError(error);
    }
  };

  const handleShareInApp = () => {
    // Do zrobienia: sharing to Boisko+ chat (friends and group chats) — phase 4
    Toast.info("Udostępnianie w Boisko+ — już wkrótce!");
  };

  const handleShareVia = async () => {
    let link;
    try {
      link = await getLink();
    } catch (error) {
      showLinkError(error);
      return;
    }

    try {
      await Share.share({ message: buildShareMessage(event, link) });
    } catch (error) {
      console.error("Błąd systemowego udostępniania:", error);
    }
  };

  const options = [
    {
      key: "copyLink",
      label: "Kopiuj link",
      icon: "link-outline",
      onPress: handleCopyLink,
    },
    {
      key: "shareInApp",
      label: "Udostępnij w Boisko+",
      icon: "chatbubbles-outline",
      onPress: handleShareInApp,
    },
    {
      key: "shareVia",
      label: "Udostępnij za pomocą...",
      icon: "share-outline",
      onPress: handleShareVia,
    },
  ];

  return (
    <SingleEventSettings
      visible={visible}
      onClose={onClose}
      title={isOwner ? "Zaproś na wydarzenie" : "Udostępnij wydarzenie"}
      headerIcon="share-social-outline"
      options={options}
    />
  );
};

export default ShareEventModal;
