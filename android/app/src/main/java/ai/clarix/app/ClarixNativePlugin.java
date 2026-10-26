package ai.clarix.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Called from the page script: screen orientation and saved login. */
@CapacitorPlugin(name = "ClarixNative")
public class ClarixNativePlugin extends Plugin {

    @PluginMethod
    public void setOrientation(PluginCall call) {
        ((MainActivity) getActivity()).applyOrientation(call.getString("mode", "landscape"));
        call.resolve();
    }

    @PluginMethod
    public void saveLogin(PluginCall call) {
        CredentialStore.save(getContext(), call.getString("username", ""), call.getString("password", ""));
        call.resolve();
    }

    @PluginMethod
    public void getLogin(PluginCall call) {
        JSObject result = new JSObject();
        String[] saved = CredentialStore.load(getContext());
        if (saved != null) {
            result.put("username", saved[0]);
            result.put("password", saved[1]);
        }
        call.resolve(result);
    }

    @PluginMethod
    public void clearLogin(PluginCall call) {
        CredentialStore.clear(getContext());
        call.resolve();
    }
}
