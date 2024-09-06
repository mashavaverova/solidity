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
    address[] sharedWith;
}

    enum ContractState { Active, Paused }
    ContractState public state;

    address public owner;
    uint256 private nextNoteId = 1;  

    mapping(uint256 => Note) private notes; 
    mapping(address => uint256[]) private userNotes; 

    event NoteCreated(uint256 noteId, address owner);
    event NoteUpdated(uint256 noteId);
    event NoteDeleted(uint256 noteId);

// Custom errors for gas optimization (saves gas compared to using strings in require)
    error NotOwner();
    error ContractPaused();
    error AccessDenied();

    // Modifier to ensure functions can only be called when the contract is active (security)
    modifier onlyWhenActive() {
          if (state != ContractState.Active) revert ContractPaused();
    _;
}

    // Modifier to restrict certain functions to the owner (security)
    modifier onlyOwner() {
       if (msg.sender != owner) revert NotOwner();
    _;
}

    constructor() {
        owner = msg.sender;
        state = ContractState.Active; 
    }
    
    function createNote(
        string memory _title,
        string memory _content,
        bool _isPublic,
        address[] memory _sharedWith
    ) public onlyWhenActive {
       uint256 noteId = userNotes[msg.sender].length + 1; // Gas optimization: Using length instead of tracking nextNoteId separately
        Note storage newNote = notes[noteId]; // Storing in memory to save gas on unnecessary storage writes

        newNote.owner = msg.sender;
        newNote.noteId = noteId;
        newNote.title = _title;
        newNote.dateOfCreation = block.timestamp;
        newNote.content = _content;
        newNote.isPublic = _isPublic;

       // Optimized loop for sharedWith addresses
        for (uint256 i = 0; i < _sharedWith.length; i++) {
            newNote.sharedWith.push(_sharedWith[i]);
        }
        userNotes[msg.sender].push(noteId);

        emit NoteCreated(noteId, msg.sender);
    }

    function readNote(uint256 _noteId) public view onlyWhenActive returns (string memory title, string memory content, uint256 dateOfCreation) {
        Note storage note = notes[_noteId];

    // Security check: Ensure only the owner or a shared user can read the note
        require(note.isPublic || note.owner == msg.sender || isSharedWith(note, msg.sender), "Access Denied");
        return (note.title, note.content, note.dateOfCreation);
    }

    function isSharedWith(Note storage note, address user) internal view returns (bool) {
        for (uint256 i = 0; i < note.sharedWith.length; i++) {
            if (note.sharedWith[i] == user) {
                return true;
            }
        }
        return false;
    }

    function updateSharingSettings(
        uint256 _noteId,
        bool _newIsPublic,
        address[] memory _newSharedWith
    ) public onlyWhenActive {
        Note storage note = notes[_noteId];
        require(note.owner == msg.sender, "Only the owner can update sharing settings");

        note.isPublic = _newIsPublic;

        // Gas optimization: delete the old array before adding new addresses
        delete note.sharedWith;
        for (uint256 i = 0; i < _newSharedWith.length; i++) {
            note.sharedWith.push(_newSharedWith[i]);
        }

        emit NoteUpdated(_noteId);
    }


    function getUserNotes(address _user) public view returns (uint256[] memory) {
        return userNotes[_user];
    }

    function deleteNote(uint256 _noteId) public {
        Note storage note = notes[_noteId];
        require(note.owner == msg.sender, "Only the owner can delete this note");

        // Security: deleting the note entirely from storage
        delete notes[_noteId];

        // Gas optimization: reduce the array size without leaving gaps by swapping and popping
        uint256[] storage userNoteIds = userNotes[msg.sender];
        for (uint256 i = 0; i < userNoteIds.length; i++) {
            if (userNoteIds[i] == _noteId) {
                userNoteIds[i] = userNoteIds[userNoteIds.length - 1];
                userNoteIds.pop();
                break;
            }
        }

        emit NoteDeleted(_noteId);
    }

     function pauseContract() public onlyOwner {
    state = ContractState.Paused;
    }

    function resumeContract() public onlyOwner {
    state = ContractState.Active;
    }

    fallback() external payable {
    revert("Contract does not accept Ether");  // Security: rejects any Ether sent to the contract
}

    receive() external payable {
    revert("Contract does not accept Ether"); // Security: rejects any Ether sent to the contract
}

}
