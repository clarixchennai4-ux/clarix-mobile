package ai.clarix.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * Remembers the last successful Clarix login on this phone.
 * The password is encrypted with a key kept in the Android Keystore,
 * so it can't be read from the app's files or from a backup.
 */
final class CredentialStore {
    private static final String KEY_ALIAS = "clarix_login_key";
    private static final String PREFS = "clarix_login";

    private CredentialStore() {}

    private static SecretKey key() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        if (!ks.containsAlias(KEY_ALIAS)) {
            KeyGenerator kg = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
            kg.init(new KeyGenParameterSpec.Builder(KEY_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build());
            kg.generateKey();
        }
        return ((KeyStore.SecretKeyEntry) ks.getEntry(KEY_ALIAS, null)).getSecretKey();
    }

    private static String encrypt(String plain) throws Exception {
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, key());
        byte[] ct = c.doFinal(plain.getBytes(StandardCharsets.UTF_8));
        return Base64.encodeToString(c.getIV(), Base64.NO_WRAP) + ":" + Base64.encodeToString(ct, Base64.NO_WRAP);
    }

    private static String decrypt(String stored) throws Exception {
        String[] parts = stored.split(":", 2);
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, Base64.decode(parts[0], Base64.NO_WRAP)));
        return new String(c.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)), StandardCharsets.UTF_8);
    }

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static void save(Context ctx, String username, String password) {
        if (username == null || username.isEmpty() || password == null || password.isEmpty()) return;
        try {
            prefs(ctx).edit().putString("u", username).putString("p", encrypt(password)).apply();
        } catch (Exception ignored) {}
    }

    /** @return {username, password}, or null if nothing is saved */
    static String[] load(Context ctx) {
        try {
            String u = prefs(ctx).getString("u", null);
            String p = prefs(ctx).getString("p", null);
            if (u == null || p == null) return null;
            return new String[] { u, decrypt(p) };
        } catch (Exception e) {
            clear(ctx); // key lost (e.g. restored backup) — start fresh
            return null;
        }
    }

    static void clear(Context ctx) {
        prefs(ctx).edit().clear().apply();
    }
}
