package com.example.flociapp.controller;

import com.example.flociapp.dto.NoteRequest;
import com.example.flociapp.entity.Note;
import com.example.flociapp.repository.NoteRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteRepository noteRepository;

    public NoteController(NoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    @PostMapping
    public ResponseEntity<Note> createNote(@RequestBody(required = false) NoteRequest request) {
        String content = (request != null && request.getContent() != null) ? request.getContent() : "Empty Note";
        Note note = new Note(content);
        noteRepository.save(note);
        return ResponseEntity.ok(note);
    }

    @GetMapping
    public ResponseEntity<List<Note>> getAllNotes() {
        return ResponseEntity.ok(noteRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getNoteById(@PathVariable String id) {
        return noteRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteNote(@PathVariable String id) {
        noteRepository.deleteById(id);
        return ResponseEntity.ok("Deleted note with ID: " + id);
    }
}
