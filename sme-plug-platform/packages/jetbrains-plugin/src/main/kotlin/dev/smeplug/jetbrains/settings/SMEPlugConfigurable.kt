package dev.smeplug.jetbrains.settings

import com.intellij.openapi.options.Configurable
import com.intellij.ui.components.JBPasswordField
import com.intellij.ui.components.JBTextField
import com.intellij.util.ui.FormBuilder
import javax.swing.JComponent
import javax.swing.JComboBox
import javax.swing.JPanel

/**
 * Settings page UI: Settings → Tools → SME-Plug
 */
class SMEPlugConfigurable : Configurable {

    private var apiKeyField: JBPasswordField? = null
    private var pluginIdCombo: JComboBox<String>? = null
    private var apiUrlField: JBTextField? = null

    private val pluginOptions = arrayOf(
        "legal-v1",
        "healthcare-v1",
        "engineering-v1",
        "finance-v1",
        "education-v1",
        "cyber-v1"
    )

    override fun getDisplayName(): String = "SME-Plug"

    override fun createComponent(): JComponent {
        val settings = SMEPlugSettings.getInstance()

        apiKeyField = JBPasswordField().apply {
            text = settings.apiKey
            columns = 40
        }

        pluginIdCombo = JComboBox(pluginOptions).apply {
            selectedItem = settings.pluginId
        }

        apiUrlField = JBTextField(settings.apiUrl).apply {
            columns = 40
        }

        return FormBuilder.createFormBuilder()
            .addLabeledComponent("API Key:", apiKeyField!!)
            .addLabeledComponent("Plugin:", pluginIdCombo!!)
            .addLabeledComponent("API URL:", apiUrlField!!)
            .addComponentFillVertically(JPanel(), 0)
            .panel
    }

    override fun isModified(): Boolean {
        val settings = SMEPlugSettings.getInstance()
        return String(apiKeyField?.password ?: charArrayOf()) != settings.apiKey ||
                pluginIdCombo?.selectedItem?.toString() != settings.pluginId ||
                apiUrlField?.text != settings.apiUrl
    }

    override fun apply() {
        val settings = SMEPlugSettings.getInstance()
        settings.apiKey = String(apiKeyField?.password ?: charArrayOf())
        settings.pluginId = pluginIdCombo?.selectedItem?.toString() ?: "legal-v1"
        settings.apiUrl = apiUrlField?.text ?: "https://api.smeplug.dev"
    }

    override fun reset() {
        val settings = SMEPlugSettings.getInstance()
        apiKeyField?.text = settings.apiKey
        pluginIdCombo?.selectedItem = settings.pluginId
        apiUrlField?.text = settings.apiUrl
    }

    override fun disposeUIResources() {
        apiKeyField = null
        pluginIdCombo = null
        apiUrlField = null
    }
}
