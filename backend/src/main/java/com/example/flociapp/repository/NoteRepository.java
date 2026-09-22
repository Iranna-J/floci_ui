package com.example.flociapp.repository;

import com.example.flociapp.entity.Note;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class NoteRepository {

    private final DynamoDbTable<Note> noteTable;

    public NoteRepository(DynamoDbEnhancedClient enhancedClient) {
        this.noteTable = enhancedClient.table("Notes", TableSchema.fromBean(Note.class));
    }

    public void save(Note note) {
        noteTable.putItem(note);
    }

    public Optional<Note> findById(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }
        Key key = Key.builder().partitionValue(id).build();
        return Optional.ofNullable(noteTable.getItem(key));
    }

    public List<Note> findAll() {
        List<Note> notes = new ArrayList<>();
        noteTable.scan().items().forEach(notes::add);
        return notes;
    }

    public void deleteById(String id) {
        Key key = Key.builder().partitionValue(id).build();
        noteTable.deleteItem(key);
    }
}
