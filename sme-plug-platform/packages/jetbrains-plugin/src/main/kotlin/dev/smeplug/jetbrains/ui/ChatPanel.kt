package dev.smeplug.jetbrains.ui

import com.intellij.openapi.project.Project
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.components.JBTextArea
import com.intellij.util.ui.JBUI
import dev.smeplug.jetbrains.SMEPlugClient
import dev.smeplug.jetbrains.settings.SMEPlugSettings
import java.awt.BorderLayout
import java.awt.event.KeyAdapter
import java.awt.event.KeyEvent
import javax.swing.*

/**
 * Chat panel UI for the SME-Plug tool window.
 */
class ChatPanel(private val project: Project) {

    private val chatHistory = JBTextArea().apply {
        isEditable = false
        lineWrap = true
        wrapStyleWord = true
        font = JBUI.Fonts.create("Monospaced", 12)
        border = JBUI.Borders.empty(8)
        text = "🔌 SME-Plug\nAsk your domain expert anything.\nResponses include verified citations.\n\n"
    }

    private val inputField = JBTextArea(2, 40).apply {
        lineWrap = true
        wrapStyleWord = true
        font = JBUI.Fonts.create("Monospaced", 12)
        border = JBUI.Borders.empty(4)
        emptyText.text = "Ask your SME expert..."
    }

    private val sendButton = JButton("Send").apply {
        addActionListener { sendMessage() }
    }

    private val mainPanel = JPanel(BorderLayout()).apply {
        val scrollPane = JBScrollPane(chatHistory)
        add(scrollPane, BorderLayout.CENTER)

        val inputPanel = JPanel(BorderLayout()).apply {
            border = JBUI.Borders.customLine(JBUI.CurrentTheme.CustomFrameDecorations.separatorForeground(), 1, 0, 0, 0)
            add(JBScrollPane(inputField), BorderLayout.CENTER)
            add(sendButton, BorderLayout.EAST)
        }
        add(inputPanel, BorderLayout.SOUTH)
    }

    init {
        inputField.addKeyListener(object : KeyAdapter() {
            override fun keyPressed(e: KeyEvent) {
                if (e.keyCode == KeyEvent.VK_ENTER && !e.isShiftDown) {
                    e.consume()
                    sendMessage()
                }
            }
        })
    }

    fun getComponent(): JComponent = mainPanel

    private fun sendMessage() {
        val message = inputField.text.trim()
        if (message.isEmpty()) return

        inputField.text = ""
        appendToChat("You: $message\n")

        // Run API call in background
        SwingWorker.execute {
            try {
                val settings = SMEPlugSettings.getInstance()
                if (settings.apiKey.isEmpty()) {
                    appendToChat("⚠ API key not set. Go to Settings → Tools → SME-Plug.\n\n")
                    return@execute
                }

                val client = SMEPlugClient(settings.apiKey, settings.pluginId)
                val response = client.chat(message)

                appendToChat("SME: ${response.text}\n")
                if (response.verified) {
                    appendToChat("  ✓ Verified\n")
                }
                appendToChat("\n")
            } catch (e: Exception) {
                appendToChat("⚠ Error: ${e.message}\n\n")
            }
        }
    }

    private fun appendToChat(text: String) {
        SwingUtilities.invokeLater {
            chatHistory.append(text)
            chatHistory.caretPosition = chatHistory.document.length
        }
    }
}

// Simple SwingWorker helper
private object SwingWorker {
    fun execute(task: () -> Unit) {
        Thread(task).apply { isDaemon = true }.start()
    }
}
