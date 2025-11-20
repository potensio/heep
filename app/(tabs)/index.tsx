import { Image } from "expo-image";
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Logo */}
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            contentFit="cover"
          />

          {/* Welcome Content */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome to Swiss-belhotel</Text>
            <Text style={styles.welcomeDescription}>
              Choose whether you want to book a stay or access your member
              loyalty benefits.
            </Text>
          </View>

          {/* Cards */}
          <View style={styles.cardsContainer}>
            {/* Hotel Booking Card */}
            <View style={styles.card}>
              <ImageBackground
                source={require("@/assets/images/hotel-booking-bg.png")}
                style={styles.cardImage}
                imageStyle={styles.cardImageStyle}
                resizeMode="cover"
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Hotel Booking</Text>
                <Text style={styles.cardDescription}>
                  Browse rooms, explore facilities, and book your stay.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.button}
                onPress={() => router.push("/booking-webview")}
              >
                <Text style={styles.buttonText}>Booking Now</Text>
              </TouchableOpacity>
            </View>

            {/* Member Loyalty Card */}
            <View style={styles.card}>
              <ImageBackground
                source={require("@/assets/images/member-loyalty-bg.png")}
                style={styles.cardImage}
                imageStyle={styles.cardImageStyle}
                resizeMode="cover"
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Member Loyalty</Text>
                <Text style={styles.cardDescription}>
                  View your points, rewards, and exclusive member benefits.
                </Text>
              </View>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Check Reward</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Image
              source={require("@/assets/images/footer-logo.png")}
              style={styles.footerLogo}
              contentFit="cover"
            />
            <Text style={styles.footerText}>Powerd by Swiss-belhotel</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 71,
  },
  logo: {
    width: 56,
    height: 56,
  },
  welcomeSection: {
    marginTop: 79,
    gap: 8,
  },
  welcomeTitle: {
    color: "#1F1F1F",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 21.78,
  },
  welcomeDescription: {
    color: "#8A8A8A",
    fontSize: 14,
    lineHeight: 19,
  },
  cardsContainer: {
    flexDirection: "row",
    gap: 16,
    marginTop: 62,
  },
  card: {
    flex: 1,
    gap: 9,
  },
  cardImage: {
    width: "100%",
    height: 121,
  },
  cardImageStyle: {
    borderRadius: 8,
  },
  cardContent: {
    gap: 8,
  },
  cardTitle: {
    color: "#1F1F1F",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 16.94,
  },
  cardDescription: {
    color: "#8A8A8A",
    fontSize: 12,
    lineHeight: 14.52,
  },
  button: {
    backgroundColor: "#F04E30",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  footer: {
    alignItems: "center",
    marginTop: 60,
    paddingBottom: 32,
    gap: 8,
  },
  footerLogo: {
    width: 50,
    height: 38.56,
  },
  footerText: {
    color: "#1F1F1F",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
  },
});
