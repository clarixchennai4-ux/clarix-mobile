package ai.clarix.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Lets the page script rotate the app for Power BI full screen. */
@CapacitorPlugin(name = "ClarixNative")
public class ClarixNativePlugin extends Plugin {
    @PluginMethod
    public void setLandscape(PluginCall call) {
        boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        ((MainActivity) getActivity()).setFullScreenLandscape(on);
        call.resolve();
    }
}
