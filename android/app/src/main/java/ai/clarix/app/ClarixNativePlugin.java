package ai.clarix.app;

import android.os.Build;
import android.view.autofill.AutofillManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Called from the page script: screen orientation, and telling the phone a login worked. */
@CapacitorPlugin(name = "ClarixNative")
public class ClarixNativePlugin extends Plugin {

    @PluginMethod
    public void setOrientation(PluginCall call) {
        ((MainActivity) getActivity()).applyOrientation(call.getString("mode", "landscape"));
        call.resolve();
    }

    /**
     * The login succeeded: let the phone's password manager (e.g. Google Password
     * Manager) offer to save the user ID and password. Nothing is stored by the app.
     */
    @PluginMethod
    public void loginSucceeded(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getActivity().runOnUiThread(() -> {
                AutofillManager afm = getActivity().getSystemService(AutofillManager.class);
                if (afm != null) afm.commit();
            });
        }
        call.resolve();
    }
}
