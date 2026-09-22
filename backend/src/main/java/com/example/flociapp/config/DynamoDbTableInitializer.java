package com.example.flociapp.config;

import com.example.flociapp.entity.Note;
import com.example.flociapp.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.services.dynamodb.model.ResourceNotFoundException;

@Component
public class DynamoDbTableInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DynamoDbTableInitializer.class);

    private final DynamoDbTable<User> userTable;
    private final DynamoDbTable<Note> noteTable;

    public DynamoDbTableInitializer(DynamoDbEnhancedClient enhancedClient) {
        this.userTable = enhancedClient.table("Users", TableSchema.fromBean(User.class));
        this.noteTable = enhancedClient.table("Notes", TableSchema.fromBean(Note.class));
    }

    @Override
    public void run(ApplicationArguments args) {
        initializeTable("Users", userTable);
        initializeTable("Notes", noteTable);
    }

    private <T> void initializeTable(String tableName, DynamoDbTable<T> table) {
        try {
            log.info("Checking if DynamoDB table '{}' exists in Floci...", tableName);
            try {
                table.describeTable();
                log.info("DynamoDB table '{}' already exists in Floci.", tableName);
            } catch (ResourceNotFoundException e) {
                log.info("DynamoDB table '{}' does not exist. Creating it now...", tableName);
                table.createTable();
                log.info("Successfully created DynamoDB table '{}' in Floci!", tableName);
            }
        } catch (Exception e) {
            log.warn("Notice during DynamoDB initialization for '{}': {}. Ensure Floci is running on port 4566.",
                    tableName, e.getMessage());
        }
    }
}
