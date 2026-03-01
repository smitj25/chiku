package dev.smeplug.jetbrains.settings

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.*

/**
 * Persistent settings for the SME-Plug plugin.
 * Stores API key, selected plugin, and API URL.
 */
@State(
    name = "SMEPlugSettings",
    storages = [Storage("smeplug.xml")]
)
@Service(Service.Level.APP)
class SMEPlugSettings : PersistentStateComponent<SMEPlugSettings.State> {

    data class State(
        var apiKey: String = "",
        var pluginId: String = "legal-v1",
        var apiUrl: String = "https://api.smeplug.dev"
    )

    private var myState = State()

    override fun getState(): State = myState

    override fun loadState(state: State) {
        myState = state
    }

    var apiKey: String
        get() = myState.apiKey
        set(value) { myState.apiKey = value }

    var pluginId: String
        get() = myState.pluginId
        set(value) { myState.pluginId = value }

    var apiUrl: String
        get() = myState.apiUrl
        set(value) { myState.apiUrl = value }

    companion object {
        fun getInstance(): SMEPlugSettings =
            ApplicationManager.getApplication().getService(SMEPlugSettings::class.java)
    }
}
