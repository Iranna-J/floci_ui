package com.example.flociapp.entity;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

import java.time.Instant;
import java.util.UUID;

@DynamoDbBean
public class Note {

    private String id;
    private String content;
    private String createdAt;

    public Note() {
    }

    public Note(String content) {
        this.id = UUID.randomUUID().toString();
        this.content = content;
        this.createdAt = Instant.now().toString();
    }

    public Note(String id, String content) {
        this.id = id;
        this.content = content;
        this.createdAt = Instant.now().toString();
    }

    @DynamoDbPartitionKey
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
