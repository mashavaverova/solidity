// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

contract Notes {
    struct Note {
        address owner;
        bool isPublic;           
        uint256 noteId;
        uint256 dateOfCreation;
        string title;
        string content;
        address[] sharedWith; // Stores addresses with whom the note is shared
    }

    // Enum to manage contract state
    enum ContractState { Active, Paused }
    ContractState public state;

    address public owner;
    uint256 private nextNoteId = 1;  

    mapping(uint256 => Note) private notes; // Stores notes by ID
    mapping(address => uint256[]) private userNotes; // Stores user’s note IDs

    event NoteCreated(uint256 noteId, address owner);
    event NoteUpdated(uint256 noteId);
    event NoteDeleted(uint256 noteId);

    // Custom errors for gas optimization (replaces require statements with revert)
    error NotOwner();
    error ContractPaused();
    error AccessDenied();

    // Modifier to ensure that functions are executed only when the contract is active
    modifier onlyWhenActive() {
        if (state != ContractState.Active) revert ContractPaused();
        _;
    }

    // Modifier to restrict functions to the contract owner
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
        state = ContractState.Active; 
    }

    /**
     * @dev Create a new note.
     * Gas Optimization: Uses length of user's notes array for the next note ID.
     */
    function createNote(
        string memory _title,
        string memory _content,
        bool _isPublic,
        address[] memory _sharedWith
    ) public onlyWhenActive {
        uint256 noteId = userNotes[msg.sender].length + 1; // Gas optimization by not tracking `nextNoteId`

        Note storage newNote = notes[noteId]; // Efficient use of storage

        newNote.owner = msg.sender;
        newNote.noteId = noteId;
        newNote.title = _title;
        newNote.dateOfCreation = block.timestamp;
        newNote.content = _content;
        newNote.isPublic = _isPublic;

        // Looping through sharedWith array, pushing addresses into storage
        for (uint256 i = 0; i < _sharedWith.length; i++) {
            newNote.sharedWith.push(_sharedWith[i]);
        }

        userNotes[msg.sender].push(noteId); // Track note IDs for the user

        emit NoteCreated(noteId, msg.sender); // Emit event for tracking
    }

    /**
     * @dev Read a note by its ID.
     * Security: Only the owner, shared users, or public notes can be read.
     */
    function readNote(uint256 _noteId) 
        public 
        view 
        onlyWhenActive 
        returns (string memory title, string memory content, uint256 dateOfCreation) 
    {
        Note storage note = notes[_noteId];

        // Ensure the note is public, owned by the caller, or shared with the caller
        require(note.isPublic || note.owner == msg.sender || isSharedWith(note, msg.sender), "Access Denied");

        return (note.title, note.content, note.dateOfCreation);
    }

    /**
     * @dev Checks if a note is shared with a specific address.
     * Gas optimization: Internal function to reduce duplicated code.
     */
    function isSharedWith(Note storage note, address user) internal view returns (bool) {
        for (uint256 i = 0; i < note.sharedWith.length; i++) {
            if (note.sharedWith[i] == user) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Update sharing settings for a note.
     * Gas Optimization: Deletes and replaces the sharedWith array to save gas.
     */
    function updateSharingSettings(
        uint256 _noteId,
        bool _newIsPublic,
        address[] memory _newSharedWith
    ) public onlyWhenActive {
        Note storage note = notes[_noteId];
        require(note.owner == msg.sender, "Only the owner can update sharing settings");

        note.isPublic = _newIsPublic;

        // Delete the old sharedWith array to save gas and prevent duplication
        delete note.sharedWith;
        for (uint256 i = 0; i < _newSharedWith.length; i++) {
            note.sharedWith.push(_newSharedWith[i]);
        }

        emit NoteUpdated(_noteId);
    }

    /**
     * @dev Returns the list of note IDs for a specific user.
     */
    function getUserNotes(address _user) public view returns (uint256[] memory) {
        return userNotes[_user]; // Returns an array of note IDs
    }

    /**
     * @dev Delete a note by its ID.
     * Security: Only the owner of the note can delete it.
     * Gas Optimization: Uses swap-and-pop method to remove notes from the array.
     */
    function deleteNote(uint256 _noteId) public {
        Note storage note = notes[_noteId];
        require(note.owner == msg.sender, "Only the owner can delete this note");

        // Delete the note from storage
        delete notes[_noteId];

        // Swap-and-pop method to remove the note ID from userNotes without gaps
        uint256[] storage userNoteIds = userNotes[msg.sender];
        for (uint256 i = 0; i < userNoteIds.length; i++) {
            if (userNoteIds[i] == _noteId) {
                userNoteIds[i] = userNoteIds[userNoteIds.length - 1];
                userNoteIds.pop(); // Reduce array size
                break;
            }
        }

        emit NoteDeleted(_noteId); // Emit event for tracking
    }

    /**
     * @dev Pauses the contract, restricting access to certain functions.
     * Security: Only callable by the contract owner.
     */
    function pauseContract() public onlyOwner {
        state = ContractState.Paused;
    }

    /**
     * @dev Resumes the contract.
     * Security: Only callable by the contract owner.
     */
    function resumeContract() public onlyOwner {
        state = ContractState.Active;
    }

    /**
     * @dev Fallback function to reject any Ether sent to the contract.
     * Security: Prevents accidental or malicious Ether transfers.
     */
    fallback() external payable {
        revert("Contract does not accept Ether");
    }

    /**
     * @dev Receive function to reject any Ether sent to the contract.
     * Security: Ensures the contract cannot accidentally receive Ether.
     */
    receive() external payable {
        revert("Contract does not accept Ether");
    }
}
