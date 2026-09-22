package com.example.flociapp.config;

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

    public DynamoDbTableInitializer(DynamoDbEnhancedClient enhancedClient) {
        this.userTable = enhancedClient.table("Users", TableSchema.fromBean(User.class));
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            log.info("Checking if DynamoDB table 'Users' exists in Floci...");
            try {
                userTable.describeTable();
                log.info("DynamoDB table 'Users' already exists in Floci.");
            } catch (ResourceNotFoundException e) {
                log.info("DynamoDB table 'Users' does not exist. Creating it now...");
                userTable.createTable();
                log.info("Successfully created DynamoDB table 'Users' in Floci!");
            }
        } catch (Exception e) {
            log.warn("Notice during DynamoDB initialization: {}. Ensure Floci is running on port 4566.", e.getMessage());
        }
    }
}
