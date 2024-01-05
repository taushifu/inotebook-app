const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const fetchuser = require('../middleware/fetchuser');
const { check, validationResult } = require('express-validator');


//ROUTE 1: To fetch all notes of any user (Login required)
router.get('/fetchallnotes', fetchuser, async (req, res) => {
    try {
        //Showing notes of the user whose id is sent in the JWT token, i.e. req.user.id
        const notes = await Note.find({ userId: req.user.id });
        res.json(notes);
    } catch (err) {
        console.error('Error fetching notes', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


//ROUTE 2: To create new note (Login required)
router.post('/addnote', fetchuser, [
    check('title', 'Insert title').exists(),
    check('description', 'Insert description').exists()
], async (req, res) => {
    const errors = validationResult(req);

    //if error is there, return bad request.
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, tag } = req.body; //Destructuring from request body

    try {
        const newNote = new Note({
            userId: req.user.id, //from fetchuser middleware
            title: title,
            description: description,
            tag: tag
        })
        const savedNote = await newNote.save();
        res.json({ savedNote });

    } catch (err) {
        console.log('Error saving note: ', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


//ROUTE 3: To update any note (Login required)
router.put('/updatenote/:id', fetchuser, async (req, res) => {
    //create updated note
    const newNote = {};
    const { title, description, tag } = req.body;

    //to check which fields user wants to update
    if (title) { newNote.title = title };
    if (description) { newNote.description = description };
    if (tag) { newNote.tag = tag };
    try {
        //to check if the requested note is available or not
        const existingNote = await Note.findById(req.params.id);
        if (!existingNote) { return res.status(401).send('Not found') };

        //to check if the logged in user is authorised to update the requested note
        const userIdInNote = existingNote.userId.toString();
        const loggedInUserId = req.user.id;
        if (userIdInNote !== loggedInUserId) { return res.status(401).send('Not authorised to update') };

        //update note
        const updatedNote = await Note.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true });
        res.send(updatedNote);

    } catch (err) {
        console.log('Error updating note: ', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/deletenote/:id', fetchuser, async (req, res) => {
    const noteId = req.params.id;
    try {
        //check if the requested note is available
        const note = await Note.findById(noteId);
        if (!note) { return res.status(401).send('Not found') };

        //check if the logged in user is authorised to delete the requested note
        const loggedInUserId = req.user.id;
        const userIdInNote = note.userId.toString();
        if (userIdInNote !== loggedInUserId) { return res.status(401).send('Not authorised to delete') };

        //delete note
        await Note.findByIdAndDelete(noteId);
        res.send('Note deleted');
    } catch (err) {
        console.log('Error updating note: ', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;