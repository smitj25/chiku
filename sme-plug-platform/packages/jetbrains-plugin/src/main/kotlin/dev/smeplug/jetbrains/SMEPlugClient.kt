package dev.smeplug.jetbrains

import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

/**
 * HTTP client for communicating with the SME-Plug API.
 *
 * Usage:
 *   val client = SMEPlugClient("sme_live_xxxx", "legal-v1")
 *   val response = client.chat("What does clause 4.2 mean?")
 */
class SMEPlugClient(
    private val apiKey: String,
    private val pluginId: String,
    private val baseUrl: String = "https://api.smeplug.dev"
) {
    private val httpClient = HttpClient.newHttpClient()
    private var sessionId: String? = null

    data class ChatResponse(
        val text: String,
        val citations: List<Citation>,
        val verified: Boolean,
        val ragasScore: Double,
        val sessionId: String
    )

    data class Citation(
        val source: String,
        val page: Int,
        val relevance: Double
    )

    /**
     * Send a chat message to the SME plugin.
     */
    fun chat(message: String): ChatResponse {
        val body = """
            {
                "message": "${message.replace("\"", "\\\"")}",
                "plugin_id": "$pluginId",
                "session_id": ${sessionId?.let { "\"$it\"" } ?: "null"}
            }
        """.trimIndent()

        val request = HttpRequest.newBuilder()
            .uri(URI.create("$baseUrl/v1/chat"))
            .header("Authorization", "Bearer $apiKey")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build()

        val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())

        if (response.statusCode() != 200) {
            throw RuntimeException("API error ${response.statusCode()}: ${response.body()}")
        }

        // Simple JSON parsing (in production, use kotlinx.serialization or Gson)
        val responseBody = response.body()
        val text = extractJsonString(responseBody, "response")
        val verified = responseBody.contains("\"verified\":true") || responseBody.contains("\"verified\": true")
        val sid = extractJsonString(responseBody, "session_id")

        sessionId = sid

        return ChatResponse(
            text = text,
            citations = emptyList(), // TODO: Parse citations array
            verified = verified,
            ragasScore = 0.0, // TODO: Parse from response
            sessionId = sid
        )
    }

    fun clearSession() {
        sessionId = null
    }

    private fun extractJsonString(json: String, key: String): String {
        val pattern = "\"$key\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"".toRegex()
        return pattern.find(json)?.groupValues?.get(1) ?: ""
    }
}
