import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";

/** React Native container: the responsive client and server remain the single source of truth.
 * Native push, scheduled background notifications and biometrics are intentionally not claimed.
 */
export default function App() {
  const web = useRef<WebView>(null);
  const [failed, setFailed] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const raw = process.env.EXPO_PUBLIC_APP_URL;
  let url: URL | null = null;
  try {
    url = new URL(raw || "");
    if (
      url.username ||
      url.password ||
      (url.protocol !== "https:" &&
        !(
          process.env.EXPO_PUBLIC_ALLOW_HTTP === "true" &&
          url.protocol === "http:"
        ))
    )
      url = null;
  } catch {}
  React.useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack) {
        web.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);
  if (!url)
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.notice}>
          <Text style={styles.brand}>cuidali</Text>
          <Text style={styles.title}>Vamos conectar seu cuidado.</Text>
          <Text style={styles.text}>
            Configure EXPO_PUBLIC_APP_URL com o endereço HTTPS do servidor
            Cuidali e reinicie o Expo.
          </Text>
          <Text style={styles.text}>
            Este aplicativo compartilha os dados com a área do cuidador e o
            protótipo web do relógio.
          </Text>
        </View>
      </SafeAreaView>
    );
  if (failed)
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.notice}>
          <Text style={styles.brand}>cuidali</Text>
          <Text style={styles.title}>Não conseguimos conectar.</Text>
          <Text style={styles.text}>
            Confira sua conexão. Um pedido SOS feito sem conexão não está
            confirmado. Em uma emergência médica, ligue 192.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.button}
            onPress={() => setFailed(false)}
          >
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.secondary}
            onPress={() => void Linking.openURL("tel:192")}
          >
            <Text style={styles.secondaryText}>Abrir ligação para o SAMU</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  const origin = url.origin;
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <WebView
        ref={web}
        source={{ uri: url.toString() }}
        style={styles.web}
        originWhitelist={[
          "https://*",
          ...(process.env.EXPO_PUBLIC_ALLOW_HTTP === "true"
            ? ["http://*"]
            : []),
          "tel:*",
        ]}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#2B6CB0" />
            <Text style={styles.text}>Preparando seu cuidado…</Text>
          </View>
        )}
        onNavigationStateChange={(s) => setCanGoBack(s.canGoBack)}
        onError={() => setFailed(true)}
        onHttpError={(e) => {
          if (e.nativeEvent.statusCode >= 500) setFailed(true);
        }}
        onShouldStartLoadWithRequest={(req) => {
          if (req.url.startsWith("tel:")) {
            void Linking.openURL(req.url).catch(() => setFailed(true));
            return false;
          }
          try {
            return new URL(req.url).origin === origin;
          } catch {
            return false;
          }
        }}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7FAFC" },
  web: { flex: 1, backgroundColor: "#F7FAFC" },
  notice: { flex: 1, justifyContent: "center", padding: 28 },
  brand: {
    fontSize: 42,
    fontWeight: "700",
    color: "#2B6CB0",
    marginBottom: 40,
  },
  title: {
    fontSize: 27,
    fontWeight: "600",
    color: "#1A365D",
    lineHeight: 36,
    marginBottom: 20,
  },
  text: { fontSize: 18, lineHeight: 30, color: "#64748B", marginBottom: 20 },
  button: {
    backgroundColor: "#2B6CB0",
    minHeight: 56,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  buttonText: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  secondary: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginTop: 15,
  },
  secondaryText: { fontSize: 18, color: "#C7353B", fontWeight: "600" },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F7FAFC",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
});
