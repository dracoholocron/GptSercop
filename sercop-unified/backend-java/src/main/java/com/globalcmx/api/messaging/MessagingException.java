package com.globalcmx.api.messaging;

/**
 * Exception thrown when messaging operations fail.
 * This exception is thrown instead of silently swallowing errors,
 * allowing callers to handle messaging failures appropriately.
 */
public class MessagingException extends RuntimeException {

    private final String topicName;
    private final MessagingProvider provider;

    public MessagingException(String message, String topicName, MessagingProvider provider) {
        super(message);
        this.topicName = topicName;
        this.provider = provider;
    }

    public MessagingException(String message, String topicName, MessagingProvider provider, Throwable cause) {
        super(message, cause);
        this.topicName = topicName;
        this.provider = provider;
    }

    public String getTopicName() {
        return topicName;
    }

    public MessagingProvider getProvider() {
        return provider;
    }

    @Override
    public String toString() {
        return String.format("MessagingException[provider=%s, topic=%s]: %s",
            provider, topicName, getMessage());
    }
}
